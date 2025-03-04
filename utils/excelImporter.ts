import { RateConfiguration, LvrRange, LoanProductType, RepaymentType, BorrowerType } from '@/types/rates';

/**
 * Parse Excel data into RateConfiguration objects
 * This is a placeholder implementation that would need to be replaced with actual Excel parsing logic
 * using a library like xlsx or exceljs
 */
export async function parseExcelData(data: ArrayBuffer): Promise<RateConfiguration[]> {
  // In a real implementation, you would:
  // 1. Use a library like xlsx or exceljs to parse the Excel file
  // 2. Map the Excel columns to RateConfiguration properties
  // 3. Validate the data
  // 4. Return an array of RateConfiguration objects
  
  // For now, return some sample data
  return [
    createSampleRate('Mortgage Choice', 'Freedom Variable', 'variable', 'principal_and_interest', 'owner_occupier', '0_60', 5.99),
    createSampleRate('Mortgage Choice', 'Freedom Variable', 'variable', 'principal_and_interest', 'owner_occupier', '60_70', 6.09),
    createSampleRate('Mortgage Choice', 'Freedom Variable', 'variable', 'principal_and_interest', 'owner_occupier', '70_80', 6.19),
    createSampleRate('Mortgage Choice', 'Freedom Variable', 'variable', 'principal_and_interest', 'investor', '0_60', 6.29),
    createSampleRate('Mortgage Choice', 'Freedom Variable', 'variable', 'principal_and_interest', 'investor', '60_70', 6.39),
    createSampleRate('Mortgage Choice', 'Freedom Variable', 'variable', 'principal_and_interest', 'investor', '70_80', 6.49),
    createSampleRate('Mortgage Choice', '1 Year Fixed', 'fixed_1', 'principal_and_interest', 'owner_occupier', '0_60', 5.89),
    createSampleRate('Mortgage Choice', '1 Year Fixed', 'fixed_1', 'principal_and_interest', 'owner_occupier', '60_70', 5.99),
    createSampleRate('Mortgage Choice', '1 Year Fixed', 'fixed_1', 'principal_and_interest', 'owner_occupier', '70_80', 6.09),
    createSampleRate('Own Home', 'Basic Variable', 'variable', 'principal_and_interest', 'owner_occupier', '0_60', 5.79),
    createSampleRate('Own Home', 'Basic Variable', 'variable', 'principal_and_interest', 'owner_occupier', '60_70', 5.89),
    createSampleRate('Own Home', 'Basic Variable', 'variable', 'principal_and_interest', 'owner_occupier', '70_80', 5.99),
  ];
}

/**
 * Helper function to create a sample rate
 */
function createSampleRate(
  lender: string,
  productName: string,
  productType: LoanProductType,
  repaymentType: RepaymentType,
  borrowerType: BorrowerType,
  lvrRange: LvrRange,
  rate: number
): RateConfiguration {
  const id = `${lender}_${productName}_${productType}_${repaymentType}_${borrowerType}_${lvrRange}`.replace(/\s+/g, '_').toLowerCase();
  
  return {
    id,
    lender,
    productName,
    productType,
    repaymentType,
    borrowerType,
    lvrRange,
    hasOffset: productName.includes('Freedom'),
    hasRedraw: true,
    rate,
    comparisonRate: rate + 0.2,
    maxLvr: parseInt(lvrRange.split('_')[1]),
    minLoanAmount: 50000,
    maxLoanAmount: null,
    isFirstHomeBuyerEligible: true,
    effectiveDate: new Date().toISOString().split('T')[0]
  };
}

/**
 * Generate Excel template for rates
 * This would generate an Excel file with the correct columns for users to fill in
 */
export function generateExcelTemplate(): ArrayBuffer {
  // In a real implementation, you would:
  // 1. Create a new Excel workbook
  // 2. Add a sheet with the correct columns
  // 3. Add validation and formatting
  // 4. Return the Excel file as an ArrayBuffer
  
  // For now, return an empty ArrayBuffer
  return new ArrayBuffer(0);
} 