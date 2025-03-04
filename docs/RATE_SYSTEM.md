# Rate System Documentation

This document provides comprehensive documentation for the new rate system used in the property affordability application.

## Overview

The rate system allows the application to find the best interest rates for loans based on various parameters such as loan-to-value ratio (LVR), product type, repayment type, borrower type, and more. The system is designed to be flexible, maintainable, and easy to use throughout the application.

## Architecture

The rate system consists of the following components:

1. **Rate Types** (`types/rates.ts`): Defines the types and interfaces used by the rate system.
2. **Rate Repository** (`utils/newRateRepository.ts`): Provides functions for accessing and querying the rate database.
3. **Rate Service** (`utils/rateService.ts`): Centralizes rate-related functionality and provides a clean API.
4. **Rate Hook** (`hooks/useRates.ts`): Custom React hook for using the rate system in components.

## Rate Types

The rate system uses the following key types:

- `LoanProductType`: Type of loan product (variable, fixed_1, fixed_2, etc.)
- `RepaymentType`: Type of repayment (principal_and_interest, interest_only)
- `BorrowerType`: Type of borrower (owner_occupier, investor)
- `LvrRange`: LVR range (0_60, 60_70, 70_80, etc.)
- `RateConfiguration`: Complete rate configuration structure

## Rate Repository

The rate repository provides the following functions:

- `getAllRates()`: Get all available rates
- `getRatesByLender(lender)`: Get rates by lender
- `findBestRate(...)`: Find the best rate based on criteria
- `findEligibleRates(...)`: Find all eligible rates based on criteria

## Rate Service

The rate service centralizes all rate-related functionality and provides a clean API for the application. It includes the following functions:

- `getBestRate(...)`: Find the best interest rate based on loan parameters
- `getAllAvailableRates()`: Get all available rates
- `getRatesByLenderName(lender)`: Get rates by lender
- `convertOldRateTypesToNew(...)`: Convert old rate system types to new rate system types
- `calculateAssessmentRate(...)`: Calculate the assessment rate (base rate + buffer)
- `getDefaultRate()`: Get the default interest rate
- `getDefaultComparisonRate()`: Get the default comparison rate
- `calculateMonthlyRepayment(...)`: Calculate monthly repayment amount

## Rate Hook

The rate hook (`useRates`) provides a React-friendly way to use the rate system in components. It includes the following:

- State for current rate, comparison rate, and selected rate configuration
- Functions for finding the best rate, calculating monthly repayments, and more
- Memoized callbacks for optimal performance

## Usage Examples

### Finding the Best Rate

```typescript
import { useRates } from '@/hooks/useRates';

function MyComponent() {
  const { findBestRate } = useRates();
  
  // Find the best rate
  const bestRate = findBestRate(
    80, // LVR percentage
    'variable', // Product type
    'principal_and_interest', // Repayment type
    'owner_occupier', // Borrower type
    500000, // Loan amount
    false, // Is first home buyer
    false, // Has offset
    true // Has redraw
  );
  
  // Use the best rate
  if (bestRate) {
    console.log(`Best rate: ${bestRate.rate}%`);
    console.log(`Comparison rate: ${bestRate.comparisonRate}%`);
  }
}
```

### Calculating Monthly Repayments

```typescript
import { useRates } from '@/hooks/useRates';

function MyComponent() {
  const { getMonthlyRepayment } = useRates();
  
  // Calculate monthly repayment
  const monthlyRepayment = getMonthlyRepayment(
    500000, // Loan amount
    5.74, // Interest rate
    30 // Loan term in years
  );
  
  console.log(`Monthly repayment: $${monthlyRepayment.toFixed(2)}`);
}
```

### Using Old Rate System Parameters

```typescript
import { useRates } from '@/hooks/useRates';

function MyComponent() {
  const { findBestRateFromOldParams } = useRates();
  
  // Find the best rate using old rate system parameters
  const bestRate = findBestRateFromOldParams(
    80, // LVR percentage
    'VARIABLE', // Interest rate type
    'PRINCIPAL_AND_INTEREST', // Repayment type
    'OWNER', // Loan purpose
    'REDRAW', // Feature type
    500000, // Loan amount
    false // Is first home buyer
  );
  
  // Use the best rate
  if (bestRate) {
    console.log(`Best rate: ${bestRate.rate}%`);
    console.log(`Comparison rate: ${bestRate.comparisonRate}%`);
  }
}
```

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

## Best Practices

1. **Use the Rate Hook**: Always use the `useRates` hook in components that need rate-related functionality.
2. **Avoid Direct Repository Access**: Avoid accessing the rate repository directly. Use the rate service or hook instead.
3. **Handle Missing Rates**: Always handle the case where no rate is found by providing default values.
4. **Use Type Safety**: Leverage TypeScript's type system to ensure correct usage of the rate system.

## Troubleshooting

If you encounter issues with the rate system:

1. Check that the rate data is correctly loaded
2. Verify that the parameters passed to `findBestRate` are correct
3. Check the browser console for any errors
4. Ensure that the rate hook is used correctly in components 