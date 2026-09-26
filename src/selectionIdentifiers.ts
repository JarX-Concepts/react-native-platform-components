/** Diagnose identifiers reserved by the native selection protocol. */
export function warnSelectionIdentifiers(
  component: 'SelectionMenu' | 'SegmentedControl',
  values: readonly string[]
): void {
  if (!__DEV__) return;
  const seen = new Set<string>();
  for (const [index, value] of values.entries()) {
    if (value === '' || seen.has(value)) {
      console.warn(
        `react-native-platform-components: ${component} requires unique, non-empty ` +
          `identifiers; item ${index} has ${value === '' ? 'an empty' : 'a duplicate'} identifier.`
      );
    }
    seen.add(value);
  }
}
