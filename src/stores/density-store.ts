import { create } from 'zustand';

export type DisplayDensity = 'comfortable' | 'compact' | 'ultra-compact';

interface DensityState {
  density: DisplayDensity;
  setDensity: (density: DisplayDensity) => void;
  cycleDensity: () => void;
  initDensity: () => void;
}

function applyDensityToDocument(density: DisplayDensity) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-density', density);
}

export const useDensityStore = create<DensityState>((set, get) => ({
  density: 'compact',

  initDensity: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('eventmate-density') as DisplayDensity | null;

    let initial: DisplayDensity = 'comfortable';
    if (saved && (saved === 'comfortable' || saved === 'compact' || saved === 'ultra-compact')) {
      initial = saved;
    } else if (window.innerWidth <= 640) {
      initial = 'compact';
    }

    applyDensityToDocument(initial);
    set({ density: initial });
  },

  setDensity: (newDensity: DisplayDensity) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('eventmate-density', newDensity);
    applyDensityToDocument(newDensity);
    set({ density: newDensity });
  },

  cycleDensity: () => {
    const { density, setDensity } = get();
    let next: DisplayDensity = 'compact';
    if (density === 'comfortable') {
      next = 'compact';
    } else if (density === 'compact') {
      next = 'ultra-compact';
    } else {
      next = 'comfortable';
    }
    setDensity(next);
  },
}));
