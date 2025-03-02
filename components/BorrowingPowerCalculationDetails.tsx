import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CalculationResult } from "../utils/calculationUtils";
import { formatCurrency } from "../utils/formatters";

interface BorrowingPowerCalculationDetailsProps {
  results: CalculationResult;
  desiredLoanAmount: number;
  interestRate: string;
  propertyValue: string;
  parseCurrencyFn: (value: string) => number;
  loanTerm: string;
}

const BorrowingPowerCalculationDetails: React.FC<BorrowingPowerCalculationDetailsProps> = ({ 
  results, 
  desiredLoanAmount,
  interestRate,
  propertyValue,
  parseCurrencyFn,
  loanTerm,
}) => {
  // Automatically expand all sections when results are available
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['income', 'expenses', 'debt', 'serviceability', 'maxLoan', 'lvr', 'rateIteration'])
  );
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };
  
  const renderSection = (id: string, title: string, content: React.ReactNode) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="border rounded-md mb-3">
        <div 
          className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 hover:bg-gray-100"
          onClick={() => toggleSection(id)}
        >
          <h3 className="font-medium">{title}</h3>
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
        
        {isExpanded && (
          <div className="p-3 border-t">
            {content}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Calculation Details</h2>
      
      {renderSection("income", "Income Analysis", (
        <div className="space-y-2">
          <p>Total Annual Income: {formatCurrency(results.totalIncome)}</p>
          <p>Total Monthly Income: {formatCurrency(results.totalIncome / 12)}</p>
          <p className="text-sm text-gray-500">
            This is the sum of all income sources after applying income shading rules.
          </p>
        </div>
      ))}
      
      {renderSection("expenses", "Expense Analysis", (
        <div className="space-y-2">
          <p>Total Annual Expenses: {formatCurrency(results.totalExpenses)}</p>
          <p>Total Monthly Expenses: {formatCurrency(results.totalExpenses / 12)}</p>
          <p className="text-sm text-gray-500">
            This includes base living expenses and additional costs for dependents.
          </p>
        </div>
      ))}
      
      {renderSection("debt", "Debt Analysis", (
        <div className="space-y-3">
          <p>Total Annual Debt Commitments: {formatCurrency(results.totalDebt)}</p>
          <p>Total Monthly Debt Commitments: {formatCurrency(results.totalDebt / 12)}</p>
          
          <div className="bg-gray-50 p-3 rounded space-y-2">
            <h4 className="font-medium text-sm">Debt Breakdown (Monthly):</h4>
            {results.debtBreakdown && (
              <div className="space-y-1 text-sm">
                {results.debtBreakdown.existingDebt > 0 && (
                  <div className="flex justify-between">
                    <span>Existing Loan Repayments:</span>
                    <span>{formatCurrency(results.debtBreakdown.existingDebt / 12)}</span>
                  </div>
                )}
                {results.debtBreakdown.creditCard > 0 && (
                  <div className="flex justify-between">
                    <span>Credit Card Commitments:</span>
                    <span>{formatCurrency(results.debtBreakdown.creditCard / 12)}</span>
                  </div>
                )}
                {results.debtBreakdown.proposedLoan > 0 && (
                  <div className="flex justify-between">
                    <span>Proposed Loan Repayments:</span>
                    <span>{formatCurrency(results.debtBreakdown.proposedLoan / 12)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-1 mt-1">
                  <span>Total Monthly Debt:</span>
                  <span>{formatCurrency(results.totalDebt / 12)}</span>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Note: Credit card commitments are calculated as {results.debtBreakdown?.creditCardFactor ? (results.debtBreakdown.creditCardFactor * 100) : 0}% of the total limit.
              Proposed loan repayments are calculated at the assessment rate of {results.debtBreakdown?.assessmentRate ? results.debtBreakdown.assessmentRate.toFixed(2) : 0}%.
            </p>
          </div>
        </div>
      ))}
      
      {renderSection("serviceability", "Serviceability Analysis", (
        <div className="space-y-2">
          <p>Annual Surplus: {formatCurrency(results.surplus)}</p>
          <p>Monthly Surplus: {formatCurrency(results.surplus / 12)}</p>
          
          <div className="bg-gray-50 p-3 rounded space-y-1 text-sm mt-3">
            <h4 className="font-medium">Monthly Serviceability Calculation:</h4>
            <div className="flex justify-between">
              <span>Monthly Net Income:</span>
              <span>{formatCurrency((results.totalIncome - results.totalExpenses) / 12)}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Expenses:</span>
              <span>-{formatCurrency(results.totalExpenses / 12)}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Debt Commitments:</span>
              <span>-{formatCurrency(results.totalDebt / 12)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1 mt-1">
              <span>Monthly Surplus:</span>
              <span>{formatCurrency(results.surplus / 12)}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            This is the amount left over after accounting for all expenses, tax, and debt commitments.
          </p>
          <div className={`mt-2 p-2 rounded ${results.isServiceable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="font-medium">
              {results.isServiceable 
                ? "✓ The loan is serviceable" 
                : "✗ The loan is not serviceable"}
            </p>
          </div>
        </div>
      ))}
      
      {renderSection("maxLoan", "Maximum Loan Analysis", (
        <div className="space-y-2">
          <p>Maximum Loan Amount: {formatCurrency(results.maxLoan)}</p>
          <p>Maximum Property Value: {formatCurrency(results.maxProperty)}</p>
          <p>Monthly Repayment: {formatCurrency(results.monthlyRepayment)}</p>
          
          <div className="bg-gray-50 p-3 rounded space-y-1 text-sm mt-3">
            <h4 className="font-medium">Maximum Loan Calculation:</h4>
            <div className="flex justify-between">
              <span>Loan Term:</span>
              <span>{loanTerm} years</span>
            </div>
            <div className="flex justify-between">
              <span>Assessment Interest Rate:</span>
              <span>{(results.finalRate + (results.debtBreakdown?.bufferRate || 0)).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Surplus Available:</span>
              <span>{formatCurrency(results.surplus / 12)}</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum Monthly Repayment:</span>
              <span>{formatCurrency(results.monthlyRepayment)}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            This is the maximum loan amount based on your income, expenses, and current interest rates.
          </p>
          
          <div className="mt-2">
            <p className="font-medium">Comparison with Desired Loan:</p>
            <p className={desiredLoanAmount <= results.maxLoan ? "text-green-600" : "text-red-600"}>
              Desired Loan: {formatCurrency(desiredLoanAmount)} 
              ({desiredLoanAmount <= results.maxLoan ? "Approved" : "Exceeds maximum"})
            </p>
          </div>
        </div>
      ))}
      
      {renderSection("lvr", "Loan-to-Value Ratio Analysis", (
        <div className="space-y-2">
          <p>Loan-to-Value Ratio: {results.loanToValueRatio.toFixed(2)}%</p>
          <p>Property Value: {formatCurrency(parseCurrencyFn(propertyValue))}</p>
          
          <div className="bg-gray-50 p-3 rounded space-y-1 text-sm mt-3">
            <h4 className="font-medium">Deposit Breakdown:</h4>
            <div className="flex justify-between">
              <span>Original Savings:</span>
              <span>{formatCurrency(results.originalSavings)}</span>
            </div>
            <div className="flex justify-between">
              <span>Stamp Duty:</span>
              <span>-{formatCurrency(results.stampDuty)}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Charges:</span>
              <span>-{formatCurrency(results.otherCharges)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1 mt-1">
              <span>Available Deposit:</span>
              <span>{formatCurrency(results.deposit)}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded space-y-1 text-sm mt-3">
            <h4 className="font-medium">LVR Calculation:</h4>
            <div className="flex justify-between">
              <span>Loan Amount:</span>
              <span>{formatCurrency(results.maxLoan)}</span>
            </div>
            <div className="flex justify-between">
              <span>Property Value:</span>
              <span>{formatCurrency(parseCurrencyFn(propertyValue))}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1 mt-1">
              <span>LVR (Loan ÷ Value):</span>
              <span>{results.loanToValueRatio.toFixed(2)}%</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            LVR is calculated as the loan amount divided by the property value, expressed as a percentage.
            Your available deposit is your original savings minus stamp duty and other charges.
          </p>
        </div>
      ))}
      
      {renderSection("rateIteration", "Rate Iteration Analysis", (
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-800">
              <strong>Final Result:</strong> After {results.iterations} iterations, the calculation converged 
              to an LVR of {results.loanToValueRatio.toFixed(2)}% with an interest rate of {results.finalRate.toFixed(2)}%.
              The maximum loan amount is calculated over a {loanTerm}-year term.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Base Interest Rate:</h4>
            <p>{parseFloat(interestRate).toFixed(2)}% (before LVR adjustments)</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Iteration Details:</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left">Iteration</th>
                    <th className="px-3 py-2 text-left">LVR (%)</th>
                    <th className="px-3 py-2 text-left">LVR-Based Rate (%)</th>
                    <th className="px-3 py-2 text-left">Assessment Rate (%)</th>
                    <th className="px-3 py-2 text-left">Max Loan</th>
                    <th className="px-3 py-2 text-left">Monthly Repayment</th>
                  </tr>
                </thead>
                <tbody>
                  {results.iterationResults.map((iter) => (
                    <tr key={iter.iteration} className="border-t">
                      <td className="px-3 py-2">{iter.iteration}</td>
                      <td className="px-3 py-2">{iter.lvr.toFixed(2)}%</td>
                      <td className="px-3 py-2">{iter.rate.toFixed(2)}%</td>
                      <td className="px-3 py-2">{(iter.rate + (results.debtBreakdown?.bufferRate || 0)).toFixed(2)}%</td>
                      <td className="px-3 py-2">{formatCurrency(iter.maxLoan)}</td>
                      <td className="px-3 py-2">{formatCurrency(iter.maxLoan * (iter.rate + (results.debtBreakdown?.bufferRate || 0)) / 100 / 12)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              Each iteration recalculates the maximum loan amount based on the adjusted interest rate, which depends on the LVR.
              The process continues until the loan amount and rate stabilize.
              The calculation uses a loan term of {loanTerm} years.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Assessment Rate:</h4>
            <p>{(results.finalRate + (results.debtBreakdown?.bufferRate || 0)).toFixed(2)}% 
              (LVR-based rate + {results.debtBreakdown?.bufferRate ? results.debtBreakdown.bufferRate.toFixed(2) : 0}% buffer)</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">LVR Rate Adjustment Tiers:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>LVR ≤ 50%: 5.50%</div>
              <div>LVR ≤ 60%: 5.60%</div>
              <div>LVR ≤ 70%: 5.70%</div>
              <div>LVR ≤ 80%: 5.80%</div>
              <div>LVR ≤ 85%: 6.50%</div>
              <div>LVR {'>'}85%: 6.80%</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BorrowingPowerCalculationDetails; 