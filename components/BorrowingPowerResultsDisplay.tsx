import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Settings,
  RefreshCw
} from 'lucide-react';
import { CalculationResult } from '@/utils/calculationUtils';
import { calculatePmt } from '@/utils/calculationUtils';
import { getMortgageChoiceFreedomRate } from '@/utils/rateUtils';

// Utility function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

type BorrowingPowerResultsDisplayProps = {
  results: CalculationResult;
  requiredLoanAmount: number;
  propertyValue: number;
  loanTerm: number;
  onProceed: (selectedAmount: number) => void;
  isCompact?: boolean;
  onViewDetails?: () => void;
  onOpenLoanDetailsModal?: () => void;
  onOpenBorrowingPowerModal?: () => void;
  deposit?: number;
  stampDuty?: number;
  otherCharges?: number;
};

const BorrowingPowerResultsDisplay: React.FC<BorrowingPowerResultsDisplayProps> = ({
  results,
  requiredLoanAmount,
  propertyValue,
  loanTerm,
  onProceed,
  isCompact = false,
  onViewDetails,
  onOpenLoanDetailsModal,
  onOpenBorrowingPowerModal,
  deposit = 0,
  stampDuty = 0,
  otherCharges = 0
}) => {
  // Set initial selected amount to required loan amount if it's less than max, otherwise max
  const initialSelectedAmount = Math.min(requiredLoanAmount, results.maxLoan);
  const [selectedAmount, setSelectedAmount] = useState(initialSelectedAmount);
  const [monthlyRepayment, setMonthlyRepayment] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [showCostsBreakdown, setShowCostsBreakdown] = useState(false);
  
  // Calculate LVR based on selected amount
  const calculateLVR = (loanAmount: number) => {
    return (loanAmount / propertyValue) * 100;
  };

  // Calculate monthly budget breakdown
  const monthlyIncome = results.totalIncome / 12;
  const monthlyExpenses = results.totalExpenses / 12;
  const monthlyDebt = results.totalDebt / 12;
  const monthlyRemaining = monthlyIncome - monthlyExpenses - monthlyRepayment - monthlyDebt;
  
  // Calculate percentages for the stacked bar
  const totalBudget = monthlyIncome;
  const repaymentPercentage = (monthlyRepayment / totalBudget) * 100;
  const expensesPercentage = (monthlyExpenses / totalBudget) * 100;
  const debtPercentage = (monthlyDebt / totalBudget) * 100;
  const remainingPercentage = (monthlyRemaining / totalBudget) * 100;
  
  // Update monthly repayment and interest rate when selected amount changes
  useEffect(() => {
    const lvr = calculateLVR(selectedAmount);
    const rate = getMortgageChoiceFreedomRate(lvr);
    setInterestRate(rate);
    
    // Calculate monthly repayment
    const payment = calculatePmt(selectedAmount, rate, loanTerm * 12);
    setMonthlyRepayment(payment);
  }, [selectedAmount, propertyValue, loanTerm]);
  
  // Determine if the required loan is within the borrowing capacity
  const isWithinCapacity = requiredLoanAmount <= results.maxLoan;
  const capacityDifference = results.maxLoan - requiredLoanAmount;
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setSelectedAmount(value[0]);
  };

  // Calculate updated deposit and costs based on selected amount
  const currentLVR = calculateLVR(selectedAmount);
  const updatedStampDuty = stampDuty * (selectedAmount / requiredLoanAmount);
  const updatedOtherCharges = otherCharges * (selectedAmount / requiredLoanAmount);
  const updatedTotalCosts = updatedStampDuty + updatedOtherCharges;
  const updatedDepositRequired = propertyValue - selectedAmount + updatedTotalCosts;

  // Calculate dynamic property value based on selected loan amount + deposit
  const actualDeposit = deposit - updatedTotalCosts;
  const dynamicPropertyValue = selectedAmount + actualDeposit;

  // Add SVG component for the logo
  const MortgageChoiceLogo = () => (
    <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      width="40" height="40" viewBox="0 0 225 225" enableBackground="new 0 0 225 225" xmlSpace="preserve">
      <path fill="#FEFEFE" opacity="1.000000" stroke="none" 
        d="M1.000000,169.000000 C1.000000,113.043701 1.000000,57.087399 1.000000,1.065549 C75.897728,1.065549 150.795532,1.065549 226.000000,1.065549 C226.000000,56.687187 226.000000,112.374931 225.531998,168.504395 C150.375992,168.964066 75.687996,168.982040 1.000000,169.000000 M96.014473,131.423828 C95.216003,132.436539 94.417526,133.449265 93.387077,134.756195 C92.798782,132.921722 92.378540,131.502869 91.890999,130.107544 C86.098557,113.529526 78.262939,98.309319 63.435631,87.827446 C58.445702,84.299904 53.095173,81.755241 46.700710,82.886803 C40.847397,83.922607 37.094082,89.421021 39.638683,94.679848 C41.304207,98.121948 44.658039,100.934669 47.739029,103.433311 C49.560146,104.910225 52.364700,105.125862 54.655876,106.079590 C71.387306,113.044228 84.198074,123.833389 89.338478,141.987457 C90.068703,144.566376 90.542702,147.217865 91.293640,150.535278 C96.308426,141.744705 102.145012,134.800217 110.957184,131.093781 C124.824913,125.260925 138.256180,127.836632 151.557816,133.378159 C156.430450,135.408142 161.414490,137.357300 166.531570,138.562943 C171.943848,139.838120 177.088333,137.250778 179.417587,133.101044 C182.174149,128.190018 181.806213,121.833023 177.682327,117.859009 C175.022797,115.296127 171.645844,112.973991 168.168030,111.844673 C143.129181,103.714035 114.740494,107.642540 96.014473,131.423828 z"/>
      <path fill="#FF029F" opacity="1.000000" stroke="none" 
        d="M1.000000,169.468658 C75.687996,168.982040 150.375992,168.964066 225.531998,168.973053 C226.000000,187.354233 226.000000,205.708450 225.531342,224.531891 C150.375122,225.000748 75.687561,225.000381 1.000000,225.000000 C1.000000,206.645767 1.000000,188.291550 1.000000,169.468658 z"/>
      <path fill="#046976" opacity="1.000000" stroke="none" 
        d="M96.236618,131.158768 C114.740494,107.642540 143.129181,103.714035 168.168030,111.844673 C171.645844,112.973991 175.022797,115.296127 177.682327,117.859009 C181.806213,121.833023 182.174149,128.190018 179.417587,133.101044 C177.088333,137.250778 171.943848,139.838120 166.531570,138.562943 C161.414490,137.357300 156.430450,135.408142 151.557816,133.378159 C138.256180,127.836632 124.824913,125.260925 110.957184,131.093781 C102.145012,134.800217 96.308426,141.744705 91.293640,150.535278 C90.542702,147.217865 90.068703,144.566376 89.338478,141.987457 C84.198074,123.833389 71.387306,113.044228 54.655876,106.079590 C52.364700,105.125862 49.560146,104.910225 47.739029,103.433311 C44.658039,100.934669 41.304207,98.121948 39.638683,94.679848 C37.094082,89.421021 40.847397,83.922607 46.700710,82.886803 C53.095173,81.755241 58.445702,84.299904 63.435631,87.827446 C78.262939,98.309319 86.098557,113.529526 91.890999,130.107544 C92.378540,131.502869 92.798782,132.921722 93.387077,134.756195 C94.417526,133.449265 95.216003,132.436539 96.236618,131.158768 z"/>
      <path fill="#E4042C" opacity="1.000000" stroke="none" 
        d="M173.956421,77.808640 C178.406647,80.461105 180.889664,83.942345 181.070526,88.897552 C181.318771,95.698341 178.001236,100.604225 171.212097,100.860237 C165.035721,101.093155 158.790436,99.511948 152.576218,98.724815 C146.155441,97.911530 139.732605,96.403641 133.315933,96.431168 C122.975754,96.475517 114.429207,101.294777 107.543083,108.877136 C103.766930,113.035088 100.317337,117.489624 96.443726,122.142891 C95.924698,120.499039 95.399460,119.189163 95.099129,117.829605 C92.100418,104.254631 84.749008,93.515251 73.937775,84.956734 C70.548271,82.273491 67.091278,79.597595 64.115181,76.487686 C59.243702,71.397186 59.068207,64.606682 63.278980,60.916687 C68.254211,56.556778 74.606628,57.291264 79.316994,63.364609 C89.078835,75.951103 94.471977,90.550049 98.070953,105.898598 C98.371704,107.181213 98.648697,108.469391 98.741356,108.882957 C104.860649,102.264427 110.465965,94.480438 117.691902,88.734505 C134.180405,75.623161 153.104919,71.973518 173.956421,77.808640 z"/>
      <path fill="#5CE2E0" opacity="1.000000" stroke="none" 
        d="M121.481453,73.424072 C114.831009,80.272789 108.472702,86.910713 102.500511,93.145538 C101.510719,88.707611 101.044365,82.982307 98.922920,77.955498 C95.731171,70.392578 91.390007,63.313774 87.517960,56.039551 C86.429924,53.995487 84.911270,52.103008 84.223351,49.939648 C82.762321,45.345039 85.351936,40.091423 89.571754,38.306881 C94.214325,36.343563 99.703217,38.151672 101.532364,43.360283 C103.656769,49.409676 104.825836,55.833668 105.972755,62.174080 C106.796173,66.726044 106.902718,71.407684 107.385307,76.641365 C110.092285,73.543533 112.546745,70.562546 115.181023,67.749985 C126.305504,55.872677 138.191589,44.912468 154.495499,40.781361 C159.318832,39.559216 164.690308,39.538738 169.671890,40.132114 C176.836136,40.985470 181.277267,46.482220 180.893448,52.541309 C180.461029,59.367580 175.372986,63.919930 167.761459,64.151299 C159.466431,64.403442 150.973434,63.528133 142.929184,65.054482 C135.624298,66.440529 128.806259,70.392502 121.481453,73.424072 z"/>
    </svg>
  );

  // Render compact version for the card
  if (isCompact) {
    return (
      <div className="space-y-4">
        {/* Decision Component - Compact */}
        <div className={`p-3 rounded-md ${isWithinCapacity ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center gap-2">
            {isWithinCapacity ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            )}
            <div>
              <h3 className="font-bold text-sm">Borrowing Power Assessment</h3>
              <p className="text-xs">
                {isWithinCapacity 
                  ? `You can borrow ${formatCurrency(capacityDifference)} more than needed.` 
                  : `You're ${formatCurrency(Math.abs(capacityDifference))} short of your required amount.`}
              </p>
            </div>
          </div>
        </div>
        
        {/* LVR Display - Compact */}
        <div className="bg-blue-50 p-2 rounded-md flex justify-between items-center">
          <span className="text-sm font-medium">Loan to Value Ratio (LVR)</span>
          <span className="text-sm font-bold">{currentLVR.toFixed(1)}%</span>
        </div>
        
        {/* Monthly Budget Breakdown - Compact */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Your monthly budget</h3>
          <div className="h-4 w-full rounded-full overflow-hidden flex">
            <div 
              className="bg-[#f26522]" 
              style={{ width: `${repaymentPercentage}%` }}
              title={`Repayments: ${formatCurrency(monthlyRepayment)}`}
            ></div>
            <div 
              className="bg-[#0078d7]" 
              style={{ width: `${expensesPercentage}%` }}
              title={`Expenses: ${formatCurrency(monthlyExpenses)}`}
            ></div>
            <div 
              className="bg-[#ff8c00]" 
              style={{ width: `${debtPercentage}%` }}
              title={`Other Debt: ${formatCurrency(monthlyDebt)}`}
            ></div>
            <div 
              className="bg-[#107c6c]" 
              style={{ width: `${remainingPercentage}%` }}
              title={`Remaining: ${formatCurrency(monthlyRemaining)}`}
            ></div>
          </div>
          <div className="flex justify-between text-xs">
            <div>
              <span className="inline-block w-3 h-3 bg-[#f26522] mr-1"></span>
              <span>Repayments</span>
              <div className="font-bold">${Math.round(monthlyRepayment).toLocaleString()}</div>
            </div>
            <div>
              <span className="inline-block w-3 h-3 bg-[#0078d7] mr-1"></span>
              <span>Expenses</span>
              <div className="font-bold">${Math.round(monthlyExpenses).toLocaleString()}</div>
            </div>
            <div>
              <span className="inline-block w-3 h-3 bg-[#107c6c] mr-1"></span>
              <span>Remaining</span>
              <div className="font-bold">${Math.round(monthlyRemaining).toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        {/* Loan Amount Slider - Compact */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Min</span>
            <span className="text-xs text-gray-500">Max</span>
          </div>
          
          <Slider
            defaultValue={[initialSelectedAmount]}
            max={results.maxLoan}
            min={Math.max(results.maxLoan * 0.5, 100000)}
            step={1000}
            onValueChange={handleSliderChange}
            className="my-2"
          />
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Selected Amount</p>
              <p className="text-lg font-bold">{formatCurrency(selectedAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Max Borrowing Power</p>
              <p className="text-lg font-bold">{formatCurrency(results.maxLoan)}</p>
            </div>
          </div>
        </div>
        
        {/* Costs Breakdown Toggle - Compact */}
        <div>
          <button 
            className="w-full flex justify-between items-center p-2 bg-gray-50 rounded-md text-sm"
            onClick={() => setShowCostsBreakdown(!showCostsBreakdown)}
          >
            <span className="font-medium">Deposit & Costs Breakdown</span>
            {showCostsBreakdown ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </button>
          
          {showCostsBreakdown && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Property Value</span>
                <span className="font-medium">{formatCurrency(propertyValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Loan Amount</span>
                <span className="font-medium">{formatCurrency(selectedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Stamp Duty</span>
                <span className="font-medium">{formatCurrency(updatedStampDuty)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Charges</span>
                <span className="font-medium">{formatCurrency(updatedOtherCharges)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="font-medium">Deposit Required</span>
                <span className="font-bold">{formatCurrency(updatedDepositRequired)}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Product & Rate Display - Compact */}
        <div className="bg-white p-3 rounded-md border border-gray-200">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 mr-2 flex-shrink-0">
              <MortgageChoiceLogo />
            </div>
            <div>
              <h3 className="font-bold text-sm">Mortgage Choice Freedom Variable Saver</h3>
              <p className="text-xs text-gray-500">
                {currentLVR.toFixed(1)}% LVR
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-gray-500">Variable rate</p>
              <p className="text-base font-bold">{interestRate.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Comparison</p>
              <p className="text-base font-bold">{(interestRate - 0.09).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Repayments</p>
              <p className="text-base font-bold">${Math.round(monthlyRepayment).toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Compact */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button 
            onClick={() => onProceed(selectedAmount)} 
            className="bg-[#2a7d7d] hover:bg-[#236363] text-sm"
          >
            Proceed with Loan
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            className="text-sm"
            onClick={onViewDetails}
          >
            View Details
          </Button>
          
          <Button 
            variant="outline" 
            className="text-sm"
            onClick={onOpenLoanDetailsModal}
          >
            <Settings className="h-4 w-4 mr-1" />
            Loan Details
          </Button>
          
          <Button 
            variant="outline" 
            className="text-sm"
            onClick={onOpenBorrowingPowerModal}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Update Financials
          </Button>
        </div>
      </div>
    );
  }
  
  // Original full-size version
  return (
    <div className="space-y-6">
      {/* Decision Component */}
      <Card className={`overflow-hidden transition-all duration-300 ${isWithinCapacity ? 'border-green-200' : 'border-yellow-200'}`}>
        <div className={`p-4 ${isWithinCapacity ? 'bg-green-50' : 'bg-yellow-50'}`}>
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
                  ? `Great news! You can borrow ${formatCurrency(capacityDifference)} more than needed.` 
                  : `You're ${formatCurrency(Math.abs(capacityDifference))} short of your required amount.`}
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* LVR Display */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Loan to Value Ratio (LVR)</h3>
            <span className="text-xl font-bold">{currentLVR.toFixed(1)}%</span>
          </div>
          
          <div className="h-2 rounded-full overflow-hidden bg-gray-200 mb-2">
            <div 
              className={`h-full ${currentLVR > 80 ? 'bg-amber-500' : 'bg-[#2a7d7d]'}`}
              style={{ width: `${Math.min(currentLVR, 100)}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            {currentLVR <= 80 
              ? "You have a strong equity position with an LVR below 80%." 
              : "An LVR above 80% may require Lenders Mortgage Insurance (LMI)."}
          </p>
        </CardContent>
      </Card>
      
      {/* Monthly Budget Breakdown */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-4">Your monthly budget</h3>
          
          <div className="h-6 w-full rounded-full overflow-hidden flex mb-4">
            <div 
              className="bg-[#f26522]" 
              style={{ width: `${repaymentPercentage}%` }}
              title={`Repayments: ${formatCurrency(monthlyRepayment)}`}
            ></div>
            <div 
              className="bg-[#0078d7]" 
              style={{ width: `${expensesPercentage}%` }}
              title={`Expenses: ${formatCurrency(monthlyExpenses)}`}
            ></div>
            <div 
              className="bg-[#ff8c00]" 
              style={{ width: `${debtPercentage}%` }}
              title={`Other Debt: ${formatCurrency(monthlyDebt)}`}
            ></div>
            <div 
              className="bg-[#107c6c]" 
              style={{ width: `${remainingPercentage}%` }}
              title={`Remaining: ${formatCurrency(monthlyRemaining)}`}
            ></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center mb-1">
                <span className="inline-block w-4 h-4 bg-[#f26522] mr-2"></span>
                <span className="text-sm">Repayments</span>
              </div>
              <div className="text-2xl font-bold">${Math.round(monthlyRepayment).toLocaleString()}</div>
            </div>
            <div>
              <div className="flex items-center mb-1">
                <span className="inline-block w-4 h-4 bg-[#0078d7] mr-2"></span>
                <span className="text-sm">Expenses</span>
              </div>
              <div className="text-2xl font-bold">${Math.round(monthlyExpenses).toLocaleString()}</div>
            </div>
            <div>
              <div className="flex items-center mb-1">
                <span className="inline-block w-4 h-4 bg-[#107c6c] mr-2"></span>
                <span className="text-sm">Remaining</span>
              </div>
              <div className="text-2xl font-bold">${Math.round(monthlyRemaining).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Loan Amount Slider */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Adjust Your Loan Amount</h3>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Minimum</span>
              <span className="text-sm text-gray-500">Maximum</span>
            </div>
            
            <Slider
              defaultValue={[initialSelectedAmount]}
              max={results.maxLoan}
              min={Math.max(results.maxLoan * 0.5, 100000)} // Set minimum to 50% of max or $100,000
              step={1000}
              onValueChange={handleSliderChange}
              className="my-4"
            />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Selected Loan Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(selectedAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Maximum Borrowing Power</p>
                <p className="text-2xl font-bold">{formatCurrency(results.maxLoan)}</p>
              </div>
            </div>
            
            {requiredLoanAmount > 0 && (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <p className="text-sm">Required Loan Amount</p>
                  <p className="font-medium">{formatCurrency(requiredLoanAmount)}</p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm">Difference</p>
                  <p className={`font-medium ${selectedAmount >= requiredLoanAmount ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedAmount >= requiredLoanAmount ? '+' : ''}{formatCurrency(selectedAmount - requiredLoanAmount)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Deposit & Costs Breakdown */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Deposit & Costs Breakdown</h3>
            <span className="text-sm text-gray-500">Based on selected loan amount</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Property Value</span>
              <span className="font-bold">{formatCurrency(propertyValue)}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Loan Amount</span>
              <span className="font-bold">{formatCurrency(selectedAmount)}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Stamp Duty</span>
              <span className="font-bold">{formatCurrency(updatedStampDuty)}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Other Charges</span>
              <span className="font-bold">{formatCurrency(updatedOtherCharges)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded font-bold">
              <span>Deposit Required</span>
              <span>{formatCurrency(updatedDepositRequired)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Rate Display */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 mr-4">
              <MortgageChoiceLogo />
            </div>
            <div>
              <h3 className="font-bold">Mortgage Choice Freedom Variable Saver</h3>
              <p className="text-sm text-gray-500">
                {currentLVR.toFixed(1)}% loan to value ratio (LVR), borrow up to 90%.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Variable rate</p>
              <p className="text-2xl font-bold">{interestRate.toFixed(2)}% <span className="text-sm">p.a.</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Comparison rate*</p>
              <p className="text-2xl font-bold">{(interestRate - 0.09).toFixed(2)}% <span className="text-sm">p.a.</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Repayments</p>
              <p className="text-2xl font-bold">${Math.round(monthlyRepayment).toLocaleString()}<span className="text-sm">/mth</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Financial Breakdown */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-4">Monthly Financial Breakdown</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                <span>Monthly Income</span>
              </div>
              <span className="font-bold">{formatCurrency(results.totalIncome / 12)}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-red-500 mr-2" />
                <span>Monthly Expenses</span>
              </div>
              <span className="font-bold">-{formatCurrency(results.totalExpenses / 12)}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
                <span>Loan Repayment</span>
              </div>
              <span className="font-bold">-{formatCurrency(monthlyRepayment)}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-orange-500 mr-2" />
                <span>Other Debt Payments</span>
              </div>
              <span className="font-bold">-{formatCurrency(results.totalDebt / 12)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded font-bold">
              <span>Monthly Remaining</span>
              <span className={`${monthlyRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(monthlyRemaining)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline"
            onClick={onOpenLoanDetailsModal}
          >
            <Settings className="h-4 w-4 mr-2" />
            Loan Details
          </Button>
          
          <Button 
            variant="outline"
            onClick={onOpenBorrowingPowerModal}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Financial Information
          </Button>
        </div>
        
        <Button 
          onClick={() => onProceed(selectedAmount)} 
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Get online pre-approval
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        *Comparison rate is calculated on a loan of $150,000 over 25 years. WARNING: This comparison rate is true only for the examples given and may not include all fees and charges. Different terms, fees or other loan amounts might result in a different comparison rate.
      </p>
    </div>
  );
};

export default BorrowingPowerResultsDisplay; 