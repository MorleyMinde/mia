import { Injectable } from '@angular/core';
import { HealthEntry, EntryStatus } from '../models/daily-entry.model';
import { Condition, PatientThresholds } from '../models/user-profile.model';

export interface ComputedStatusResult {
  status: EntryStatus;
  reasons: string[];
}

@Injectable({ providedIn: 'root' })
export class HealthRulesService {
  /**
   * Compute health status based on entry values and thresholds
   * Following AHA/ACC 2017 guidelines for hypertension and ADA 2024 for diabetes
   */
  computeStatus(
    entry: HealthEntry,
    thresholds: PatientThresholds,
    conditions: Condition[] = []
  ): ComputedStatusResult {
    const reasons: string[] = [];
    let status: EntryStatus = 'green';

    // Blood Pressure Evaluation (AHA/ACC 2017 guidelines)
    if (entry.bp) {
      const { sys, dia } = entry.bp;

      // Hypertensive Crisis: ≥180/≥120 (immediate medical attention required)
      if (sys >= thresholds.bpSysVeryHigh && dia >= thresholds.bpDiaVeryHigh) {
        status = 'red';
        reasons.push('reasons.bp.crisis');
      } else if (sys >= thresholds.bpSysVeryHigh || dia >= thresholds.bpDiaVeryHigh) {
        // Either systolic or diastolic in crisis range
        status = 'red';
        if (sys >= thresholds.bpSysVeryHigh) {
          reasons.push('reasons.bp.sys.veryHigh');
        }
        if (dia >= thresholds.bpDiaVeryHigh) {
          reasons.push('reasons.bp.dia.veryHigh');
        }
      } else if (sys >= thresholds.bpSysHigh || dia >= thresholds.bpDiaHigh) {
        // Stage 2 Hypertension: ≥140/≥90
        status = this.pickHigher(status, 'yellow');
        if (sys >= thresholds.bpSysHigh) {
          reasons.push('reasons.bp.sys.high');
        }
        if (dia >= thresholds.bpDiaHigh) {
          reasons.push('reasons.bp.dia.high');
        }
      } else if (sys >= 130 || dia >= 80) {
        // Stage 1 Hypertension or Elevated BP (120-129/<80)
        status = this.pickHigher(status, 'yellow');
        reasons.push('reasons.bp.elevated');
      }
    }

    // Glucose Evaluation (ADA 2024 guidelines)
    if (entry.glucose) {
      const { context, mmol } = entry.glucose;
      const isFasting = context === 'fasting';

      // Very high glucose (hyperglycemia crisis range)
      if (mmol >= thresholds.glucoseVeryHigh) {
        status = 'red';
        if (isFasting) {
          reasons.push('reasons.glucose.fast.veryHigh');
        } else {
          reasons.push('reasons.glucose.random.veryHigh');
        }
      }
      // High glucose
      else if (
        mmol >=
        (isFasting ? thresholds.glucoseFastingHigh : thresholds.glucoseRandomHigh)
      ) {
        status = this.pickHigher(status, 'yellow');
        reasons.push('reasons.glucose.high');
      }
      // Low glucose (hypoglycemia)
      else if (mmol <= thresholds.glucoseLow) {
        status = this.pickHigher(status, 'yellow');
        reasons.push('reasons.glucose.low');
        // If very low, escalate to red
        if (mmol < 3.0) {
          status = 'red';
          reasons.push('reasons.glucose.veryLow');
        }
      }
    }

    // Medication adherence
    if (entry.meds && !entry.meds.taken) {
      status = this.pickHigher(status, 'yellow');
      reasons.push('reasons.meds.missed');
    }

    // Alcohol consumption
    if (entry.alcohol && entry.alcohol > 2) {
      status = this.pickHigher(status, 'yellow');
      reasons.push('reasons.alcohol.high');
    }

    // High salt intake (especially relevant for hypertension)
    if (entry.food && entry.food.salt >= 4) {
      if (conditions.includes('hypertension') && entry.bp) {
        // Only flag if patient has hypertension and BP is elevated
        const bpElevated =
          entry.bp.sys >= thresholds.bpSysHigh || entry.bp.dia >= thresholds.bpDiaHigh;
        if (bpElevated) {
          reasons.push('reasons.salt.highWithBP');
        }
      }
    }

    // High carbohydrate intake (especially relevant for diabetes)
    if (entry.food && entry.food.carb >= 4 && conditions.includes('diabetes')) {
      if (entry.glucose && entry.glucose.mmol >= thresholds.glucoseFastingHigh) {
        reasons.push('reasons.carb.highWithGlucose');
      }
    }

    return { status, reasons };
  }

