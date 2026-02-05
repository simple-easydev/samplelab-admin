/**
 * Credit Cost Configuration
 * Defines credit costs for standard and premium packs
 * 
 * NOTE: Stems are NOT sample types - they are bundles attached to parent samples.
 * Stem bundles have an additional cost added to the parent sample's cost.
 */

export const CREDIT_COSTS = {
  standard: {
    'One-shot': 2,
    'Loop': 3,
  },
  premium: {
    'One-shot': 8,  // 4x multiplier
    'Loop': 10,     // ~3.3x multiplier
  }
} as const;

/**
 * Stem bundle cost (added to parent sample cost)
 * Applies to both standard and premium packs
 */
export const STEMS_BUNDLE_COST = 5;

/**
 * Calculate the effective credit cost for a sample (parent sample only, excludes stems)
 * @param sampleType - Type of sample (One-shot or Loop)
 * @param isPremium - Whether the pack is premium
 * @param manualOverride - Optional manual credit cost override
 * @returns The effective credit cost for the parent sample
 */
export function calculateSampleCreditCost(
  sampleType: 'One-shot' | 'Loop',
  isPremium: boolean,
  manualOverride?: number | null
): number {
  // Manual override takes precedence
  if (manualOverride !== undefined && manualOverride !== null && manualOverride > 0) {
    return manualOverride;
  }
  
  // Auto-calculate based on type and premium status
  const tier = isPremium ? 'premium' : 'standard';
  return CREDIT_COSTS[tier][sampleType] || CREDIT_COSTS.standard['One-shot'];
}

/**
 * Calculate the total credit cost for a sample including stems bundle
 * @param sampleType - Type of sample (One-shot or Loop)
 * @param isPremium - Whether the pack is premium
 * @param hasStems - Whether the sample has stems
 * @param manualOverride - Optional manual credit cost override for the sample
 * @returns Total credit cost (sample + stems bundle if applicable)
 */
export function calculateTotalCreditCost(
  sampleType: 'One-shot' | 'Loop',
  isPremium: boolean,
  hasStems: boolean,
  manualOverride?: number | null
): number {
  const sampleCost = calculateSampleCreditCost(sampleType, isPremium, manualOverride);
  const stemsCost = hasStems ? STEMS_BUNDLE_COST : 0;
  return sampleCost + stemsCost;
}

/**
 * Get the credit cost for stems bundle only
 * @returns Stems bundle cost
 */
export function getStemsBundleCost(): number {
  return STEMS_BUNDLE_COST;
}

/**
 * Get the default credit cost for a sample type (standard pack, no stems)
 * @param sampleType - Type of sample
 * @returns Default credit cost
 */
export function getDefaultCreditCost(sampleType: 'One-shot' | 'Loop'): number {
  return CREDIT_COSTS.standard[sampleType] || CREDIT_COSTS.standard['One-shot'];
}

/**
 * Get the premium credit cost for a sample type (premium pack, no stems)
 * @param sampleType - Type of sample
 * @returns Premium credit cost
 */
export function getPremiumCreditCost(sampleType: 'One-shot' | 'Loop'): number {
  return CREDIT_COSTS.premium[sampleType] || CREDIT_COSTS.premium['One-shot'];
}

/**
 * Get credit cost range for display
 * @param isPremium - Whether the pack is premium
 * @returns Min and max credit costs
 */
export function getCreditCostRange(isPremium: boolean): { min: number; max: number } {
  const costs = isPremium ? CREDIT_COSTS.premium : CREDIT_COSTS.standard;
  const values = Object.values(costs);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
