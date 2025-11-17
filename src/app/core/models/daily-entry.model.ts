export type EntryStatus = 'green' | 'yellow' | 'red';
export type EntryCreatorRole = 'patient' | 'provider';

export interface BloodPressurePayload {
  sys: number;
  dia: number;
  time?: string;
}

export interface GlucosePayload {
  mmol: number;
  context: 'fasting' | 'random';
  time?: string;
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  bp?: BloodPressurePayload;
  glucose?: GlucosePayload;
  meds?: { taken: boolean; names?: string[] };
  food?: { salt: 1 | 2 | 3 | 4 | 5; carb: 1 | 2 | 3 | 4 | 5; notes?: string };
  exercise?: { minutes: number };
  alcohol?: number;
  cigarettes?: number;
  herbs?: string[];
  notes?: string;
  status: EntryStatus;
  statusReasons: string[];
  riskScore: number;
  actions: string[];
  createdByRole: EntryCreatorRole;
  createdByUid: string;
  createdAt: Date;
  updatedAt: Date;
}