  /**
   * Compute risk score with proper weighting
   */
  computeRiskScore(
    entry: HealthEntry,
    thresholds: PatientThresholds,
    conditions: Condition[] = []
  ): number {
    let score = 10; // Base score

    // Blood Pressure scoring
    if (entry.bp) {
      const sysOver = Math.max(0, entry.bp.sys - thresholds.bpSysHigh);
      const diaOver = Math.max(0, entry.bp.dia - thresholds.bpDiaHigh);

      // Higher weight for systolic
      score += sysOver * 0.5;
      score += diaOver * 0.3;

      // Crisis range adds significant risk
      if (entry.bp.sys >= thresholds.bpSysVeryHigh || entry.bp.dia >= thresholds.bpDiaVeryHigh) {
        score += 30;
      }
    }

    // Glucose scoring (context-aware)
    if (entry.glucose) {
      const { context, mmol } = entry.glucose;
      const isFasting = context === 'fasting';
      const threshold = isFasting
        ? thresholds.glucoseFastingHigh
        : thresholds.glucoseRandomHigh;

      if (mmol >= thresholds.glucoseVeryHigh) {
        score += 25; // Very high glucose is dangerous
      } else if (mmol >= threshold) {
        score += (mmol - threshold) * 1.2;
      } else if (mmol <= thresholds.glucoseLow) {
        // Hypoglycemia is also dangerous
        const lowSeverity = thresholds.glucoseLow - mmol;
        score += lowSeverity * 2.0; // Higher weight for low glucose
        if (mmol < 3.0) {
          score += 20; // Very low glucose is critical
        }
      }
    }

    // Medication adherence (very important)
    if (entry.meds && !entry.meds.taken) {
      score += 15;
      // More severe if patient has active issues
      if (entry.bp && (entry.bp.sys >= thresholds.bpSysHigh || entry.bp.dia >= thresholds.bpDiaHigh)) {
        score += 5;
      }
      if (
        entry.glucose &&
        entry.glucose.mmol >= thresholds.glucoseFastingHigh
      ) {
        score += 5;
      }
    }

    // Lifestyle factors
    if (!entry.exercise || entry.exercise.minutes < 30) {
      score += 5;
      if (entry.exercise && entry.exercise.minutes < 15) {
        score += 3; // Even lower exercise
      }
    }

    // High salt intake (if hypertension)
    if (entry.food && entry.food.salt >= 4 && conditions.includes('hypertension')) {
      score += 3;
      if (entry.bp && (entry.bp.sys >= thresholds.bpSysHigh || entry.bp.dia >= thresholds.bpDiaHigh)) {
        score += 5; // Combination is worse
      }
    }

    // High alcohol consumption
    if (entry.alcohol && entry.alcohol > 2) {
      score += entry.alcohol * 2;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Generate context-specific, condition-aware recommendations
   */
  generateActions(
    entry: HealthEntry,
    result: ComputedStatusResult,
    conditions: Condition[] = [],
    thresholds?: PatientThresholds
  ): string[] {
    // Use a Set to prevent duplicate actions
    const actionsSet = new Set<string>();
    const hasHypertension = conditions.includes('hypertension');
    const hasDiabetes = conditions.includes('diabetes');
    
    // Use provided thresholds or sensible defaults
    const thresholdsToUse: PatientThresholds = thresholds ?? {
      bpSysHigh: 140,
      bpDiaHigh: 90,
      bpSysVeryHigh: 180,
      bpDiaVeryHigh: 120,
      glucoseFastingHigh: 7,
      glucoseRandomHigh: 10,
      glucoseVeryHigh: 13,
      glucoseLow: 3.9
    };

    // Helper function to add action only if not already present
    const addAction = (action: string) => {
      actionsSet.add(action);
    };

    // RED STATUS - Immediate actions
    if (result.status === 'red') {
      // Hypertensive crisis
      if (
        entry.bp &&
        (entry.bp.sys >= thresholdsToUse.bpSysVeryHigh || entry.bp.dia >= thresholdsToUse.bpDiaVeryHigh)
      ) {
        addAction('actions.seekImmediateCare');
        addAction('actions.bpCrisis');
      }
      // Very high glucose
      else if (
        entry.glucose &&
        entry.glucose.mmol >= thresholdsToUse.glucoseVeryHigh
      ) {
        addAction('actions.contactProvider');
        addAction('actions.glucoseVeryHigh');
        if (hasDiabetes) {
          addAction('actions.checkKetones');
        }
      }
      // Very low glucose
      else if (
        entry.glucose &&
        entry.glucose.mmol < 3.0
      ) {
        addAction('actions.seekImmediateCare');
        addAction('actions.glucoseVeryLow');
        addAction('actions.consumeGlucose');
      }
      // Generic red status
      else {
        addAction('actions.contactProvider');
      }
    }

    // YELLOW STATUS - Warning actions
    if (result.status === 'yellow' || result.status === 'red') {
      // High BP with context
      if (
        entry.bp &&
        (entry.bp.sys >= thresholdsToUse.bpSysHigh || entry.bp.dia >= thresholdsToUse.bpDiaHigh) &&
        entry.bp.sys < thresholdsToUse.bpSysVeryHigh &&
        entry.bp.dia < thresholdsToUse.bpDiaVeryHigh
      ) {
        if (entry.food && entry.food.salt >= 4) {
          addAction('actions.reduceSaltImmediately');
        } else {
          addAction('actions.reduceSalt');
        }
        addAction('actions.monitorBP');
        if (!entry.exercise || entry.exercise.minutes < 30) {
          addAction('actions.lightWalk');
        }
        if (entry.alcohol && entry.alcohol > 1) {
          addAction('actions.limitAlcohol');
        }
      }

      // Elevated BP (pre-hypertension)
      if (
        entry.bp &&
        entry.bp.sys >= 130 &&
        entry.bp.sys < thresholdsToUse.bpSysHigh &&
        entry.bp.dia >= 80 &&
        entry.bp.dia < thresholdsToUse.bpDiaHigh
      ) {
        addAction('actions.lifestyleChanges');
        // Only add watchSalt if we haven't already added a more urgent salt action
        if (entry.food && entry.food.salt >= 3 && 
            !actionsSet.has('actions.reduceSalt') && 
            !actionsSet.has('actions.reduceSaltImmediately')) {
          addAction('actions.watchSalt');
        }
      }

      // High glucose
      if (entry.glucose) {
        const { context, mmol } = entry.glucose;
        const isFasting = context === 'fasting';
        const threshold = isFasting ? thresholdsToUse.glucoseFastingHigh : thresholdsToUse.glucoseRandomHigh;

        if (mmol >= threshold && mmol < thresholdsToUse.glucoseVeryHigh) {
          if (entry.meds && !entry.meds.taken) {
            addAction('actions.takeMeds');
            addAction('actions.monitorGlucose');
          } else {
            addAction('actions.avoidSugaryFoods');
            addAction('actions.monitorGlucose');
          }
          if (entry.food && entry.food.carb >= 4) {
            addAction('actions.reduceCarbs');
          }
        }

        // Low glucose (not critical but still warning) - only if not already added for very low
        if (mmol <= 3.9 && mmol >= 3.0 && result.status !== 'red') {
          addAction('actions.consumeGlucose');
          addAction('actions.monitorGlucose');
          if (entry.meds) {
            addAction('actions.reviewMedsWithProvider');
          }
        }
      }

      // Medication adherence
      if (entry.meds && !entry.meds.taken) {
        addAction('actions.takeMeds');
        if (hasHypertension && entry.bp && (entry.bp.sys >= thresholdsToUse.bpSysHigh || entry.bp.dia >= thresholdsToUse.bpDiaHigh)) {
          addAction('actions.missingMedsAffectsBP');
        }
        if (hasDiabetes && entry.glucose && entry.glucose.mmol >= thresholdsToUse.glucoseFastingHigh) {
          addAction('actions.missingMedsAffectsGlucose');
        }
      }

      // Lifestyle factors - only add if not already added in BP section
      if (!entry.exercise || entry.exercise.minutes < 30) {
        if (hasHypertension || hasDiabetes) {
          addAction('actions.exerciseImportant');
        }
        addAction('actions.lightWalk');
      }

      // High salt (especially for hypertension) - only add if not already added in BP section
      if (entry.food && entry.food.salt >= 4) {
        // Only add if reduceSalt/reduceSaltImmediately wasn't already added
        if (!actionsSet.has('actions.reduceSalt') && !actionsSet.has('actions.reduceSaltImmediately')) {
          if (hasHypertension) {
            addAction('actions.reduceSaltImmediately');
          } else {
            addAction('actions.reduceSalt');
          }
        }
      }

      // High alcohol - only add if not already added in BP section
      if (entry.alcohol && entry.alcohol > 2) {
        addAction('actions.limitAlcohol');
        if (hasHypertension) {
          addAction('actions.alcoholRaisesBP');
        }
      }
    }

    // GREEN STATUS or default
    if (actionsSet.size === 0) {
      addAction('actions.keepRoutine');
      // Still provide gentle reminders if relevant
      // Only add watchSalt if we haven't already added a more urgent salt action
      if (hasHypertension && entry.food && entry.food.salt >= 3 &&
          !actionsSet.has('actions.reduceSalt') && 
          !actionsSet.has('actions.reduceSaltImmediately')) {
        addAction('actions.watchSalt');
      }
      if (hasDiabetes && entry.food && entry.food.carb >= 3) {
        addAction('actions.watchCarbs');
      }
    }

    // Convert Set to array and return
    return Array.from(actionsSet);
  }

  private pickHigher(
    current: EntryStatus,
    incoming: EntryStatus
  ): EntryStatus {
    const order: Record<EntryStatus, number> = { green: 0, yellow: 1, red: 2 };
    return order[incoming] > order[current] ? incoming : current;
  }
}