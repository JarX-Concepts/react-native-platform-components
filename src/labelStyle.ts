// labelStyle.ts
//
// Label font props shared by SegmentedControl, Button and ButtonGroup.
import type { TextStyle } from 'react-native';

/**
 * Font for a control's labels. Each field falls back to the platform default.
 */
export interface LabelStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: TextStyle['fontWeight'];
  fontStyle?: 'normal' | 'italic';
}

/** The flat font fields the native specs expect; empty / 0 = default. */
export type NativeLabelStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
};

/** Normalizes a label font for native; `undefined` keeps the platform font. */
export function normalizeLabelStyle(
  labelStyle: LabelStyle | undefined
): NativeLabelStyle | undefined {
  if (!labelStyle) return undefined;
  return {
    fontFamily: labelStyle.fontFamily ?? '',
    fontSize: labelStyle.fontSize ?? 0,
    fontWeight:
      labelStyle.fontWeight === undefined ? '' : String(labelStyle.fontWeight),
    fontStyle: labelStyle.fontStyle ?? '',
  };
}
