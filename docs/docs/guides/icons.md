---
title: 'Icons'
description: 'SF Symbols on iOS and drawables or images on Android for ContextMenu, SegmentedControl, Button, ButtonGroup and TextField icons, including your own SVG icons.'
---

ContextMenu supports icons on menu items. Icons are specified by name and resolved differently on each platform. SegmentedControl, Button, ButtonGroup and TextField accept the same names, plus image assets and per-platform pairs (the `PlatformIcon` type); see [SegmentedControl Icon Support](/components/segmentedcontrol#icon-support).

### iOS

Use [SF Symbols](https://developer.apple.com/sf-symbols/) names. These are built into iOS and require no additional setup.

```tsx
// Common SF Symbols
image: 'doc.on.doc'; // Copy
image: 'square.and.arrow.up'; // Share
image: 'trash'; // Delete
image: 'pencil'; // Edit
image: 'checkmark.circle'; // Checkmark
```

Browse available symbols using Apple's SF Symbols app or [sfsymbols.com](https://sfsymbols.com).

### Android

Use drawable resource names from your app's `res/drawable` directory. You must add these resources yourself.

```tsx
// Reference drawable by name (without extension)
image: 'content_copy'; // res/drawable/content_copy.xml
image: 'share'; // res/drawable/share.xml
image: 'delete'; // res/drawable/delete.xml
```

**Adding drawable resources:**

1. Create vector drawable XML files in `android/app/src/main/res/drawable/`
2. Use [Material Icons](https://fonts.google.com/icons) as a source — download SVG and convert to Android Vector Drawable
3. Name the file to match the `image` prop value (e.g., `content_copy.xml` for `image: 'content_copy'`)

Example vector drawable (`res/drawable/content_copy.xml`):

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="@android:color/white"
      android:pathData="M16,1L4,1c-1.1,0 -2,0.9 -2,2v14h2L4,3h12L16,1zM19,5L8,5c-1.1,0 -2,0.9 -2,2v14c0,1.1 0.9,2 2,2h11c1.1,0 2,-0.9 2,-2L21,7c0,-1.1 -0.9,-2 -2,-2zM19,21L8,21L8,7h11v14z"/>
</vector>
```

### Your own SVG icons

An icon set that lives as SVG files can reach every native control through one string name, with no mapping table in JS, by adding each icon once per platform under the same name:

- **iOS:** open the SVG in Apple's [SF Symbols app](https://developer.apple.com/sf-symbols/) (File → New Symbol from Template, or drag the SVG into a custom symbol template), export it, and drag the exported `.svg` into your app's asset catalog as a Symbol Image Set. Symbol names that iOS doesn't ship are looked up in the asset catalog, so `'my.icon'` finds a custom symbol named `my.icon`. Custom symbols scale and weight with the text like the built-in ones. A plain image set (PDF or SVG with "Preserve Vector Data") works too, drawn as a tinted template.
- **Android:** import the SVG with Android Studio's Vector Asset Studio (File → New → Vector Asset → Local file), or convert it with a tool such as `svg2vectordrawable`, into `res/drawable/my_icon.xml`. Drawable names are the file name, so use a name that is valid on both platforms (lowercase and underscores, `my_icon`).

```tsx
<Button label="Deposit" icon="my_icon" />
<TextField trailingIcon="my_icon" />
```

The library doesn't parse SVG at runtime, and it doesn't bundle Material Symbols: both would add weight and a second rendering path to every app, while the platform formats above are the ones the system renders, tints and scales natively.

### Image requests (iOS and Android)

Image icons accept bundled assets or an `ImageURISource`. Native controls forward
`uri`, `scale`, `headers`, `method` and `body`. For example:

```tsx
<Button
  label="Account"
  icon={{
    type: 'image',
    tinted: false,
    source: {
      uri: 'https://example.com/account-icon.png',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'reload',
    },
  }}
/>
```

Use an explicit method such as `POST` when supplying a UTF-8 request body.
Requests that differ by URI, scale, headers, method or body have separate decoded
image cache entries. Updating those props reloads the affected icon even when
the URI stays the same. Request details are not written to diagnostic logs.

| `source.cache`      | Native icon behavior                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `default` (omitted) | Reuse a matching decoded image in memory; otherwise load it.                                |
| `force-cache`       | Same decoded-image behavior as `default`.                                                   |
| `reload`            | Bypass cached data and refresh the matching decoded image.                                  |
| `only-if-cached`    | Use a matching decoded image already in memory; render no image on a miss without fetching. |

This is the library's bounded in-memory cache, separate from
[React Native's `Image` caching](https://reactnative.dev/docs/image#cache-control-ios).
Entries may be evicted and do not persist across app launches. The decoded cache
does not revalidate expiry; use `reload` when the content behind an unchanged
request changes. Responses marked `Cache-Control: no-store` are not kept in it.
Only successful HTTP responses are decoded. Requests with custom headers,
method or body do not follow redirects; supply the final image URL.
Platform transport-security rules still apply. Dimensions come from the image
and its scale; `width`, `height`, `bundle` and other source metadata are not
additional HTTP request options.

These guarantees apply to the native iOS and Android loaders. Web continues
to use its existing image fallback and browser restrictions.

### Cross-platform pattern

Use `Platform.OS` to provide the correct icon name for each platform:

```tsx
import { Platform } from 'react-native';

const actions = [
  {
    id: 'copy',
    title: 'Copy',
    image: Platform.OS === 'ios' ? 'doc.on.doc' : 'content_copy',
  },
  {
    id: 'share',
    title: 'Share',
    image: Platform.OS === 'ios' ? 'square.and.arrow.up' : 'share',
  },
  {
    id: 'delete',
    title: 'Delete',
    image: Platform.OS === 'ios' ? 'trash' : 'delete',
    attributes: { destructive: true },
  },
];
```
