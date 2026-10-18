import renderer, { act } from 'react-test-renderer';

import { Dialog, type DialogAction } from '../index';

jest.mock('../DialogNativeComponent', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn((props) => React.createElement('PCDialog', props)),
  };
});

const NativeDialog = jest.requireMock('../DialogNativeComponent')
  .default as jest.Mock;

function lastNativeProps() {
  const calls = NativeDialog.mock.calls;
  return calls[calls.length - 1][0];
}

function render(element: React.ReactElement) {
  let tree: ReturnType<typeof renderer.create> | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

const ACTIONS: DialogAction[] = [
  { id: 'cancel', title: 'Cancel', role: 'cancel', testID: 'dialog-cancel' },
  { id: 'later', title: 'Later', disabled: true },
  { id: 'secret', title: 'Secret', hidden: true },
  {
    id: 'delete',
    title: 'Delete',
    role: 'destructive',
    preferred: true,
    haptics: 'warning',
  },
];

describe('Dialog', () => {
  beforeEach(() => {
    NativeDialog.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('flattens the actions for native, dropping hidden ones', () => {
    render(<Dialog visible={false} actions={ACTIONS} />);
    const { actions } = lastNativeProps();
    expect(actions).toEqual([
      {
        id: 'cancel',
        title: 'Cancel',
        role: 'cancel',
        preferred: 'false',
        disabled: 'false',
        haptics: '',
        testID: 'dialog-cancel',
      },
      {
        id: 'later',
        title: 'Later',
        role: 'default',
        preferred: 'false',
        disabled: 'true',
        haptics: '',
        testID: '',
      },
      {
        id: 'delete',
        title: 'Delete',
        role: 'destructive',
        preferred: 'true',
        disabled: 'false',
        haptics: 'warning',
        testID: '',
      },
    ]);
  });

  it('maps visibility and fills the optional props', () => {
    const tree = render(<Dialog visible actions={[]} testID="d" />);
    expect(lastNativeProps()).toMatchObject({
      visible: 'open',
      title: '',
      message: '',
      dismissable: 'true',
      haptics: '',
      maxFontSizeMultiplier: 0,
      testID: 'd',
      pointerEvents: 'none',
    });
    act(() =>
      tree.update(
        <Dialog
          visible={false}
          title="Delete?"
          message="It can't be undone."
          dismissable={false}
          haptics="selection"
          maxFontSizeMultiplier={1.5}
          actions={[]}
        />
      )
    );
    expect(lastNativeProps()).toMatchObject({
      visible: 'closed',
      title: 'Delete?',
      message: "It can't be undone.",
      dismissable: 'false',
      haptics: 'selection',
      maxFontSizeMultiplier: 1.5,
    });
  });

  it('reports picks of enabled default and destructive actions', () => {
    const onSelect = jest.fn();
    const onCancel = jest.fn();
    render(
      <Dialog
        visible
        actions={ACTIONS}
        onSelect={onSelect}
        onCancel={onCancel}
      />
    );
    const props = lastNativeProps();
    act(() => {
      props.onSelect({ nativeEvent: { actionId: 'delete' } });
      // Disabled, hidden, cancel and unknown actions aren't picks
      props.onSelect({ nativeEvent: { actionId: 'later' } });
      props.onSelect({ nativeEvent: { actionId: 'secret' } });
      props.onSelect({ nativeEvent: { actionId: 'cancel' } });
      props.onSelect({ nativeEvent: { actionId: 'nope' } });
      props.onCancel({ nativeEvent: {} });
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('delete');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('passes on show, dismiss and present failures', () => {
    const onShow = jest.fn();
    const onDismiss = jest.fn();
    const onPresentFailed = jest.fn();
    render(
      <Dialog
        visible
        actions={ACTIONS}
        onShow={onShow}
        onDismiss={onDismiss}
        onPresentFailed={onPresentFailed}
      />
    );
    const props = lastNativeProps();
    act(() => {
      props.onShow({ nativeEvent: {} });
      props.onDismiss({ nativeEvent: {} });
      props.onPresentFailed({ nativeEvent: { reason: 'busy' } });
      props.onPresentFailed({ nativeEvent: { reason: 'noWindow' } });
      // An unknown reason from a newer native side
      props.onPresentFailed({ nativeEvent: { reason: 'other' } });
    });
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onPresentFailed.mock.calls).toEqual([
      ['busy'],
      ['noWindow'],
      ['rejected'],
    ]);
  });

  it('leaves unset callbacks off', () => {
    render(<Dialog visible={false} actions={ACTIONS} />);
    const props = lastNativeProps();
    for (const name of [
      'onSelect',
      'onCancel',
      'onShow',
      'onDismiss',
      'onPresentFailed',
    ]) {
      expect(props[name]).toBeUndefined();
    }
  });

  it('keeps one cancel and one preferred action, warning in development', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Dialog
        visible={false}
        actions={[
          { id: 'a', title: 'A', role: 'cancel', preferred: true },
          { id: 'b', title: 'B', role: 'cancel', preferred: true },
          { id: 'c', title: 'C', role: 'cancel', hidden: true },
        ]}
      />
    );
    expect(
      lastNativeProps().actions.map(
        (a: { role: string; preferred: string }) => [a.role, a.preferred]
      )
    ).toEqual([
      ['cancel', 'true'],
      ['default', 'false'],
    ]);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]![0]).toContain(
      'Dialog takes one cancel action; "b" is shown as a default action'
    );
    expect(warn.mock.calls[1]![0]).toContain(
      'Dialog takes one preferred action; "b" is not preferred'
    );

    // A demoted cancel action is a pick
    const onSelect = jest.fn();
    render(
      <Dialog
        visible
        actions={[
          { id: 'a', title: 'A', role: 'cancel' },
          { id: 'b', title: 'B', role: 'cancel' },
        ]}
        onSelect={onSelect}
      />
    );
    act(() => lastNativeProps().onSelect({ nativeEvent: { actionId: 'b' } }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('warns about empty and duplicate ids in development', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Dialog
        visible={false}
        actions={[
          { id: 'a', title: 'A' },
          { id: 'a', title: 'Again' },
          { id: '', title: 'Empty' },
          { id: 'a', title: 'Hidden', hidden: true },
        ]}
      />
    );
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]![0]).toContain(
      'Dialog requires unique, non-empty identifiers; item 1 has a duplicate identifier'
    );
  });
});
