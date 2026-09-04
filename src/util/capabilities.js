const BUDGETS = { none: 0, low: 12000, high: 60000 };

export function detectTier({ hasWebGL2, isMobile, deviceMemory }) {
  if (!hasWebGL2) return 'none';
  if (isMobile) return 'low';
  if (typeof deviceMemory === 'number' && deviceMemory <= 4) return 'low';
  return 'high';
}

export function pointBudget(tier) {
  return BUDGETS[tier] ?? 0;
}

export function readEnvironment() {
  let hasWebGL2 = false;
  try {
    const c = document.createElement('canvas');
    hasWebGL2 = !!c.getContext('webgl2');
  } catch { hasWebGL2 = false; }
  return {
    hasWebGL2,
    isMobile: matchMedia('(max-width: 767px), (pointer: coarse)').matches,
    deviceMemory: navigator.deviceMemory,
  };
}
