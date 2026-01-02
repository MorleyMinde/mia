export type EntryStatus = 'green' | 'yellow' | 'red';
export type EntryCreatorRole = 'patient' | 'provider';

export interface BloodPressurePayload {
  sys: number;
  dia: number;
}

export interface GlucosePayload {
  mmol: number;
  context: 'fasting' | 'random';
}

export interface HealthEntry {
  id?: string; // Auto-generated timestamp-based ID
  timestamp: Date; // Full date and time when the measurement was taken
  bp?: BloodPressurePayload;
  glucose?: GlucosePayload;
  weight?: number; // Weight in kilograms (kg)
  height?: number; // Height in centimeters (cm)
  bmi?: number; // Body Mass Index (calculated from weight and height)
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

// Legacy type alias for backwards compatibility
export type DailyEntry = HealthEntry;
