// Define LVR tiers and corresponding rate adjustments
const LVR_RATE_ADJUSTMENTS = [
  { maxLvr: 60, adjustment: -0.40 },
  { maxLvr: 70, adjustment: -0.30 },
  { maxLvr: 80, adjustment: -0.20 },
  { maxLvr: 85, adjustment: -0.10 },
  { maxLvr: 90, adjustment: 0.10 },
  { maxLvr: 95, adjustment: 0.30 },
  { maxLvr: 100, adjustment: 0.50 }
];

// Define specific rates for LVR tiers as requested
const LVR_SPECIFIC_RATES = [
  { maxLvr: 50, rate: 5.50 },
  { maxLvr: 60, rate: 5.60 },
  { maxLvr: 70, rate: 5.70 },
  { maxLvr: 80, rate: 5.80 },
  { maxLvr: 85, rate: 6.50 },
  // Default rate for higher LVRs
  { maxLvr: 100, rate: 6.80 }
];

// Define specific rates for Mortgage Choice Freedom Variable Saver
const MORTGAGE_CHOICE_FREEDOM_RATES = [
  { maxLvr: 60, rate: 5.60 },
  { maxLvr: 70, rate: 5.70 },
  { maxLvr: 80, rate: 5.90 },
  { maxLvr: 85, rate: 6.10 },
  { maxLvr: 90, rate: 6.30 },
  { maxLvr: 95, rate: 6.50 }
];

// Define LVR tiers for rate configuration
export enum LvrTier {
  TIER_50 = "TIER_50",
  TIER_60 = "TIER_60",
  TIER_70 = "TIER_70",
  TIER_80 = "TIER_80",
  TIER_85 = "TIER_85",
  TIER_90_PLUS = "TIER_90_PLUS"
}

// Calculate LVR tier based on loan-to-value ratio
export const calculateLvrTier = (lvr: number): LvrTier => {
  if (lvr <= 50) return LvrTier.TIER_50;
  if (lvr <= 60) return LvrTier.TIER_60;
  if (lvr <= 70) return LvrTier.TIER_70;
  if (lvr <= 80) return LvrTier.TIER_80;
  if (lvr <= 85) return LvrTier.TIER_85;
  return LvrTier.TIER_90_PLUS;
};

// Define rate configuration types
export type RateConfiguration = {
  lvrTier: LvrTier;
  interestRateType: string;
  repaymentType: string;
  featureType: string;
  loanPurpose: string;
};

// Get interest rate based on configuration
export const getRateByConfiguration = (
  lvrTier: LvrTier,
  interestRateType: string,
  repaymentType: string,
  featureType: string,
  loanPurpose: string
): { rate: number; comparisonRate: number } | null => {
  // Find the base rate based on LVR tier
  let baseRate = 0;
  let comparisonRateAdjustment = 0.2; // Default comparison rate adjustment
  
  // Get LVR percentage for the tier
  let lvrPercentage = 0;
  switch (lvrTier) {
    case LvrTier.TIER_50:
      lvrPercentage = 50;
      break;
    case LvrTier.TIER_60:
      lvrPercentage = 60;
      break;
    case LvrTier.TIER_70:
      lvrPercentage = 70;
      break;
    case LvrTier.TIER_80:
      lvrPercentage = 80;
      break;
    case LvrTier.TIER_85:
      lvrPercentage = 85;
      break;
    case LvrTier.TIER_90_PLUS:
      lvrPercentage = 90;
      break;
  }

  // Use Mortgage Choice Freedom Variable Saver rates
  baseRate = getMortgageChoiceFreedomRate(lvrPercentage);
  
  // Apply adjustments based on loan purpose
  if (loanPurpose === 'INVESTOR') {
    baseRate += 0.2;
    comparisonRateAdjustment += 0.1;
  }
  
  // Apply adjustments based on interest rate type
  if (interestRateType === 'FIXED_1YR') {
    baseRate -= 0.1;
  } else if (interestRateType === 'FIXED_2YR') {
    baseRate -= 0.05;
  } else if (interestRateType === 'FIXED_3YR') {
    baseRate += 0.05;
  } else if (interestRateType === 'FIXED_5YR') {
    baseRate += 0.15;
  }
  
  // Apply adjustments based on repayment type
  if (repaymentType === 'INTEREST_ONLY') {
    baseRate += 0.3;
    comparisonRateAdjustment += 0.1;
  }
  
  // Apply adjustments based on feature type
  if (featureType === 'OFFSET') {
    baseRate += 0.1;
    comparisonRateAdjustment += 0.05;
  }
  
  return {
    rate: parseFloat(baseRate.toFixed(2)),
    comparisonRate: parseFloat((baseRate + comparisonRateAdjustment).toFixed(2))
  };
};

export const determineInterestRate = (
  lvr: number, 
  baseRate: number, 
  isFirstHomeBuyer: boolean = false,
  isInvestor: boolean = false
): number => {
  // Find applicable LVR tier with specific rate
  const applicableTier = LVR_SPECIFIC_RATES.find(tier => lvr <= tier.maxLvr) || 
                         LVR_SPECIFIC_RATES[LVR_SPECIFIC_RATES.length - 1];
  
  let rate = applicableTier.rate;
  
  // Apply borrower type adjustments
  if (isInvestor) {
    rate += 0.20; // Investors typically pay higher rates
  }
  
  if (isFirstHomeBuyer && lvr > 80) {
    rate -= 0.10; // Some lenders offer FHB discounts
  }
  
  console.log('DEBUG_RATE_DETERMINATION:', { 
    lvr, 
    applicableTierMaxLvr: applicableTier.maxLvr,
    baseRate: rate,
    isFirstHomeBuyer,
    isInvestor,
    finalRate: rate,
    allTiers: LVR_SPECIFIC_RATES.map(tier => `${tier.maxLvr}: ${tier.rate}`),
    tierComparisons: LVR_SPECIFIC_RATES.map(tier => `${lvr} <= ${tier.maxLvr}: ${lvr <= tier.maxLvr}`)
  });
  
  return rate;
};

export const getMortgageChoiceFreedomRate = (lvr: number): number => {
  const applicableTier = MORTGAGE_CHOICE_FREEDOM_RATES.find(tier => lvr <= tier.maxLvr) || 
                        MORTGAGE_CHOICE_FREEDOM_RATES[MORTGAGE_CHOICE_FREEDOM_RATES.length - 1];
  return applicableTier.rate;
}; 