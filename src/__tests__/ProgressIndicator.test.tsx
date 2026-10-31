import { Platform, StyleSheet } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { ProgressIndicator } from '../index';
import {
  defaultProgressIndicatorStyle,
  normalizeProgress,
  normalizeSegments,
} from '../progressIndicatorSupport';

jest.mock('../ProgressIndicatorNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) =>
      React.createElement('PCProgressIndicator', props)
    ),
  };
});

const NativeProgressIndicator = jest.requireMock(
  '../ProgressIndicatorNativeComponent'
).default as jest.Mock;

function lastNativeProps() {
  const calls = NativeProgressIndicator.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

describe('ProgressIndicator', () => {
  beforeEach(() => {
    NativeProgressIndicator.mockClear();
    Platform.OS = 'ios';
  });

  it('defaults to an indeterminate linear bar that is busy', () => {
    const tree = render(<ProgressIndicator testID="p" />);
    const props = lastNativeProps();
    expect(props.variant).toBe('linear');
    expect(props.progress).toBe(-1);
    expect(props.size).toBe('');
    expect(props.segments).toBe(0);
    expect(props.android).toEqual({ wavy: 'false' });
    expect(props.testID).toBe('p');
    expect(props.accessible).toBe(true);
    expect(props.accessibilityRole).toBe('progressbar');
    expect(props.accessibilityValue).toBeUndefined();
    expect(props.accessibilityState).toEqual({ busy: true });
    // iOS shows the spinner for an indeterminate bar
    expect(StyleSheet.flatten(props.style)).toEqual({ height: 20 });
    act(() => tree.unmount());
  });

  it('passes a clamped progress, read out as 0-100, on the labeled view', () => {
    const tree = render(
      <ProgressIndicator
        testID="upload"
        progress={0.426}
        accessibilityLabel="Uploading"
      />
    );
    let props = lastNativeProps();
    expect(props.progress).toBe(0.426);
    expect(props.accessibilityLabel).toBe('Uploading');
    expect(props.accessibilityValue).toEqual({ min: 0, max: 100, now: 43 });
    expect(props.accessibilityState).toEqual({ busy: false });
    expect(StyleSheet.flatten(props.style)).toEqual({ height: 4 });

    act(() => tree.update(<ProgressIndicator progress={7} />));
    props = lastNativeProps();
    expect(props.progress).toBe(1);
    expect(props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });

    act(() => tree.update(<ProgressIndicator progress={-3} />));
    expect(lastNativeProps().progress).toBe(0);

    act(() => tree.update(<ProgressIndicator progress={NaN} />));
    expect(lastNativeProps().progress).toBe(-1);
    act(() => tree.unmount());
  });

  it('lets the consumer override the accessibility value and style', () => {
    const tree = render(
      <ProgressIndicator
        progress={0.4}
        accessibilityValue={{ text: 'Step 2 of 5' }}
        style={{ height: 12, marginTop: 8 }}
      />
    );
    const props = lastNativeProps();
    expect(props.accessibilityValue).toEqual({ text: 'Step 2 of 5' });
    expect(StyleSheet.flatten(props.style)).toEqual({
      height: 12,
      marginTop: 8,
    });
    act(() => tree.unmount());
  });

  it('maps segments, size, colors and wavy', () => {
    const tree = render(
      <ProgressIndicator
        variant="circular"
        progress={0.5}
        size="large"
        segments={4.7}
        color="#ff0000"
        trackColor="#00ff00"
        android={{ wavy: true }}
      />
    );
    const props = lastNativeProps();
    expect(props.variant).toBe('circular');
    expect(props.size).toBe('large');
    expect(props.segments).toBe(4);
    expect(props.color).toBe('#ff0000');
    expect(props.trackColor).toBe('#00ff00');
    expect(props.android).toEqual({ wavy: 'true' });
    expect(StyleSheet.flatten(props.style)).toEqual({ width: 37, height: 37 });
    act(() => tree.unmount());
  });

  it('loading is always indeterminate', () => {
    const tree = render(<ProgressIndicator variant="loading" progress={0.5} />);
    const props = lastNativeProps();
    expect(props.progress).toBe(-1);
    expect(props.accessibilityState).toEqual({ busy: true });
    act(() => tree.unmount());
  });

  it('takes the Android sizes on Android', () => {
    Platform.OS = 'android';
    const tree = render(<ProgressIndicator variant="circular" />);
    expect(StyleSheet.flatten(lastNativeProps().style)).toEqual({
      width: 48,
      height: 48,
    });
    // React Native would append "busy" to the label on Android
    expect(lastNativeProps().accessibilityState).toEqual({});
    act(() =>
      tree.update(<ProgressIndicator progress={0.2} android={{ wavy: true }} />)
    );
    expect(StyleSheet.flatten(lastNativeProps().style)).toEqual({ height: 10 });
    act(() => tree.unmount());
  });
});

describe('progressIndicatorSupport', () => {
  it('normalizes progress and segments', () => {
    expect(normalizeProgress(undefined)).toBeUndefined();
    expect(normalizeProgress(null)).toBeUndefined();
    expect(normalizeProgress(0.3)).toBe(0.3);
    expect(normalizeProgress(1.2)).toBe(1);
    expect(normalizeSegments(undefined)).toBe(0);
    expect(normalizeSegments(1)).toBe(0);
    expect(normalizeSegments(3)).toBe(3);
    expect(normalizeSegments(Infinity)).toBe(0);
  });

  it('gives each platform its own default sizes', () => {
    const size = (
      os: string,
      variant: 'linear' | 'circular' | 'loading',
      named?: 'small' | 'large',
      indeterminate = false,
      wavy = false
    ) => defaultProgressIndicatorStyle(os, variant, named, indeterminate, wavy);

    expect(size('ios', 'linear')).toEqual({ height: 4 });
    expect(size('ios', 'circular')).toEqual({ width: 20, height: 20 });
    expect(size('ios', 'loading', 'large')).toEqual({ width: 37, height: 37 });
    expect(size('android', 'linear')).toEqual({ height: 4 });
    expect(size('android', 'circular', 'small')).toEqual({
      width: 24,
      height: 24,
    });
    expect(size('android', 'loading')).toEqual({ width: 48, height: 48 });
    expect(size('web', 'circular')).toEqual({ width: 40, height: 40 });
  });
});
