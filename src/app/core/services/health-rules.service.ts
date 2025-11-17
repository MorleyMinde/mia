import { Injectable } from '@angular/core';
import { DailyEntry, EntryStatus } from '../models/daily-entry.model';
import { PatientThresholds } from '../models/user-profile.model';

export interface ComputedStatusResult {
  status: EntryStatus;
  reasons: string[];
}

@Injectable({ providedIn: 'root' })
export class HealthRulesService {
  computeStatus(entry: DailyEntry, thresholds: PatientThresholds): ComputedStatusResult {
    const reasons: string[] = [];
    let status: EntryStatus = 'green';

    if (entry.bp && entry.bp.sys >= thresholds.bpSysVeryHigh) {
      status = 'red';
      reasons.push('bp.sys.veryHigh');
    } else if (entry.bp && entry.bp.sys >= thresholds.bpSysHigh) {
      status = this.pickHigher(status, 'yellow');
      reasons.push('bp.sys.high');
    }

    if (entry.bp && entry.bp.dia >= thresholds.bpDiaHigh) {
      status = this.pickHigher(status, 'yellow');
      reasons.push('bp.dia.high');
    }

    if (entry.glucose) {
      const { context, mmol } = entry.glucose;
      if (context === 'fasting' && mmol >= thresholds.glucoseVeryHigh) {
        status = 'red';
        reasons.push('glucose.fast.veryHigh');
      } else if (context === 'random' && mmol >= thresholds.glucoseVeryHigh) {
        status = 'red';
        reasons.push('glucose.random.veryHigh');
      } else if (mmol >= (context === 'fasting' ? thresholds.glucoseFastingHigh : thresholds.glucoseRandomHigh)) {
        status = this.pickHigher(status, 'yellow');
        reasons.push('glucose.high');
      } else if (mmol <= thresholds.glucoseLow) {
        status = this.pickHigher(status, 'yellow');
        reasons.push('glucose.low');
      }
    }

    if (entry.meds && !entry.meds.taken) {
      status = this.pickHigher(status, 'yellow');
      reasons.push('meds.missed');
    }

    if (entry.alcohol && entry.alcohol > 2) {
      status = this.pickHigher(status, 'yellow');
      reasons.push('alcohol.high');
    }

    return { status, reasons };
  }

  computeRiskScore(entry: DailyEntry, thresholds: PatientThresholds): number {
    let score = 10;
    if (entry.bp) {
      score += (entry.bp.sys - thresholds.bpSysHigh) * 0.5;
    }
    if (entry.glucose) {
      score += Math.max(0, entry.glucose.mmol - thresholds.glucoseRandomHigh) * 0.8;
    }
    if (entry.exercise && entry.exercise.minutes < 15) {
      score += 5;
    }
    if (entry.meds && !entry.meds.taken) {
      score += 10;
    }
    return Math.max(0, Math.round(score));
  }

  generateActions(entry: DailyEntry, result: ComputedStatusResult): string[] {
    const actions: string[] = [];
    if (result.status === 'red') {
      actions.push('actions.contactProvider');
    }
    if (entry.meds && !entry.meds.taken) {
      actions.push('actions.takeMeds');
    }
    if (!entry.exercise || entry.exercise.minutes < 30) {
      actions.push('actions.lightWalk');
    }
    if (entry.food && entry.food.salt >= 4) {
      actions.push('actions.reduceSalt');
    }
    return actions.length > 0 ? actions : ['actions.keepRoutine'];
  }

  private pickHigher(current: EntryStatus, incoming: EntryStatus): EntryStatus {
    const order: Record<EntryStatus, number> = { green: 0, yellow: 1, red: 2 };
    return order[incoming] > order[current] ? incoming : current;
  }
}
