import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useTrackingAppState({ onBackground, onForeground }) {
  const stateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = stateRef.current;
      stateRef.current = nextState;

      if (nextState === 'active' && previousState !== 'active') {
        onForeground();
        return;
      }

      if (nextState !== 'active' && previousState === 'active') {
        onBackground();
      }
    });

    return () => subscription.remove();
  }, [onBackground, onForeground]);
}

export default useTrackingAppState;
