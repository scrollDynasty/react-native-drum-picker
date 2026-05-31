/**
 * Web-fallback tests for `DrumPicker`.
 *
 * Jest's `react-native` preset resolves `'../DrumPicker'` to the
 * `.native.tsx` variant. We import the `.tsx` file explicitly so this test
 * exercises the web fallback module without changing project-wide resolver
 * config.
 */
import * as React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { DrumPicker as WebDrumPicker } from '../DrumPicker.tsx';

type SelectInstance = {
  type: string;
  props: {
    'value': number;
    'onChange': (e: {
      target: { selectedIndex: number };
      preventDefault?: () => void;
      stopPropagation?: () => void;
    }) => void;
    'style': React.CSSProperties;
    'data-testid'?: string;
    'aria-label'?: string;
    'size': number;
    'children': Array<{ type: string; props: { children: string } }>;
  };
};

function renderWeb(props: Parameters<typeof WebDrumPicker>[0]): SelectInstance {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(React.createElement(WebDrumPicker, props));
  });
  const root = renderer!.toTree();
  // The root rendered element is the <select>.
  const rendered = renderer!.root.children[0] as unknown as SelectInstance;
  // Sanity guard so test failures surface clearly if the render shape changes.
  if (!rendered || rendered.type !== 'select') {
    throw new Error(
      `Expected DrumPicker web fallback to render <select>, got: ${
        rendered ? rendered.type : JSON.stringify(root)
      }`
    );
  }
  return rendered;
}

describe('DrumPicker — web fallback', () => {
  it('does not throw at import time (SSR safety)', () => {
    expect(typeof WebDrumPicker).toBe('function');
  });

  it('renders a <select> element with one <option> per item', () => {
    const select = renderWeb({
      items: ['Alpha', 'Beta', 'Gamma'],
      selectedIndex: 1,
    });
    expect(select.type).toBe('select');
    expect(select.props.value).toBe(1);
    expect(select.props.children).toHaveLength(3);
    expect(select.props.children[0]!.props.children).toBe('Alpha');
    expect(select.props.children[2]!.props.children).toBe('Gamma');
  });

  it('clamps selectedIndex below 0 and beyond items length', () => {
    expect(
      renderWeb({ items: ['A', 'B'], selectedIndex: -5 }).props.value
    ).toBe(0);
    expect(
      renderWeb({ items: ['A', 'B'], selectedIndex: 99 }).props.value
    ).toBe(1);
  });

  it('handles an empty items array without throwing', () => {
    expect(() => renderWeb({ items: [] })).not.toThrow();
  });

  it('uses testID as data-testid', () => {
    const select = renderWeb({ items: ['A'], testID: 'my-picker' });
    expect(select.props['data-testid']).toBe('my-picker');
  });

  it('exposes a default aria-label for screen readers', () => {
    const select = renderWeb({ items: ['A'] });
    expect(select.props['aria-label']).toBe('Picker');
  });

  it('uses a custom accessibilityLabel as aria-label', () => {
    const select = renderWeb({ items: ['A'], accessibilityLabel: 'Country' });
    expect(select.props['aria-label']).toBe('Country');
  });

  it('synthesizes a native-like event on selection change', () => {
    const onChange = jest.fn();
    const select = renderWeb({
      items: ['Alpha', 'Beta', 'Gamma'],
      selectedIndex: 0,
      onChange,
    });
    act(() => {
      select.props.onChange({
        target: { selectedIndex: 2 },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as never);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    const event = onChange.mock.calls[0]![0];
    expect(event.nativeEvent).toEqual({
      index: 2,
      value: 'Gamma',
      item: 'Gamma',
    });
  });

  it('resolves labeled items: renders label, emits typed value as item', () => {
    const onChange = jest.fn();
    const select = renderWeb({
      items: [
        { label: 'United States', value: 'us' },
        { label: 'Germany', value: 'de' },
      ],
      selectedIndex: 0,
      onChange,
    });
    // Options render the labels, not the value codes.
    expect(select.props.children[0]!.props.children).toBe('United States');
    expect(select.props.children[1]!.props.children).toBe('Germany');
    act(() => {
      select.props.onChange({
        target: { selectedIndex: 1 },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as never);
    });
    expect(onChange.mock.calls[0]![0].nativeEvent).toEqual({
      index: 1,
      value: 'Germany',
      item: 'de',
    });
  });

  it('does not re-emit when the same index fires twice', () => {
    const onChange = jest.fn();
    const select = renderWeb({
      items: ['Alpha', 'Beta'],
      selectedIndex: 0,
      onChange,
    });
    act(() => {
      select.props.onChange({
        target: { selectedIndex: 1 },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as never);
    });
    act(() => {
      select.props.onChange({
        target: { selectedIndex: 1 },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as never);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
