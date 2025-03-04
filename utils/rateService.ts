import { 
  findBestRate, 
  getAllRates, 
  getRatesByLender 
} from './newRateRepository';
import { 
  LoanProductType, 
  RepaymentType, 
  BorrowerType, 
  RateConfiguration,
  getLvrRangeFromValue
} from '@/types/rates';

/**
 * Centralized service for all rate-related operations
 * This service provides a clean API for working with rates throughout the application
 */

/**
 * Find the best interest rate based on loan parameters
 * 
 * @param lvrPercentage - Loan to value ratio percentage
 * @param productType - Type of loan product (variable, fixed_1, etc.)
 * @param repaymentType - Type of repayment (principal_and_interest, interest_only)
 * @param borrowerType - Type of borrower (owner_occupier, investor)
 * @param loanAmount - Amount of the loan
 * @param isFirstHomeBuyer - Whether the borrower is a first home buyer
 * @param hasOffset - Whether the loan has an offset account
 * @param hasRedraw - Whether the loan has redraw facility
 * @returns The best rate configuration or null if none found
 */
export const getBestRate = (
  lvrPercentage: number,
  productType: LoanProductType,
  repaymentType: RepaymentType,
  borrowerType: BorrowerType,
  loanAmount: number,
  isFirstHomeBuyer: boolean = false,
  hasOffset: boolean = false,
  hasRedraw: boolean = false
): RateConfiguration | null => {
  return findBestRate(
    lvrPercentage,
    productType,
    repaymentType,
    borrowerType,
    loanAmount,
    isFirstHomeBuyer,
    hasOffset,
    hasRedraw
  );
};

/**
 * Get all available rates
 * 
 * @returns Array of all rate configurations
 */
export const getAllAvailableRates = (): RateConfiguration[] => {
  return getAllRates();
};

/**
 * Get rates by lender
 * 
 * @param lender - Name of the lender
 * @returns Array of rate configurations for the specified lender
 */
export const getRatesByLenderName = (lender: string): RateConfiguration[] => {
  return getRatesByLender(lender);
};

/**
 * Convert old rate system types to new rate system types
 * 
 * @param interestRateType - Old interest rate type
 * @param repaymentType - Old repayment type
 * @param loanPurpose - Old loan purpose
 * @param featureType - Old feature type
 * @returns Object with new rate system types
 */
export const convertOldRateTypesToNew = (
  interestRateType: string,
  repaymentType: string,
  loanPurpose: string,
  featureType: string,
  fixedPeriod?: number
): {
  productType: LoanProductType,
  newRepaymentType: RepaymentType,
  borrowerType: BorrowerType,
  hasOffset: boolean,
  hasRedraw: boolean
} => {
  // Convert interest rate type to product type
  let productType: LoanProductType = 'variable';
  if (interestRateType.includes('FIXED')) {
    if (fixedPeriod === 1 || interestRateType.includes('1')) productType = 'fixed_1';
    else if (fixedPeriod === 2 || interestRateType.includes('2')) productType = 'fixed_2';
    else if (fixedPeriod === 3 || interestRateType.includes('3')) productType = 'fixed_3';
    else if (fixedPeriod === 4) productType = 'fixed_4';
    else if (fixedPeriod === 5) productType = 'fixed_5';
  }

  // Convert repayment type
  const newRepaymentType: RepaymentType = 
    repaymentType.includes('INTEREST_ONLY') ? 'interest_only' : 'principal_and_interest';

  // Convert loan purpose to borrower type
  const borrowerType: BorrowerType = 
    loanPurpose.includes('OWNER') ? 'owner_occupier' : 'investor';

  // Convert feature type
  const hasOffset = featureType.includes('OFFSET');
  const hasRedraw = featureType.includes('REDRAW') || featureType.includes('BASIC');

  return {
    productType,
    newRepaymentType,
    borrowerType,
    hasOffset,
    hasRedraw
  };
};

/**
 * Calculate the assessment rate (base rate + buffer)
 * 
 * @param baseRate - Base interest rate
 * @param buffer - Buffer to add to the base rate (default: 3.0)
 * @returns Assessment rate
 */
export const calculateAssessmentRate = (baseRate: number, buffer: number = 3.0): number => {
  return baseRate + buffer;
};

/**
 * Get the default interest rate to use when no rate is found
 * 
 * @returns Default interest rate
 */
export const getDefaultRate = (): number => {
  return 5.74;
};

/**
 * Get the default comparison rate to use when no rate is found
 * 
 * @returns Default comparison rate
 */
export const getDefaultComparisonRate = (): number => {
  return 5.65;
};

/**
 * Calculate monthly repayment amount
 * 
 * @param loanAmount - Amount of the loan
 * @param interestRate - Annual interest rate (percentage)
 * @param loanTermYears - Loan term in years
 * @returns Monthly repayment amount
 */
export const calculateMonthlyRepayment = (
  loanAmount: number,
  interestRate: number,
  loanTermYears: number
): number => {
  const monthlyRate = interestRate / 100 / 12;
  const termMonths = loanTermYears * 12;
  return (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);
}; 