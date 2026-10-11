import { create } from 'zustand';
import type { SeismicData } from '@/src/types/seismic';

interface SeismicState {
  seismicDataMap: Map<string, SeismicData>;
  updateSeismicData: (data: SeismicData) => void;
  clearSeismicData: () => void;
}

export const useSeismicStore = create<SeismicState>((set) => ({
  seismicDataMap: new Map(),

  updateSeismicData: (data: SeismicData) => {
    set((state) => {
      const newMap = new Map(state.seismicDataMap);
      const current = newMap.get(data.type);
      const pgaHistory = current?.pgaHistory || [];
      const now = Date.now();

      let lastPgaChangeAt = current?.lastPgaChangeAt || now;
      if (current === undefined || current.PGA !== data.PGA) {
        lastPgaChangeAt = now;
      }

      pgaHistory.push({ time: now, value: data.PGA });
      if (pgaHistory.length > 60) {
        pgaHistory.shift();
      }

      const updated: SeismicData = {
        ...data,
        region: data.region || data.type.slice(-6),
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        pgaHistory,
        lastPgaChangeAt,
      };

      newMap.set(data.type, updated);
      return { seismicDataMap: newMap };
    });
  },

  clearSeismicData: () => set({ seismicDataMap: new Map() }),
}));
