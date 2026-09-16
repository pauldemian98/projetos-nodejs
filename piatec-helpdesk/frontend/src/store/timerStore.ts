import { create } from 'zustand';

interface TimerState {
  isActive: boolean;
  secondsElapsed: number;
  baseSeconds: number;
  activeChamadoId: string | null;
  activeTarefaId: string | null;
  startTimer: (chamadoId?: string, tarefaId?: string, baseSeconds?: number) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  isActive: false,
  secondsElapsed: 0,
  baseSeconds: 0,
  activeChamadoId: null,
  activeTarefaId: null,

  startTimer: (chamadoId, tarefaId, baseSeconds = 0) => set({ 
    isActive: true, 
    baseSeconds,
    activeChamadoId: chamadoId || null,
    activeTarefaId: tarefaId || null
  }),

  pauseTimer: () => set({ isActive: false }),
  
  resetTimer: () => set({ 
    isActive: false, 
    secondsElapsed: 0, 
    baseSeconds: 0,
    activeChamadoId: null, 
    activeTarefaId: null 
  }),

  tick: () => set((state) => ({ 
    secondsElapsed: state.isActive ? state.secondsElapsed + 1 : state.secondsElapsed 
  })),
}));
