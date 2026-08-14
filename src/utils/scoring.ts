import { AuditItem, CategoryId, ReadinessScoreBreakdown } from '../types';

export function calculateReadinessScore(items: AuditItem[]): ReadinessScoreBreakdown {
  const categoryWeights: Record<CategoryId, number> = {
    '00_SYSTEM': 20,
    '01_RUNTIME': 25,
    '02_AUTODESK': 20,
    '03_REVIT': 15,
    '04_AUTOCAD': 10,
    '05_DRIVERS': 5,
    '06_BIM_CONFIG': 5,
  };

  const categoryScores: Record<CategoryId, { score: number; max: number; percentage: number }> = {
    '00_SYSTEM': { score: 0, max: 20, percentage: 0 },
    '01_RUNTIME': { score: 0, max: 25, percentage: 0 },
    '02_AUTODESK': { score: 0, max: 20, percentage: 0 },
    '03_REVIT': { score: 0, max: 15, percentage: 0 },
    '04_AUTOCAD': { score: 0, max: 10, percentage: 0 },
    '05_DRIVERS': { score: 0, max: 5, percentage: 0 },
    '06_BIM_CONFIG': { score: 0, max: 5, percentage: 0 },
  };

  const categoryItems: Record<CategoryId, AuditItem[]> = {
    '00_SYSTEM': [],
    '01_RUNTIME': [],
    '02_AUTODESK': [],
    '03_REVIT': [],
    '04_AUTOCAD': [],
    '05_DRIVERS': [],
    '06_BIM_CONFIG': [],
  };

  let blockerCount = 0;
  let warningCount = 0;
  let passedCount = 0;

  items.forEach(item => {
    categoryItems[item.category].push(item);
    if (item.status === 'error' || item.status === 'missing' || item.status === 'unsupported') {
      blockerCount++;
    } else if (item.status === 'warning') {
      warningCount++;
    } else {
      passedCount++;
    }
  });

  let totalScore = 0;
  const maxScore = 100;

  (Object.keys(categoryWeights) as CategoryId[]).forEach(catId => {
    const list = categoryItems[catId];
    const maxCat = categoryWeights[catId];
    if (list.length === 0) {
      categoryScores[catId] = { score: maxCat, max: maxCat, percentage: 100 };
      totalScore += maxCat;
      return;
    }

    let itemPoints = 0;
    list.forEach(it => {
      if (it.status === 'ok') itemPoints += 1;
      else if (it.status === 'warning') itemPoints += 0.5;
      else itemPoints += 0;
    });

    const catScore = Math.round((itemPoints / list.length) * maxCat);
    categoryScores[catId] = {
      score: catScore,
      max: maxCat,
      percentage: Math.round((catScore / maxCat) * 100),
    };
    totalScore += catScore;
  });

  const percentage = Math.min(100, Math.max(0, totalScore));

  let statusLevel: 'EXCELLENT' | 'READY' | 'UNSTABLE' | 'CRITICAL' = 'CRITICAL';
  if (percentage >= 90) statusLevel = 'EXCELLENT';
  else if (percentage >= 75) statusLevel = 'READY';
  else if (percentage >= 50) statusLevel = 'UNSTABLE';
  else statusLevel = 'CRITICAL';

  return {
    totalScore: percentage,
    maxScore: 100,
    percentage,
    statusLevel,
    categoryScores,
    blockerCount,
    warningCount,
    passedCount,
  };
}
