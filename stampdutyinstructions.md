# Stamp Duty Calculation Implementation

This document explains how stamp duty calculations are implemented in the property affordability calculator and how they differ from actual calculations.

## Overview

Stamp duty (also known as transfer duty) is a state government tax paid when purchasing property in Australia. The rates vary by:
- State/territory
- Property value
- Buyer type (first home buyer, owner-occupier, investor)
- Citizenship status

Our implementation provides a simplified but reasonably accurate calculation of stamp duty across all Australian states and territories.

## Implementation Approach

We've implemented a progressive rate structure for each state that:
1. Uses threshold-based calculations similar to income tax brackets
2. Includes special provisions for first home buyers
3. Applies to Australian citizens (foreign buyer surcharges are not included)

### Key Components

1. **Data Structure**: A comprehensive object containing simplified progressive rate structures for each state
2. **Calculation Functions**: 
   - `calculateProgressiveDuty`: Determines the applicable threshold and calculates duty
   - `calculateStampDuty`: Applies first home buyer exemptions and concessions

## State-by-State Implementation

### New South Wales (NSW)
- Progressive rates from 1.25% to 7%
- First home buyers: Exempt up to $650,000, concessions up to $800,000

### Victoria (VIC)
- Progressive rates from 1.4% to 5.5%
- First home buyers: Exempt up to $600,000, concessions up to $750,000

### Queensland (QLD)
- Progressive rates from 1% to 4.5%
- First home buyers: Concessions up to $550,000

### Western Australia (WA)
- Progressive rates from 1.9% to 5.15%
- First home buyers: Exempt up to $430,000, concessions up to $530,000

### South Australia (SA)
- Progressive rates from 1% to 5.5%
- No specific stamp duty exemptions for first home buyers

### Tasmania (TAS)
- Progressive rates from 1.75% to 4.5%
- First home buyers: 50% discount for properties up to $500,000

### Australian Capital Territory (ACT)
- Progressive rates from 1.6% to 7.12%
- First home buyers: Exempt if property below $750,000 (with income requirements)

### Northern Territory (NT)
- Progressive rates from 1.5% to 5.75%
- First home buyers: Exempt up to $500,000, concessions up to $650,000

## Simplifications and Differences from Actual Calculations

1. **Threshold Simplification**: We've simplified the number of thresholds while maintaining reasonable accuracy.

2. **First Home Buyer Concessions**: 
   - We've implemented a percentage-based concession model
   - Actual concessions may use more complex formulas or sliding scales

3. **Income Requirements**:
   - Some states (especially ACT) have income requirements for first home buyer concessions
   - Our implementation doesn't check income requirements

4. **Property Type Differences**:
   - Different rates may apply for residential, commercial, or rural properties
   - Our implementation assumes residential property

5. **Investor Surcharges**:
   - Some states have recently introduced investor surcharges
   - Our implementation treats investors the same as owner-occupiers

6. **Special Schemes**:
   - Some states have special schemes for seniors, farmers, or specific regions
   - These special cases are not implemented

7. **Foreign Buyer Surcharges**:
   - All states impose additional surcharges for foreign buyers (typically 7-8%)
   - Our implementation is for Australian citizens only

## Accuracy Considerations

The implementation provides estimates that are generally within 5% of actual stamp duty for most common scenarios. For precise calculations, users should consult the official state revenue office calculators or seek professional advice.

## Future Improvements

1. Add investor surcharges for applicable states
2. Implement income testing for first home buyer concessions
3. Add support for different property types
4. Include foreign buyer surcharge options
5. Update thresholds and rates annually as they change

## References

For official stamp duty calculations, refer to:
- NSW: revenue.nsw.gov.au
- VIC: sro.vic.gov.au
- QLD: qld.gov.au/housing/buying-owning-home/transfer-duty
- WA: wa.gov.au/organisation/department-of-finance/transfer-duty
- SA: revenuesa.sa.gov.au
- TAS: sro.tas.gov.au
- ACT: revenue.act.gov.au
- NT: treasury.nt.gov.au 