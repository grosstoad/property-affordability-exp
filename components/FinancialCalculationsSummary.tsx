import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CalculationResult } from '@/utils/calculationUtils';
import { formatCurrency } from '@/utils/formatters';

interface FinancialCalculationsSummaryProps {
  results: CalculationResult;
  propertyValue: string;
  parseCurrencyFn: (value: string) => number;
  interestRate: string;
}

const FinancialCalculationsSummary: React.FC<FinancialCalculationsSummaryProps> = ({
  results,
  propertyValue,
  parseCurrencyFn,
  interestRate
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['income', 'maxLoan']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const isSectionExpanded = (section: string) => expandedSections.includes(section);

  // Calculate monthly values
  const monthlyGrossIncome = results.totalIncome / 12;
  const monthlyTax = (results.totalIncome - results.annualNetIncome) / 12;
  const monthlyNetIncome = results.annualNetIncome / 12;
  const monthlyExpenses = results.totalExpenses / 12;
  const monthlyDebt = results.totalDebt / 12;
  
  // Calculate the actual monthly disposable income used for the PV calculation
  // This is what's available for the loan repayment
  // Note: monthlyDebt already includes credit card debt from the backend calculation
  const monthlyDisposable = monthlyNetIncome - monthlyExpenses - monthlyDebt;
  
  // The surplus in the result is what's left after the loan repayment
  const monthlySurplus = results.surplus / 12;
  
  // Use the effective rate from the results for assessment
  const effectiveRate = results.finalRate + (results.debtBreakdown?.bufferRate || 0);
  
  console.log('DEBUG_UI_VALUES:', {
    monthlyGrossIncome,
    monthlyTax,
    monthlyNetIncome,
    monthlyExpenses,
    monthlyDebt,
    monthlyDisposable,
    monthlySurplus,
    maxLoan: results.maxLoan,
    effectiveRate: effectiveRate,
    loanTerm: 30,
    calculatedPV: monthlyDisposable * (1 - Math.pow(1 + (effectiveRate/100/12), -360)) / (effectiveRate/100/12),
    depositBreakdown: {
      originalSavings: results.originalSavings,
      stampDuty: results.stampDuty,
      otherCharges: results.otherCharges,
      totalUpfrontCosts: results.stampDuty + results.otherCharges,
      availableDeposit: results.deposit
    }
  });

  // Loan calculation constants
  const loanTerm = 30; // Default loan term in years
  const assessmentBuffer = results.debtBreakdown?.bufferRate || 2.0;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="bg-emerald-50 p-4 rounded-t-lg">
        <h2 className="text-emerald-700 font-medium">Detailed Calculations</h2>
      </div>
      
      <div className="p-4 bg-blue-50 mb-4">
        <p className="text-sm text-blue-800">
          This detailed breakdown shows how your borrowing power was calculated. Understanding these calculations can help you identify ways to improve your borrowing capacity.
        </p>
      </div>

      {/* Income Calculation */}
      <div className="border-b">
        <div 
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('income')}
        >
          <h3 className="font-medium">1. Income Calculation</h3>
          {isSectionExpanded('income') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {isSectionExpanded('income') && (
          <div className="p-4 pt-0">
            <div className="flex justify-between py-2">
              <span>Total Annual Gross Income:</span>
              <span className="font-medium">{formatCurrency(results.totalIncome)}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-600">
              <span>Monthly Gross Income:</span>
              <span>${monthlyGrossIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Annual Net Income (After Tax):</span>
              <span className="font-medium">{formatCurrency(results.annualNetIncome)}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-600">
              <span>Monthly Net Income (After Tax):</span>
              <span>${monthlyNetIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              This includes primary income, supplementary income, and {results.debtBreakdown?.creditCardFactor ? (results.debtBreakdown.creditCardFactor * 100) : 90}% of any rental income across all borrowers.
            </p>
          </div>
        )}
      </div>

      {/* Expenses Calculation */}
      <div className="border-b">
        <div 
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('expenses')}
        >
          <h3 className="font-medium">2. Expenses Calculation</h3>
          {isSectionExpanded('expenses') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {isSectionExpanded('expenses') && (
          <div className="p-4 pt-0">
            <div className="flex justify-between py-2">
              <span>Living Expenses (Annual):</span>
              <span className="font-medium">{formatCurrency(results.totalExpenses)}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-600">
              <span>Monthly Expenses:</span>
              <span>${monthlyExpenses.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Existing Debt (Annual):</span>
              <span className="font-medium">{formatCurrency(results.totalDebt)}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-600">
              <span>Monthly Debt:</span>
              <span>${monthlyDebt.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Living expenses include a base amount plus additional costs for dependents. Debt includes existing loan repayments and {results.debtBreakdown?.creditCardFactor ? (results.debtBreakdown.creditCardFactor * 100) : 3.8}% of any credit card limits.
            </p>
          </div>
        )}
      </div>

      {/* Serviceability Calculation */}
      <div className="border-b">
        <div 
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('serviceability')}
        >
          <h3 className="font-medium">3. Serviceability Calculation</h3>
          {isSectionExpanded('serviceability') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {isSectionExpanded('serviceability') && (
          <div className="p-4 pt-0">
            <div className="flex justify-between py-2">
              <span>Monthly Net Income (After Tax):</span>
              <span className="font-medium">${monthlyNetIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Monthly Expenses & Debt:</span>
              <span className="font-medium">-${(monthlyExpenses + monthlyDebt).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 pt-3">
              <span>Remaining:</span>
              <span className="font-medium">${monthlyDisposable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Monthly Loan Repayment:</span>
              <span className="font-medium">-${results.monthlyRepayment.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 pt-3">
              <span>Monthly Surplus After Loan:</span>
              <span className="font-medium">${monthlySurplus.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Assessment Rate:</span>
              <span className="font-medium">{effectiveRate.toFixed(2)}%</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              The assessment rate adds a {assessmentBuffer}% buffer to the actual interest rate to ensure you can still make repayments if rates increase.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Note:</strong> Remaining is calculated as Monthly Net Income minus Monthly Expenses and Debt. 
              This is the amount available for loan repayments and is used to determine your maximum borrowing capacity.
            </p>
          </div>
        )}
      </div>

      {/* Maximum Loan Calculation */}
      <div className="border-b">
        <div 
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('maxLoan')}
        >
          <h3 className="font-medium">4. Maximum Loan Calculation</h3>
          {isSectionExpanded('maxLoan') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {isSectionExpanded('maxLoan') && (
          <div className="p-4 pt-0">
            <div className="flex justify-between py-2">
              <span>Maximum Loan Amount:</span>
              <span className="font-medium">{formatCurrency(results.maxLoan)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Your Deposit:</span>
              <span className="font-medium">{formatCurrency(results.deposit)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Maximum Property Value:</span>
              <span className="font-medium">{formatCurrency(results.maxProperty)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Stamp Duty:</span>
              <span className="font-medium">{formatCurrency(results.stampDuty)}</span>
            </div>
            
            {/* Detailed calculation breakdown */}
            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Calculation Formula Details:</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Loan Term:</span>
                  <span className="font-medium">{loanTerm} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Interest Rate:</span>
                  <span className="font-medium">{results.finalRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Assessment Buffer:</span>
                  <span className="font-medium">{assessmentBuffer.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Assessment Rate:</span>
                  <span className="font-medium">{effectiveRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                  <span>Remaining:</span>
                  <span className="font-medium">${monthlyDisposable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maximum Monthly Loan Repayment:</span>
                  <span className="font-medium">${monthlyDisposable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <p className="font-medium">Calculation Formula:</p>
                <p>PV(rate/12, term*12, monthly_payment)</p>
                <p className="mt-1">Where:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>PV = Present Value (maximum loan amount)</li>
                  <li>rate = {effectiveRate.toFixed(2)}% (annual rate)</li>
                  <li>term = {loanTerm} years</li>
                  <li>monthly_payment = ${monthlyDisposable.toLocaleString(undefined, {maximumFractionDigits: 0})}</li>
                </ul>
                <p className="mt-2">
                  <strong>Note:</strong> Your Remaining amount is used as the maximum monthly loan repayment amount. 
                  This ensures that you can comfortably afford the loan repayments based on your current income and expenses.
                </p>
              </div>
            </div>
            
            {/* Iteration details */}
            <div className="mt-4 border-t pt-4">
              <h4 className="font-medium mb-2">Calculation Iterations:</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-1 text-left">Iteration</th>
                      <th className="px-2 py-1 text-left">LVR (%)</th>
                      <th className="px-2 py-1 text-left">Base Rate (%)</th>
                      <th className="px-2 py-1 text-left">Adjusted Rate (%)</th>
                      <th className="px-2 py-1 text-left">Max Loan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.iterationResults.map((iter) => (
                      <tr key={iter.iteration} className="border-t">
                        <td className="px-2 py-1">{iter.iteration}</td>
                        <td className="px-2 py-1">{iter.lvr.toFixed(2)}%</td>
                        <td className="px-2 py-1">{parseFloat(interestRate).toFixed(2)}%</td>
                        <td className="px-2 py-1">{iter.rate.toFixed(2)}%</td>
                        <td className="px-2 py-1">{formatCurrency(iter.maxLoan)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-2">
              The maximum loan is calculated based on your disposable income and ability to service the loan with the added interest rate buffer.
              Multiple iterations may be needed as the LVR affects the interest rate, which in turn affects the maximum loan amount.
            </p>
          </div>
        )}
      </div>

      {/* Loan to Value Ratio */}
      <div>
        <div 
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('lvr')}
        >
          <h3 className="font-medium">5. Loan to Value Ratio (LVR)</h3>
          {isSectionExpanded('lvr') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {isSectionExpanded('lvr') && (
          <div className="p-4 pt-0">
            <div className="flex justify-between py-2">
              <span>Loan Amount:</span>
              <span className="font-medium">{formatCurrency(results.maxLoan)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Property Value:</span>
              <span className="font-medium">{formatCurrency(parseCurrencyFn(propertyValue))}</span>
            </div>
            
            {/* Deposit Breakdown Section */}
            <div className="mt-4 bg-gray-50 p-3 rounded space-y-1 text-sm">
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
              <p className="text-xs text-gray-500 mt-2">
                Your available deposit is your original savings minus stamp duty and other charges.
              </p>
            </div>
            
            <div className="flex justify-between py-2 mt-3">
              <span>Loan to Value Ratio (LVR):</span>
              <span className="font-medium">{results.loanToValueRatio.toFixed(2)}%</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Most lenders require Lenders Mortgage Insurance (LMI) for LVRs above 80%. First home buyers may be eligible for government programs with higher LVRs.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-100 text-blue-800 font-medium">
        <div className="flex justify-between">
          <span>Monthly Net Income:</span>
          <span>${monthlyNetIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>
        <div className="flex justify-between mt-2">
          <span>Remaining:</span>
          <span>${monthlyDisposable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>
        <p className="text-sm mt-3">
          Your Monthly Net Income is your after-tax income. Your Remaining amount is what's left after deducting expenses and existing debt, and determines your maximum loan repayment capacity.
        </p>
      </div>
    </div>
  );
};

export default FinancialCalculationsSummary; 