/**
 * Utility to convert raw rate data from JSON to the RateConfiguration format
 * This maps the Excel/JSON columns to the proper structure needed by the application
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Map product type based on INTEREST_TYPE_C and FIXED_PERIOD_C
function mapProductType(interestType, fixedPeriod) {
  if (interestType === 'VARIABLE_RATE') {
    return 'variable';
  } else if (interestType === 'FIXED_RATE') {
    if (fixedPeriod === 1) return 'fixed_1_year';
    if (fixedPeriod === 2) return 'fixed_2_year';
    if (fixedPeriod === 3) return 'fixed_3_year';
    return 'fixed_1_year'; // Default to 1 year if not specified
  }
  return 'variable'; // Default
}

// Map repayment type
function mapRepaymentType(payOffType) {
  return payOffType === 'PRINCIPAL_AND_INTEREST' ? 'principal_and_interest' : 'interest_only';
}

// Map borrower type
function mapBorrowerType(propertyUse) {
  return propertyUse === 'OWNER_OCCUPIED' ? 'owner' : 'investor';
}

// Map LVR range
function mapLvrRange(minLvr, maxLvr) {
  if (maxLvr <= 60) return '0_60';
  if (maxLvr <= 70) return '60_70';
  if (maxLvr <= 80) return '70_80';
  if (maxLvr <= 85) return '80_85';
  if (maxLvr <= 90) return '85_90';
  return '90_95';
}

// Determine if product has offset or redraw based on product name
function hasFeature(productName, featureType) {
  if (featureType === 'offset') {
    return productName.includes('Flex');
  } else if (featureType === 'redraw') {
    return productName.includes('Saver');
  }
  return false;
}

// Convert raw data to RateConfiguration format
function convertRates() {
  try {
    // Read the raw JSON data
    const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/rates.json'), 'utf8'));
    
    // Transform the data
    const convertedRates = rawData.map(item => {
      // For IO loans, use the P&I rate from INTEREST_RATE_ONGOING_C
      const rate = item.PAY_OFF_TYPE_C === 'INTEREST_ONLY' 
        ? item.INTEREST_RATE_ONGOING_C 
        : item.INTEREST_RATE_C;
      
      // For fixed rate loans, use the variable P&I rate from INTEREST_RATE_ONGOING_C
      const comparisonRate = item.INTEREST_TYPE_C === 'FIXED_RATE'
        ? item.INTEREST_RATE_ONGOING_C
        : item.INTEREST_RATE_C + 0.2; // Add 0.2% for comparison rate
      
      const productType = mapProductType(item.INTEREST_TYPE_C, item.FIXED_PERIOD_C);
      
      // Determine if product has offset/redraw based on product name
      // For fixed rate products, these features don't apply
      const hasOffset = productType.includes('fixed') ? false : hasFeature(item.PRODUCT_NAME_C, 'offset');
      const hasRedraw = productType.includes('fixed') ? false : hasFeature(item.PRODUCT_NAME_C, 'redraw');
      
      return {
        id: uuidv4(),
        lender: 'Mortgage Choice',
        productName: item.PRODUCT_NAME_C,
        productType: productType,
        repaymentType: mapRepaymentType(item.PAY_OFF_TYPE_C),
        borrowerType: mapBorrowerType(item.PROPERTY_USE_C),
        lvrRange: mapLvrRange(item.LVR_MIN_C, item.LVR_MAX_C),
        hasOffset: hasOffset,
        hasRedraw: hasRedraw,
        rate: rate,
        comparisonRate: comparisonRate,
        maxLvr: item.LVR_MAX_C,
        minLoanAmount: 150000, // Default minimum loan amount
        maxLoanAmount: 2000000, // Default maximum loan amount
        isFirstHomeBuyerEligible: true, // Default to true
        effectiveDate: new Date().toISOString().split('T')[0] // Today's date
      };
    });
    
    // Write the converted data to a new file
    fs.writeFileSync(
      path.join(__dirname, '../data/convertedRates.json'), 
      JSON.stringify(convertedRates, null, 2)
    );
    
    console.log(`Successfully converted ${convertedRates.length} rates to RateConfiguration format`);
    console.log(`Output saved to: ${path.join(__dirname, '../data/convertedRates.json')}`);
    
    return convertedRates;
  } catch (error) {
    console.error('Error converting rates:', error);
    return [];
  }
}

// Run the conversion if this file is executed directly
if (require.main === module) {
  convertRates();
}

module.exports = { convertRates }; 