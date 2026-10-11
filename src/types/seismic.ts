export interface SeismicData {
  type: string;
  region: string;
  latitude: number;
  longitude: number;
  version: string;

  PGA: number;
  Max_PGA: number;
  PGA_EW: number;
  Max_PGA_EW: number;
  PGA_NS: number;
  Max_PGA_NS: number;
  PGA_UD: number;
  Max_PGA_UD: number;

  PGV: number;
  Max_PGV: number;
  PGV_EW: number;
  Max_PGV_EW: number;
  PGV_NS: number;
  Max_PGV_NS: number;
  PGV_UD: number;
  Max_PGV_UD: number;

  PGD: number;
  Max_PGD: number;
  PGD_EW: number;
  Max_PGD_EW: number;
  PGD_NS: number;
  Max_PGD_NS: number;
  PGD_UD: number;
  Max_PGD_UD: number;

  Shindo: string;
  Max_Shindo: string;
  CalcShindo: number;
  Max_CalcShindo: number;

  Intensity: string;
  Max_Intensity: string;

  LPGM: number;
  Max_LPGM: number;
  Sva30: number;
  Max_Sva30: number;

  is_desktop: boolean;
  High_Precision: boolean;
  error_code: number[];

  update_at: string;
  create_at: string;

  pgaHistory: { time: number; value: number }[];
  lastPgaChangeAt: number;
}

export interface DisplaySettings {
  pga: boolean;
  measuredIntensity: boolean;
  maxJMAShindo: boolean;
  maxCSISIntensity: boolean;
  longPeriod: boolean;
  realTimeJMA: boolean;
  realTimeCSIS: boolean;
}

export type BackgroundType = 'white' | 'black' | 'wolfx' | 'green-black';
export type ThemeMode = 'light' | 'dark';
