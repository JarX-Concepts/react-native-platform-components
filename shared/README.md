# Shared C++ Code for Yoga Shadow Node Measurement

This directory contains cross-platform C++ code that enables native components to report their measured sizes to React Native's Yoga layout engine. This allows components like `DatePicker` and `SelectionMenu` to have "perfect" sizing based on their actual native content, rather than relying on hardcoded dimensions.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         React Native (JS)                               │
│   <DatePicker />  <SelectionMenu />                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Yoga Layout Engine (C++)                             │
│                                                                         │
│   Calls measureContent() on shadow nodes to determine intrinsic size    │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Custom Shadow Nodes (this directory)                       │
│                                                                         │
│   MeasuringPCDatePickerShadowNode                                       │
│   MeasuringPCSelectionMenuShadowNode                                    │
│                                                                         │
│   - Marked as LeafYogaNode + MeasurableYogaNode                         │
│   - Override measureContent() to return size from state                 │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Custom State (this directory)                        │
│                                                                         │
│   PCDatePickerStateFrameSize { Size frameSize }                         │
│   PCSelectionMenuStateFrameSize { Size frameSize }                      │
│                                                                         │
│   - Holds measured dimensions from native                               │
│   - Supports serialization for Android (folly::dynamic)                 │
└─────────────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │
┌─────────────────────────────────────────────────────────────────────────┐
│                      Native Views (iOS/Android)                         │
│                                                                         │
│   iOS: PCDatePickerView, PCSelectionMenuView                            │
│   Android: PCDatePickerView, PCSelectionMenuView                        │
│                                                                         │
│   - Measure actual native content                                       │
│   - Call state->updateState() with measured frameSize                   │
│   - Triggers Yoga re-layout with correct dimensions                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Shadow Node Traits

Shadow nodes are marked with two critical traits:

```cpp
static ShadowNodeTraits BaseTraits() {
  auto traits = ConcreteViewShadowNode::BaseTraits();
  traits.set(ShadowNodeTraits::Trait::LeafYogaNode);      // No Yoga children
  traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode); // Has measureContent()
  return traits;
}
```

- **LeafYogaNode**: Tells Yoga this node has no children to layout
- **MeasurableYogaNode**: Tells Yoga to call `measureContent()` for intrinsic sizing

### 2. Measurement Flow

```cpp
Size measureContent(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const override {

  // Get the measured size from native (via state)
  const auto& stateData = this->getStateData();
  Float measuredW = stateData.frameSize.width;
  Float measuredH = stateData.frameSize.height;

  // Apply layout constraints and return
  return layoutConstraints.clamp(Size{measuredW, measuredH});
}
```

### 3. Native → Shadow Node Communication (State)

Native views measure their content and update the shadow node's state:

**iOS (Objective-C++):**
```objc
- (void)updateMeasurements {
  CGSize size = [_nativeView sizeForLayoutWithConstrainedTo:...];

  PCDatePickerStateFrameSize next;
  next.frameSize = {(Float)size.width, (Float)size.height};
  _state->updateState(std::move(next));
}
```

**Android (Kotlin + JNI):**
```kotlin
private fun updateMeasurements(width: Float, height: Float) {
  updateState(width, height)  // JNI call to C++
}
```

### 4. State Serialization (Android)

Android requires state to be serializable via `folly::dynamic`:

```cpp
struct PCDatePickerStateFrameSize {
#ifdef RN_SERIALIZABLE_STATE
  // Constructor from dynamic data
  PCDatePickerStateFrameSize(
      const PCDatePickerStateFrameSize& previousState,
      folly::dynamic data) {
    if (data.isObject() && data.count("width") && data.count("height")) {
      frameSize.width = static_cast<Float>(data["width"].asDouble());
      frameSize.height = static_cast<Float>(data["height"].asDouble());
    }
  }

  folly::dynamic getDynamic() const {
    return folly::dynamic::object("width", frameSize.width)("height", frameSize.height);
  }
#endif
};
```

## File Structure

| File | Purpose |
|------|---------|
| `PC*ShadowNode-custom.h` | Shadow node class declaration with `measureContent()` |
| `PC*ShadowNode-custom.cpp` | `measureContent()` implementation |
| `PC*State-custom.h` | State struct holding `frameSize` from native |
| `PC*ComponentDescriptors-custom.h` | Type alias for component descriptor using custom shadow node |

## Fallback Behavior

When native hasn't yet reported measurements (state is empty), the shadow nodes use platform-specific fallback heights:

```cpp
// SelectionMenu fallbacks
static constexpr float kFallbackHeightIOS = 44.0f;        // iOS standard row
static constexpr float kFallbackHeightAndroid = 56.0f;    // Android Spinner
static constexpr float kFallbackHeightAndroidM3 = 72.0f;  // Android M3 TextInputLayout
```

This prevents layout jumps on initial render before native measurement completes.

## Integration Points

### iOS

- `ios/PCDatePicker.mm` - Calls `updateMeasurements` when props change
- `ios/PCSelectionMenu.mm` - Calls `updateMeasurements` when props change

### Android

- `android/.../PCDatePickerView.kt` - Calls JNI `updateState()` after measure
- `android/.../PCSelectionMenuView.kt` - Calls JNI `updateState()` after measure
- `android/src/main/jni/OnLoad.cpp` - JNI bridge for state updates

## Common Pitfalls

1. **Circular includes**: Shadow node headers should NOT include ComponentDescriptors.h. Use forward declarations instead.

2. **State timing**: Native measurement may happen after initial Yoga layout. Always provide sensible fallback values.

3. **Width constraints**: When width isn't measured (0), use `layoutConstraints.maximumSize.width` as the width.

4. **Android serialization**: The `RN_SERIALIZABLE_STATE` macro gates Android-specific serialization code.
