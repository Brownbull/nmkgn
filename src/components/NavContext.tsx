import { createContext, useContext } from 'react';

export interface NavState {
  step: string;
  history: string[];
  docType: string;
  docLabel: string;
  fileName: string;
}

export interface NavValue {
  interactive: boolean;
  state: NavState;
  go: (step: string) => void;
  back: () => void;
  set: (patch: Partial<NavState>) => void;
  reset: () => void;
}

const NO_OP_NAV: NavValue = {
  interactive: false,
  state: { step: 'login', history: [], docType: 'bank', docLabel: 'Crédito bancario', fileName: 'contrato.pdf' },
  go: () => {},
  back: () => {},
  set: () => {},
  reset: () => {},
};

export const NavCtx = createContext<NavValue | null>(null);

export function useNav(): NavValue {
  return useContext(NavCtx) ?? NO_OP_NAV;
}
