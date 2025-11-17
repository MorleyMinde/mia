export type UserRole = 'patient' | 'provider';
export type LanguageCode = 'en' | 'sw';
export type Condition = 'hypertension' | 'diabetes';

export interface PatientThresholds {
  bpSysHigh: number;
  bpDiaHigh: number;
  bpSysVeryHigh: number;
  glucoseFastingHigh: number;
  glucoseRandomHigh: number;
  glucoseVeryHigh: number;
  glucoseLow: number;
}

export interface UserProfileBase {
  uid: string;
  role: UserRole;
  displayName: string;
  lang: LanguageCode;
  phone?: string;
  shareCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientProfile extends UserProfileBase {
  role: 'patient';
  yearOfBirth?: number;
  conditions: Condition[];
  thresholds?: PatientThresholds;
  comorbidities?: string[];
  linkedProviders?: string[];
}

export interface ProviderProfile extends UserProfileBase {
  role: 'provider';
  facilityName?: string;
  providerType?: string;
}

export type UserProfile = PatientProfile | ProviderProfile;
