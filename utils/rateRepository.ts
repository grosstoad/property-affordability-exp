import { 
  RateConfiguration, 
  LvrTier, 
  InterestRateType, 
  RepaymentType, 
  FeatureType, 
  LoanPurpose 
} from "@/types/rateTypes";

// Sample rate data - in production this would come from an API or database
const rateData: RateConfiguration[] = [
  // Owner Occupier - Variable - P&I - Redraw
  {
    lvr: LvrTier.TIER_0_50,
    interestRateType: InterestRateType.VARIABLE,
    repaymentType: RepaymentType.PRINCIPAL_AND_INTEREST,
    featureType: FeatureType.REDRAW,
    loanPurpose: LoanPurpose.OWNER,
    rate: 5.79,
    comparisonRate: 5.99
  },
  // Add more rate configurations here
];

export function getRateByConfiguration(
  lvr: LvrTier,
  interestRateType: InterestRateType,
  repaymentType: RepaymentType,
  featureType: FeatureType,
  loanPurpose: LoanPurpose
): { rate: number; comparisonRate: number } | null {
  const matchingRate = rateData.find(rate => 
    rate.lvr === lvr &&
    rate.interestRateType === interestRateType &&
    rate.repaymentType === repaymentType &&
    rate.featureType === featureType &&
    rate.loanPurpose === loanPurpose
  );
  
  return matchingRate ? 
    { rate: matchingRate.rate, comparisonRate: matchingRate.comparisonRate } : 
    null;
}

// Calculate LVR tier based on loan amount and property value
export function calculateLvrTier(loanAmount: number, propertyValue: number): LvrTier {
  const lvr = (loanAmount / propertyValue) * 100;
  
  if (lvr <= 50) return LvrTier.TIER_0_50;
  if (lvr <= 60) return LvrTier.TIER_50_60;
  if (lvr <= 70) return LvrTier.TIER_60_70;
  if (lvr <= 80) return LvrTier.TIER_70_80;
  if (lvr <= 85) return LvrTier.TIER_80_85;
  
  // Default to highest tier if above 85%
  return LvrTier.TIER_80_85;
} 