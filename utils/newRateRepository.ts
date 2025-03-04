import { 
  RateConfiguration, 
  LvrRange, 
  LoanProductType, 
  RepaymentType, 
  BorrowerType,
  getLvrRangeFromValue
} from '@/types/rates';
import { parseExcelData } from './excelImporter';
// Import the JSON data
import rawConvertedRates from '@/data/convertedRates.json';

// Cast the imported JSON to the correct type
const convertedRates = rawConvertedRates as unknown as RateConfiguration[];

// Initialize with our converted rates
let rateDatabase: RateConfiguration[] = convertedRates;

/**
 * Initialize the rate database with data
 */
export function initializeRateDatabase(rates: RateConfiguration[]) {
  rateDatabase = rates;
}

/**
 * Get all available rates
 */
export function getAllRates(): RateConfiguration[] {
  return rateDatabase;
}

/**
 * Get rates by lender
 */
export function getRatesByLender(lender: string): RateConfiguration[] {
  return rateDatabase.filter(rate => rate.lender === lender);
}

/**
 * Find the best rate based on the given criteria
 */
export function findBestRate(
  lvrPercentage: number,
  productType: LoanProductType,
  repaymentType: RepaymentType,
  borrowerType: BorrowerType,
  loanAmount: number,
  isFirstHomeBuyer: boolean = false,
  hasOffset: boolean = false,
  hasRedraw: boolean = false
): RateConfiguration | null {
  const lvrRange = getLvrRangeFromValue(lvrPercentage);
  
  // Filter rates based on criteria
  const eligibleRates = rateDatabase.filter(rate => 
    rate.lvrRange === lvrRange &&
    rate.productType === productType &&
    rate.repaymentType === repaymentType &&
    rate.borrowerType === borrowerType &&
    loanAmount >= rate.minLoanAmount &&
    (rate.maxLoanAmount === null || loanAmount <= rate.maxLoanAmount) &&
    (isFirstHomeBuyer ? rate.isFirstHomeBuyerEligible : true) &&
    (hasOffset ? rate.hasOffset : true) &&
    (hasRedraw ? rate.hasRedraw : true)
  );
  
  // Sort by interest rate (lowest first)
  const sortedRates = [...eligibleRates].sort((a, b) => a.rate - b.rate);
  
  return sortedRates.length > 0 ? sortedRates[0] : null;
}

/**
 * Find all eligible rates based on the given criteria
 */
export function findEligibleRates(
  lvrPercentage: number,
  productType: LoanProductType,
  repaymentType: RepaymentType,
  borrowerType: BorrowerType,
  loanAmount: number,
  isFirstHomeBuyer: boolean = false
): RateConfiguration[] {
  const lvrRange = getLvrRangeFromValue(lvrPercentage);
  
  // Filter rates based on criteria
  const eligibleRates = rateDatabase.filter(rate => 
    rate.lvrRange === lvrRange &&
    rate.productType === productType &&
    rate.repaymentType === repaymentType &&
    rate.borrowerType === borrowerType &&
    loanAmount >= rate.minLoanAmount &&
    (rate.maxLoanAmount === null || loanAmount <= rate.maxLoanAmount) &&
    (isFirstHomeBuyer ? rate.isFirstHomeBuyerEligible : true)
  );
  
  // Sort by interest rate (lowest first)
  return [...eligibleRates].sort((a, b) => a.rate - b.rate);
}

/**
 * Convert old rate configuration to new format
 * This is a helper function for transitioning from the old system
 */
export function convertOldRateToNew(
  oldRate: {
    lvr: string;
    interestRateType: string;
    repaymentType: string;
    featureType: string;
    loanPurpose: string;
    rate: number;
    comparisonRate: number;
  }
): Partial<RateConfiguration> {
  // Map old LVR to new LVR range
  let lvrRange: LvrRange = '70_80'; // Default
  if (oldRate.lvr.includes('0-50%')) lvrRange = '0_60';
  else if (oldRate.lvr.includes('50-60%')) lvrRange = '0_60';
  else if (oldRate.lvr.includes('60-70%')) lvrRange = '60_70';
  else if (oldRate.lvr.includes('70-80%')) lvrRange = '70_80';
  else if (oldRate.lvr.includes('80-85%')) lvrRange = '80_85';
  
  // Map old interest rate type to new product type
  let productType: LoanProductType = 'variable';
  if (oldRate.interestRateType.includes('fixed_1')) productType = 'fixed_1';
  else if (oldRate.interestRateType.includes('fixed_2')) productType = 'fixed_2';
  else if (oldRate.interestRateType.includes('fixed_3')) productType = 'fixed_3';
  
  // Map old repayment type to new repayment type
  const repaymentType: RepaymentType = 
    oldRate.repaymentType.includes('interest_only') ? 'interest_only' : 'principal_and_interest';
  
  // Map old loan purpose to new borrower type
  const borrowerType: BorrowerType = 
    oldRate.loanPurpose.includes('investor') ? 'investor' : 'owner_occupier';
  
  // Map feature type to hasOffset and hasRedraw
  const hasOffset = oldRate.featureType.includes('offset');
  const hasRedraw = oldRate.featureType.includes('redraw');
  
  return {
    productName: `${borrowerType === 'owner_occupier' ? 'Owner Occupier' : 'Investor'} ${
      productType === 'variable' ? 'Variable' : `${productType.split('_')[1]} Year Fixed`
    } ${repaymentType === 'principal_and_interest' ? 'P&I' : 'IO'}`,
    lender: 'Default Lender',
    productType,
    repaymentType,
    borrowerType,
    lvrRange,
    hasOffset,
    hasRedraw,
    rate: oldRate.rate,
    comparisonRate: oldRate.comparisonRate,
    maxLvr: parseInt(oldRate.lvr.split('-')[1]) || 80,
    minLoanAmount: 50000,
    maxLoanAmount: null,
    isFirstHomeBuyerEligible: true,
    effectiveDate: new Date().toISOString().split('T')[0]
  };
}

/**
 * Import rates from Excel file
 */
export async function importRatesFromExcel(fileData: ArrayBuffer): Promise<RateConfiguration[]> {
  try {
    // Parse the Excel data
    const rates = await parseExcelData(fileData);
    
    // Initialize the rate database with the imported rates
    initializeRateDatabase(rates);
    
    return rates;
  } catch (error) {
    console.error('Error importing rates from Excel:', error);
    throw error;
  }
} 