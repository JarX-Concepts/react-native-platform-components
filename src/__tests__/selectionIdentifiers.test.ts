import { warnSelectionIdentifiers } from '../selectionIdentifiers';

describe('selection identifier diagnostics', () => {
  afterEach(() => jest.restoreAllMocks());

  it('accepts distinct non-empty identifiers, including whitespace and numeric strings', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    warnSelectionIdentifiers('SelectionMenu', ['first', '0', ' ']);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(['SelectionMenu', 'SegmentedControl'] as const)(
    'identifies invalid item indexes without exposing payloads in %s',
    (component) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      warnSelectionIdentifiers(component, [
        '',
        'private-payload',
        'private-payload',
      ]);
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn.mock.calls[0]![0]).toContain(
        `${component} requires unique, non-empty identifiers; item 0 has an empty identifier`
      );
      expect(warn.mock.calls[1]![0]).toContain(
        'item 2 has a duplicate identifier'
      );
      expect(warn.mock.calls.flat().join(' ')).not.toContain('private-payload');
    }
  );

  it('does not warn in production', () => {
    const runtime = globalThis as typeof globalThis & { __DEV__: boolean };
    const development = runtime.__DEV__;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      runtime.__DEV__ = false;
      warnSelectionIdentifiers('SelectionMenu', ['', 'same', 'same']);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      runtime.__DEV__ = development;
    }
  });
});
