#!/usr/bin/env node

/**
 * Script to test the rate lookup functionality
 * This script will test finding rates with different criteria
 */

// Since this is a Node.js script and we're using TypeScript in the codebase,
// we'll simulate the rate lookup logic here for testing purposes

const fs = require('fs');
const path = require('path');

// Load the converted rates
const convertedRates = require('../data/convertedRates.json');

console.log(`Loaded ${convertedRates.length} rates from convertedRates.json\n`);

// Helper function to get LVR range from value
function getLvrRangeFromValue(lvr) {
  if (lvr <= 60) return '0_60';
  if (lvr <= 70) return '60_70';
  if (lvr <= 80) return '70_80';
  if (lvr <= 85) return '80_85';
  if (lvr <= 90) return '85_90';
  return '90_95';
}

// Simulate the findBestRate function
function findBestRate(
  lvrPercentage,
  productType,
  repaymentType,
  borrowerType,
  loanAmount,
  isFirstHomeBuyer = false,
  hasOffset = false,
  hasRedraw = false
) {
  const lvrRange = getLvrRangeFromValue(lvrPercentage);
  
  // Filter rates based on criteria
  const eligibleRates = convertedRates.filter(rate => 
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

// Test cases
const testCases = [
  {
    name: "Owner Occupier Variable P&I with Redraw (LVR 75%)",
    params: {
      lvrPercentage: 75,
      productType: "variable",
      repaymentType: "principal_and_interest",
      borrowerType: "owner",
      loanAmount: 500000,
      hasRedraw: true
    }
  },
  {
    name: "Owner Occupier Variable IO with Offset (LVR 55%)",
    params: {
      lvrPercentage: 55,
      productType: "variable",
      repaymentType: "interest_only",
      borrowerType: "owner",
      loanAmount: 800000,
      hasOffset: true
    }
  },
  {
    name: "Investor Fixed 1 Year P&I (LVR 65%)",
    params: {
      lvrPercentage: 65,
      productType: "fixed_1_year",
      repaymentType: "principal_and_interest",
      borrowerType: "investor",
      loanAmount: 600000
    }
  },
  {
    name: "Investor Variable IO with Offset (LVR 75%)",
    params: {
      lvrPercentage: 75,
      productType: "variable",
      repaymentType: "interest_only",
      borrowerType: "investor",
      loanAmount: 700000,
      hasOffset: true
    }
  }
];

// Run the tests
console.log("Running rate lookup tests...\n");

testCases.forEach(test => {
  console.log(`Test: ${test.name}`);
  console.log(`Parameters: ${JSON.stringify(test.params, null, 2)}`);
  
  const result = findBestRate(
    test.params.lvrPercentage,
    test.params.productType,
    test.params.repaymentType,
    test.params.borrowerType,
    test.params.loanAmount,
    test.params.isFirstHomeBuyer || false,
    test.params.hasOffset || false,
    test.params.hasRedraw || false
  );
  
  if (result) {
    console.log(`Result: Found rate with ID ${result.id}`);
    console.log(`Product: ${result.productName}`);
    console.log(`Interest Rate: ${result.rate}%`);
    console.log(`Comparison Rate: ${result.comparisonRate}%`);
    console.log(`Features: ${result.hasOffset ? 'Offset, ' : ''}${result.hasRedraw ? 'Redraw' : ''}`);
  } else {
    console.log("Result: No matching rate found");
  }
  
  console.log("\n-----------------------------------\n");
});

console.log("Rate lookup tests completed!"); 