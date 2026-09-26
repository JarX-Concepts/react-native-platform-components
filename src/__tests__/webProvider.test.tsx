import React, {
  createRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import renderer, { act } from 'react-test-renderer';
import { renderToString } from 'react-dom/server';
import {
  Button,
  SelectionMenu,
  TextField,
  ContextMenu,
  SplitButton,
  PlatformComponentsProvider,
  type ButtonProps,
  type SelectionMenuProps,
  type TextFieldRef,
  type TextFieldProps,
  type WebComponents,
} from '../index.web';
import { PlatformComponentsProvider as NativeProvider } from '../index';
import { eventValue, resetWarnings } from '../web/shared';

function render(element: React.ReactElement) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree;
}

const AppButton = ({ label, disabled, onPress }: ButtonProps) => (
  <button data-adapter="app" disabled={disabled} onClick={onPress}>
    {label}
  </button>
);
const LocalButton = ({ label }: ButtonProps) => (
  <button data-adapter="local">{label}</button>
);
const AppSelect = ({ selected, options, onSelect }: SelectionMenuProps) => (
  <select
    value={selected ?? ''}
    onChange={(event) => {
      const index = options.findIndex(
        (option) => option.data === eventValue(event)
      );
      const option = options[index];
      if (option) onSelect?.(option.data, option.label, index);
    }}
  >
    {options.map((option) => (
      <option key={option.data} value={option.data} disabled={option.disabled}>
        {option.label}
      </option>
    ))}
  </select>
);

