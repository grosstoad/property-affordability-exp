"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, CheckCircle, XCircle, DollarSign, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CalculationResult } from "@/utils/calculationUtils"

// Utility function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

type BorrowingPowerResultsProps = {
  results: CalculationResult;
  desiredLoanAmount: number;
}

export function BorrowingPowerResults({ results, desiredLoanAmount }: BorrowingPowerResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Determine if the desired loan is within the borrowing capacity
  const isWithinCapacity = desiredLoanAmount <= results.maxLoan;
  const capacityDifference = results.maxLoan - desiredLoanAmount;
  const capacityPercentage = (desiredLoanAmount / results.maxLoan) * 100;
  
  // Round LVR to 2 decimal places
  const lvrFormatted = results.loanToValueRatio.toFixed(2);
  
  return (
    <div className="space-y-4">
      <Card className={`overflow-hidden transition-all duration-300 ${isWithinCapacity ? 'border-green-200' : 'border-yellow-200'}`}>
        <div 
          className={`p-4 flex justify-between items-center cursor-pointer ${isWithinCapacity ? 'bg-green-50' : 'bg-yellow-50'}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {isWithinCapacity ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            )}
            <div>
              <h3 className="font-bold text-lg">Borrowing Power Assessment</h3>
              <p className="text-sm">
                {isWithinCapacity 
                  ? `You can borrow ${formatCurrency(capacityDifference)} more than needed.` 
                  : `You're ${formatCurrency(Math.abs(capacityDifference))} short of your desired amount.`}
              </p>
            </div>
          </div>
          <div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </div>
        
        <CardContent className={`p-0 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'} transition-all duration-300 overflow-hidden`}>
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-4">Loan Comparison</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Desired Loan</span>
                    <span className="font-bold">{formatCurrency(desiredLoanAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Maximum Borrowing</span>
                    <span className="font-bold">{formatCurrency(results.maxLoan)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Difference</span>
                    <span className={`font-bold ${isWithinCapacity ? 'text-green-600' : 'text-red-600'}`}>
                      {isWithinCapacity ? '+' : ''}{formatCurrency(capacityDifference)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isWithinCapacity ? 'bg-green-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      Using {capacityPercentage.toFixed(1)}% of borrowing capacity
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-4">Serviceability</h4>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${results.isServiceable ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="flex items-center gap-2">
                      {results.isServiceable ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium">Loan is serviceable</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium">Loan is not serviceable</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Monthly Repayment</span>
                    <span className="font-bold">{formatCurrency(results.monthlyRepayment)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Monthly Surplus</span>
                    <span className={`font-bold ${results.surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(results.surplus)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Loan to Value Ratio</span>
                    <span className="font-bold">{lvrFormatted}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">Property Details</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Max Property Value</span>
                    <span className="font-bold">{formatCurrency(results.maxProperty)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Stamp Duty</span>
                    <span className="font-bold">{formatCurrency(results.stampDuty)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Available Deposit</span>
                    <span className="font-bold">{formatCurrency(results.deposit)}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium">Income</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Annual Income</span>
                    <span className="font-bold">{formatCurrency(results.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Income</span>
                    <span className="font-bold">{formatCurrency(results.totalIncome / 12)}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-red-500" />
                  <h4 className="font-medium">Expenses & Debt</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Annual Expenses</span>
                    <span className="font-bold">{formatCurrency(results.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Annual Debt Payments</span>
                    <span className="font-bold">{formatCurrency(results.totalDebt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Define the rate structure
type RateConfiguration = {
  lvr: LvrTier;
  interestRateType: InterestRateType;
  repaymentType: RepaymentType;
  featureType: FeatureType;
  loanPurpose: LoanPurpose;
  rate: number;
  comparisonRate: number;
}

// Define the enums for each parameter
enum LvrTier {
  TIER_0_50 = "0-50%",
  TIER_50_60 = "50-60%",
  TIER_60_70 = "60-70%",
  TIER_70_80 = "70-80%",
  TIER_80_85 = "80-85%"
}

enum InterestRateType {
  VARIABLE = "variable",
  FIXED_1_YEAR = "fixed_1_year",
  FIXED_2_YEAR = "fixed_2_year",
  FIXED_3_YEAR = "fixed_3_year"
}

enum RepaymentType {
  PRINCIPAL_AND_INTEREST = "principal_and_interest",
  INTEREST_ONLY = "interest_only"
}

enum FeatureType {
  REDRAW = "redraw",
  OFFSET = "offset"
}

enum LoanPurpose {
  OWNER = "owner",
  INVESTOR = "investor"
} 