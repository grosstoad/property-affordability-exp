# Rate Import System Documentation

This document explains how to use the rate import system to provide actual rates from JSON data for the application.

## Overview

The rate system allows you to import interest rates from JSON data and use them in the application. The rates are structured according to the `RateConfiguration` interface defined in `types/rates.ts`.

## Rate Data Structure

Each rate in the system has the following properties:

- `id`: Unique identifier
- `productName`: Name of the loan product
- `lender`: Name of the lender
- `productType`: Rate type (variable, fixed_1, etc.)
- `repaymentType`: Principal & Interest or Interest Only
- `borrowerType`: Owner occupier or investor
- `lvrRange`: LVR range (e.g., 0_60, 60_70, etc.)
- `hasOffset`: Whether it has offset account
- `hasRedraw`: Whether it has redraw facility
- `rate`: Interest rate (%)
- `comparisonRate`: Comparison rate (%)
- `maxLvr`: Maximum LVR allowed
- `minLoanAmount`: Minimum loan amount
- `maxLoanAmount`: Maximum loan amount (null if no limit)
- `isFirstHomeBuyerEligible`: Whether eligible for First Home Buyers
- `effectiveDate`: When this rate became effective

## How to Import Rates

### 1. Prepare Your Rate Data

You can prepare your rate data in Excel and then convert it to JSON format. The Excel file should have columns that match the properties in the `RateConfiguration` interface.

### 2. Convert Excel to JSON

If you have your data in Excel format, you can use the provided conversion utility to convert it to JSON:

```bash
# Install required dependencies
npm install xlsx uuid

# Run the conversion script
node scripts/convert-rates.js
```

This will generate a file at `data/convertedRates.json` with your rate data in the correct format.

### 3. Use the Converted Rates

The application is already set up to use the rates from `data/convertedRates.json`. The `newRateRepository.ts` file imports these rates and makes them available to the application.

## Rate Naming Conventions

- Products with offset feature should be named with "Flex" in the product name
- Products with redraw feature should be named with "Saver" in the product name
- For fixed rate products, redraw/offset features do not apply

## Special Rate Rules

- For Interest Only (IO) loans, the Principal & Interest (P&I) rate from the same product is used for comparison
- For Fixed rate loans, the variable P&I rate is used for comparison

## Testing Rate Lookup

You can test the rate lookup functionality using the provided test script:

```bash
node scripts/test-rate-lookup.js
```

This script will run several test cases to verify that the rate lookup is working correctly.

## Troubleshooting

If you encounter issues with the rate import process:

1. Check that your JSON data matches the `RateConfiguration` interface structure
2. Verify that the `newRateRepository.ts` file is correctly importing the rates
3. Run the test script to see if the rate lookup is working correctly
4. Check the browser console for any errors related to rate lookup

## Adding New Rates

To add new rates to the system:

1. Add the new rates to your Excel file or directly to the JSON file
2. Run the conversion script if you're using Excel
3. The application will automatically use the updated rates

## Rate Repository API

The rate repository provides the following functions:

- `getAllRates()`: Get all available rates
- `getRatesByLender(lender)`: Get rates by lender
- `findBestRate(...)`: Find the best rate based on criteria
- `findEligibleRates(...)`: Find all eligible rates based on criteria