describe('web adapter provider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetWarnings();
  });

  it('uses the existing fallback without a registration and forwards props and callbacks to overrides', () => {
    const onPress = jest.fn();
    const tree = render(
      <PlatformComponentsProvider web={{ Button: AppButton }}>
        <Button label="Save" disabled onPress={onPress} />
        <SelectionMenu presentation="embedded" options={[]} selected={null} />
      </PlatformComponentsProvider>
    );
    const button = tree.root.findByProps({ 'data-adapter': 'app' });
    expect(button.props.disabled).toBe(true);
    act(() => button.props.onClick());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(tree.root.findAllByType('select')).toHaveLength(1);
    act(() => tree.update(<Button label="Default" />));
    expect(tree.root.findAllByProps({ 'data-adapter': 'app' })).toHaveLength(0);
    expect(tree.root.findByType('button').props.children).toBeDefined();
    act(() => tree.unmount());
  });

  it('keeps controlled values and public callback indexes through an app adapter', () => {
    const options = [
      { label: 'First', data: 'a' },
      { label: 'Unavailable', data: 'b', disabled: true },
      { label: 'Last', data: 'c' },
    ];
    const onSelect = jest.fn();
    const tree = render(
      <PlatformComponentsProvider web={{ SelectionMenu: AppSelect }}>
        <SelectionMenu options={options} selected="a" onSelect={onSelect} />
      </PlatformComponentsProvider>
    );
    act(() =>
      tree.root.findByType('select').props.onChange({ target: { value: 'c' } })
    );
    expect(onSelect).toHaveBeenCalledWith('c', 'Last', 2);
    expect(tree.root.findByType('select').props.value).toBe('a');
    expect(tree.root.findAllByType('option')[1]!.props.disabled).toBe(true);
    act(() => tree.unmount());
  });

  it('inherits nested registrations and isolates sibling and separate roots', () => {
    const tree = render(
      <PlatformComponentsProvider
        web={{ Button: AppButton, SelectionMenu: AppSelect }}
      >
        <Button label="Outer" />
        <PlatformComponentsProvider
          web={{ Button: LocalButton, SelectionMenu: undefined }}
        >
          <Button label="Inner" />
          <SelectionMenu options={[]} selected={null} />
        </PlatformComponentsProvider>
      </PlatformComponentsProvider>
    );
    const other = render(<Button label="Separate" />);
    expect(
      tree.root.findByProps({ 'data-adapter': 'app' }).props.children
    ).toBe('Outer');
    expect(
      tree.root.findByProps({ 'data-adapter': 'local' }).props.children
    ).toBe('Inner');
    expect(tree.root.findAllByType(AppSelect)).toHaveLength(1);
    expect(other.root.findAllByType(AppButton)).toHaveLength(0);
    act(() => {
      tree.unmount();
      other.unmount();
    });
  });

  it('preserves component state across provider updates and can remove a replacement', () => {
    function StatefulButton() {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount(count + 1)}>{count}</button>;
    }
    const page = (web: Partial<WebComponents>) => (
      <PlatformComponentsProvider web={web}>
        <Button label="Fallback" />
      </PlatformComponentsProvider>
    );
    const tree = render(page({ Button: StatefulButton }));
    act(() => tree.root.findByType('button').props.onClick());
    act(() => tree.update(page({ Button: StatefulButton })));
    expect(tree.root.findByType('button').props.children).toBe(1);
    act(() => tree.update(page({})));
    expect(tree.root.findAllByType(StatefulButton)).toHaveLength(0);
    act(() => tree.unmount());
  });

  it('forwards TextField refs through the public export and clears them on unmount', () => {
    const handle: TextFieldRef = {
      focus: jest.fn(),
      blur: jest.fn(),
      clear: jest.fn(),
      isFocused: () => true,
      setSelection: jest.fn(),
    };
    const AppField = forwardRef<TextFieldRef, TextFieldProps>((props, ref) => {
      useImperativeHandle(ref, () => handle, []);
      return <input aria-label={props.label} />;
    });
    const ref = createRef<TextFieldRef>();
    const tree = render(
      <PlatformComponentsProvider web={{ TextField: AppField }}>
        <TextField ref={ref} label="Name" />
      </PlatformComponentsProvider>
    );
    ref.current!.focus();
    ref.current!.setSelection(1, 3);
    expect(handle.focus).toHaveBeenCalledTimes(1);
    expect(handle.setSelection).toHaveBeenCalledWith(1, 3);
    expect(ref.current!.isFocused()).toBe(true);
    act(() => tree.unmount());
    expect(ref.current).toBeNull();
  });

  it('uses an overridden Button inside the built-in SplitButton fallback', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const tree = render(
      <PlatformComponentsProvider web={{ Button: AppButton }}>
        <SplitButton label="Main" menu={[]} />
      </PlatformComponentsProvider>
    );
    expect(
      tree.root.findByProps({ 'data-adapter': 'app' }).props.children
    ).toBe('Main');
    act(() => tree.unmount());
  });

  it('does not render an unsupported fallback when its adapter is registered', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const tree = render(
      <PlatformComponentsProvider
        web={{ ContextMenu: ({ children }) => <section>{children}</section> }}
      >
        <ContextMenu actions={[]}>
          <Button label="Inside" />
        </ContextMenu>
      </PlatformComponentsProvider>
    );
    expect(tree.root.findAllByType('section')).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();
    act(() => tree.unmount());
  });

  it('renders registrations on the server without leaking between requests', () => {
    const first = renderToString(
      <PlatformComponentsProvider web={{ Button: AppButton }}>
        <Button label="First request" />
      </PlatformComponentsProvider>
    );
    const second = renderToString(
      <PlatformComponentsProvider web={{ Button: LocalButton }}>
        <Button label="Second request" />
      </PlatformComponentsProvider>
    );
    expect(first).toContain('data-adapter="app"');
    expect(second).toContain('data-adapter="local"');
    expect(second).not.toContain('First request');
  });

  it('keeps the native provider a passthrough', () => {
    const adapter = jest.fn(AppButton);
    const tree = render(
      <NativeProvider web={{ Button: adapter }}>
        <span>Native child</span>
      </NativeProvider>
    );
    expect(tree.root.findByType('span').props.children).toBe('Native child');
    expect(adapter).not.toHaveBeenCalled();
    act(() => tree.unmount());
  });
});
