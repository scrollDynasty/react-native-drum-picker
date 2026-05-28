import { useEffect, useRef } from 'react';
import type { PickerGroupEvent, PickerGroupHandle } from './types';

/**
 * Fires when any picker in the group settles (onChange).
 */
export function usePickerGroupChangedEffect(
  group: PickerGroupHandle | undefined,
  callback: (event: PickerGroupEvent) => void
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!group) {
      return;
    }
    const observerName = `__observer_changed_${Math.random()}`;
    const unregister = group._register(observerName, {
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

  useEffect(() => {
    if (!group) {
      return;
    }
    const observerName = `__observer_changing_${Math.random()}`;
    const unregister = group._register(observerName, {
      onChanged: () => {},
      onChanging: (e) => callbackRef.current(e),
    });
    return unregister;
  }, [group]);
}
