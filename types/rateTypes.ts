// Define the rate structure
export type RateConfiguration = {
  lvr: LvrTier;
  interestRateType: InterestRateType;
  repaymentType: RepaymentType;
  featureType: FeatureType;
  loanPurpose: LoanPurpose;
  rate: number;
  comparisonRate: number;
}

// Define the enums for each parameter
export enum LvrTier {
  TIER_0_50 = "0-50%",
  TIER_50_60 = "50-60%",
  TIER_60_70 = "60-70%",
  TIER_70_80 = "70-80%",
  TIER_80_85 = "80-85%"
}

export enum InterestRateType {
  VARIABLE = "variable",
  FIXED_1_YEAR = "fixed_1_year",
  FIXED_2_YEAR = "fixed_2_year",
  FIXED_3_YEAR = "fixed_3_year"
}

export enum RepaymentType {
  PRINCIPAL_AND_INTEREST = "principal_and_interest",
  INTEREST_ONLY = "interest_only"
}

export enum FeatureType {
  REDRAW = "redraw",
  OFFSET = "offset"
}

export enum LoanPurpose {
  OWNER = "owner",
  INVESTOR = "investor"
} 