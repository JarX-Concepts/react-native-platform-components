import renderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { TextField } from '../web/TextField';

it('keeps editable inputs and their accessory actions outside disabled containers', () => {
  let tree: ReturnType<typeof renderer.create>;
  act(() => {
    tree = renderer.create(
      <TextField label="Password" secureTextEntry passwordToggle />
    );
  });
  let ancestor = tree!.root.findByType(TextInput).parent;
  while (ancestor) {
    expect(ancestor.props.disabled).not.toBe(true);
    expect(ancestor.props['aria-disabled']).not.toBe(true);
    ancestor = ancestor.parent;
  }
  act(() => tree.unmount());
});

it('gives an action field a labeled button without adding a press target to editable fields', () => {
  const onPress = jest.fn();
  let tree: ReturnType<typeof renderer.create>;
  act(() => {
    tree = renderer.create(
      <TextField label="Birthday" editable={false} onPress={onPress} />
    );
  });
  const button = tree!.root
    .findAllByProps({ role: 'button' })
    .find((node) => typeof node.props.onPress === 'function')!;
  expect(button.props.role).toBe('button');
  expect(button.props.accessibilityLabel).toBe('Birthday');
  act(() => button.props.onPress());
  expect(onPress).toHaveBeenCalledTimes(1);

  act(() => tree.update(<TextField label="Name" onPress={onPress} />));
  expect(tree!.root.findAllByProps({ role: 'button' })).toHaveLength(0);
  act(() => tree.unmount());
});

it('marks a read-only input disabled, but not an action field', () => {
  let tree: ReturnType<typeof renderer.create>;
  act(() => {
    tree = renderer.create(
      <TextField testID="name" label="Name" editable={false} />
    );
  });
  expect(tree!.root.findByType(TextInput).props['aria-disabled']).toBe(true);
  expect(tree!.root.findByType(TextInput).props.testID).toBe('name');

  act(() => tree.update(<TextField label="Name" />));
  expect(
    tree!.root.findByType(TextInput).props['aria-disabled']
  ).toBeUndefined();

  act(() =>
    tree.update(
      <TextField label="Birthday" editable={false} onPress={() => {}} />
    )
  );
  expect(
    tree!.root.findByType(TextInput).props['aria-disabled']
  ).toBeUndefined();
  act(() => tree.unmount());
});
