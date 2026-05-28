import { useRef } from 'react';
import type {
  PickerGroupEvent,
  PickerGroupHandle,
  PickerGroupState,
} from './types';

type Handlers = {
  onChanged: (e: PickerGroupEvent) => void;
  onChanging: (e: PickerGroupEvent) => void;
};

/**
 * Creates a PickerGroup that connects multiple DrumPickers.
 */
export function usePickerGroup(): PickerGroupHandle {
  const listenersRef = useRef<Map<string, Handlers>>(new Map());
  const stateRef = useRef<PickerGroupState>({});

  const handleRef = useRef<PickerGroupHandle>({
    _register(name, handlers) {
      listenersRef.current.set(name, handlers);
      return () => {
        listenersRef.current.delete(name);
        delete stateRef.current[name];
      };
    },

    _notifyChanged(name, event) {
      stateRef.current[name] = {
        index: event.index,
        value: event.value,
      };
      listenersRef.current.forEach((handlers, pickerName) => {
        if (pickerName !== name) {
          handlers.onChanged(event);
        }
      });
    },

    _notifyChanging(name, event) {
      listenersRef.current.forEach((handlers, pickerName) => {
        if (pickerName !== name) {
          handlers.onChanging(event);
        }
      });
    },

    getState() {
      return Object.fromEntries(
        Object.entries(stateRef.current).map(([pickerName, state]) => [
          pickerName,
          { ...state },
        ])
      );
    },
  });

  return handleRef.current;
}
