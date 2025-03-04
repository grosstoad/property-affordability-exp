/**
 * Loan product types
 */
export type LoanProductType = 'variable' | 'fixed_1' | 'fixed_2' | 'fixed_3' | 'fixed_4' | 'fixed_5';

/**
 * Repayment types
 */
export type RepaymentType = 'principal_and_interest' | 'interest_only';

/**
 * Borrower types
 */
export type BorrowerType = 'owner_occupier' | 'investor';

/**
 * LVR range (formatted as min_max)
 */
export type LvrRange = '0_60' | '60_70' | '70_80' | '80_85' | '85_90' | '90_95';

/**
 * Complete rate configuration structure
 */
export interface RateConfiguration {
  id: string;                       // Unique identifier
  productName: string;              // Name of the loan product
  lender: string;                   // Name of the lender
  productType: LoanProductType;     // Rate type (variable, fixed_1, etc.)
  repaymentType: RepaymentType;     // P&I or IO
  borrowerType: BorrowerType;       // Owner occupier or investor
  lvrRange: LvrRange;               // LVR range
  hasOffset: boolean;               // Whether it has offset account
  hasRedraw: boolean;               // Whether it has redraw facility
  rate: number;                     // Interest rate (%)
  comparisonRate: number;           // Comparison rate (%)
  maxLvr: number;                   // Maximum LVR allowed
  minLoanAmount: number;            // Minimum loan amount
  maxLoanAmount: number | null;     // Maximum loan amount (null if no limit)
  isFirstHomeBuyerEligible: boolean;// Whether eligible for FHB
  effectiveDate: string;            // When this rate became effective
}

/**
 * Convert numeric LVR to appropriate range
 */
export const getLvrRangeFromValue = (lvr: number): LvrRange => {
  if (lvr <= 60) return '0_60';
  if (lvr <= 70) return '60_70';
  if (lvr <= 80) return '70_80';
  if (lvr <= 85) return '80_85';
  if (lvr <= 90) return '85_90';
  return '90_95';
};

/**
 * Format LVR range for display
 */
export const formatLvrRange = (range: LvrRange): string => {
  const [min, max] = range.split('_');
  return `${min}%-${max}%`;
};

/**
 * Format product type for display
 */
export const formatProductType = (type: LoanProductType): string => {
  switch (type) {
    case 'variable':
      return 'Variable';
    case 'fixed_1':
      return '1 Year Fixed';
    case 'fixed_2':
      return '2 Year Fixed';
    case 'fixed_3':
      return '3 Year Fixed';
    case 'fixed_4':
      return '4 Year Fixed';
    case 'fixed_5':
      return '5 Year Fixed';
    default:
      return type;
  }
};

/**
 * Format repayment type for display
 */
export const formatRepaymentType = (type: RepaymentType): string => {
  switch (type) {
    case 'principal_and_interest':
      return 'Principal & Interest';
    case 'interest_only':
      return 'Interest Only';
    default:
      return type;
  }
};

/**
 * Format borrower type for display
 */
export const formatBorrowerType = (type: BorrowerType): string => {
  switch (type) {
    case 'owner_occupier':
      return 'Owner Occupier';
    case 'investor':
      return 'Investor';
    default:
      return type;
  }
};

// Sample empty rates array - will be populated from external source
export const rates: RateConfiguration[] = []; 