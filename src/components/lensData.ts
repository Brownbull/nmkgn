export interface LensData {
  id: string;
  label: string;
  short: string;
  icon: string;
  color: string;
  softColor: string;
}

export const LENSES: Record<string, LensData> = {
  ley: {
    id: 'ley',
    label: 'Ley · Chile',
    short: 'Ley',
    icon: 'scale',
    color: '#3b4a6b',
    softColor: '#e6eaf3',
  },
  mercado: {
    id: 'mercado',
    label: 'Mercado',
    short: 'Mercado',
    icon: 'chart',
    color: '#246a5b',
    softColor: '#d9e8e3',
  },
  comparar: {
    id: 'comparar',
    label: 'vs. otras ofertas',
    short: 'vs. otras',
    icon: 'compare',
    color: '#7a4b6f',
    softColor: '#f3e6ee',
  },
  intl: {
    id: 'intl',
    label: 'Internacional',
    short: 'Internacional',
    icon: 'globe',
    color: '#8a6f3d',
    softColor: '#f3ecd9',
  },
};
