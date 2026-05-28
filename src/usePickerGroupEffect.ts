import { useEffect, useRef } from 'react';
import type { PickerGroupEvent, PickerGroupHandle } from './types';

let observerCounter = 0;

/**
 * Fires when any picker in the group settles (onChange).
 */
export function usePickerGroupChangedEffect(
  group: PickerGroupHandle | undefined,
  callback: (event: PickerGroupEvent) => void
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const observerNameRef = useRef(`__observer_changed_${observerCounter++}`);

  useEffect(() => {
    if (!group) {
      return;
    }
    const unregister = group._register(observerNameRef.current, {
      onChanged: (e) => callbackRef.current(e),
      onChanging: () => {},
    });
    return unregister;
  }, [group]);
}

/**
 * Fires on every scroll tick of any picker in the group (onValueChanging).
 */
export function usePickerGroupChangingEffect(
  group: PickerGroupHandle | undefined,
  callback: (event: PickerGroupEvent) => void
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const observerNameRef = useRef(`__observer_changing_${observerCounter++}`);

  useEffect(() => {
    if (!group) {
      return;
    }
    const unregister = group._register(observerNameRef.current, {
      onChanged: () => {},
      onChanging: (e) => callbackRef.current(e),
    });
    return unregister;
  }, [group]);
}
