import { useState, useEffect } from 'react';
import { subscribeMachines } from '../services/laundry.service';
import type { LaundryMachine, Building } from '../types';

interface State {
  machines: LaundryMachine[];
  loading: boolean;
  error: string | null;
}

export function useLaundry(building: Building) {
  const [state, setState] = useState<State>({ machines: [], loading: true, error: null });

  useEffect(() => {
    const unsubscribe = subscribeMachines(building, machines => {
      setState({ machines, loading: false, error: null });
    });
    return unsubscribe;
  }, [building]);

  return state;
}
