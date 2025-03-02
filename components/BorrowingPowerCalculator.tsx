import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { calculateBorrowingPowerIterative, CalculationResult } from '@/utils/calculationUtils';
import BorrowingPowerCalculationDetails from './BorrowingPowerCalculationDetails';
import FinancialCalculationsSummary from './FinancialCalculationsSummary';

// Helper function to parse currency input
const parseCurrency = (value: string): number => {
  // Remove currency symbols, commas, and other non-numeric characters
  const numericValue = value.replace(/[^0-9.]/g, '');
  return parseFloat(numericValue) || 0;
};

// Currency input field formatting
const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
  // Remove non-numeric characters and parse
  const rawValue = e.target.value.replace(/[^0-9.]/g, '');
  const numericValue = parseFloat(rawValue);
  
  // Update with string value
  if (!isNaN(numericValue)) {
    setter(numericValue.toString());
  }
};

// Format currency for display
const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseCurrency(value) : value;
  return `$${numValue.toLocaleString('en-US')}`;
};

// Currency input field component
const CurrencyInput = ({ value, onChange }: { 
  value: string, 
  onChange: (value: string) => void 
}) => {
  // Format for display (with $ and commas)
  const formattedValue = formatCurrency(value);
  
  // Handle user input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters and parse
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    const numericValue = parseFloat(rawValue);
    
    // Update with string value (not the formatted string)
    if (!isNaN(numericValue)) {
      onChange(numericValue.toString());
    }
  };
  
  return (
    <div className="relative">
      <input
        type="text"
        value={formattedValue}
        onChange={handleChange}
        className="text-right bg-transparent font-bold text-lg focus:outline-none w-full"
      />
    </div>
  );
};

const BorrowingPowerCalculator: React.FC = () => {
  // State for form inputs
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [existingDebt, setExistingDebt] = useState('');
  const [creditCardLimit, setCreditCardLimit] = useState('');
  const [dependents, setDependents] = useState('0');
  const [interestRate, setInterestRate] = useState('5.5');
  const [loanTerm, setLoanTerm] = useState('30');
  const [propertyValue, setPropertyValue] = useState('');
  const [deposit, setDeposit] = useState('');
  const [state, setState] = useState('NSW');
  const [isFirstHomeBuyer, setIsFirstHomeBuyer] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [activeLender, setActiveLender] = useState('mortgage-choice');
  
  // State for calculation results
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const handleCalculate = () => {
    const calculationInput = {
      borrowers: [
        {
          primary: {
            amount: parseCurrency(income),
            frequency: 'annual'
          }
        }
      ],
      dependents: parseInt(dependents),
      expenses: {
        amount: parseCurrency(expenses),
        frequency: 'annual'
      },
      existingDebt: existingDebt ? {
        amount: parseCurrency(existingDebt),
        frequency: 'annual'
      } : undefined,
      creditCardLimit: parseCurrency(creditCardLimit),
      interestRate: parseFloat(interestRate),
      loanTerm: parseInt(loanTerm),
      propertyValue: parseCurrency(propertyValue),
      deposit: parseCurrency(deposit),
      state,
      isFirstHomeBuyer,
      isInvestor,
      baseRate: parseFloat(interestRate)
    };
    
    const result = calculateBorrowingPowerIterative(calculationInput);
    setCalculationResult(result);
    
    // Calculate and set loan amount based on property value and deposit
    if (propertyValue && deposit) {
      const propValue = parseCurrency(propertyValue);
      const depositValue = parseCurrency(deposit);
      setLoanAmount((propValue - depositValue).toString());
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Borrowing Power Calculator</h1>
      
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="income">
            <TabsList className="mb-4">
              <TabsTrigger value="income">Income & Expenses</TabsTrigger>
              <TabsTrigger value="property">Property Details</TabsTrigger>
              <TabsTrigger value="loan">Loan Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="income">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="income">Annual Income</Label>
                  <CurrencyInput value={income} onChange={setIncome} />
                </div>
                
                <div>
                  <Label htmlFor="expenses">Annual Expenses</Label>
                  <CurrencyInput value={expenses} onChange={setExpenses} />
                </div>
                
                <div>
                  <Label htmlFor="existingDebt">Existing Annual Debt Repayments</Label>
                  <CurrencyInput value={existingDebt} onChange={setExistingDebt} />
                </div>
                
                <div>
                  <Label htmlFor="creditCardLimit">Credit Card Limit</Label>
                  <CurrencyInput value={creditCardLimit} onChange={setCreditCardLimit} />
                </div>
                
                <div>
                  <Label htmlFor="dependents">Number of Dependents</Label>
                  <Input 
                    id="dependents" 
                    type="number" 
                    min="0"
                    value={dependents}
                    onChange={(e) => setDependents(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="property">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="propertyValue">Property Value</Label>
                  <CurrencyInput value={propertyValue} onChange={setPropertyValue} />
                </div>
                
                <div>
                  <Label htmlFor="deposit">Deposit</Label>
                  <CurrencyInput value={deposit} onChange={setDeposit} />
                </div>
                
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NSW">New South Wales</SelectItem>
                      <SelectItem value="VIC">Victoria</SelectItem>
                      <SelectItem value="QLD">Queensland</SelectItem>
                      <SelectItem value="WA">Western Australia</SelectItem>
                      <SelectItem value="SA">South Australia</SelectItem>
                      <SelectItem value="TAS">Tasmania</SelectItem>
                      <SelectItem value="ACT">Australian Capital Territory</SelectItem>
                      <SelectItem value="NT">Northern Territory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="firstHomeBuyer">First Home Buyer</Label>
                  <input 
                    type="checkbox" 
                    id="firstHomeBuyer" 
                    checked={isFirstHomeBuyer}
                    onChange={(e) => setIsFirstHomeBuyer(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="investor">Investment Property</Label>
                  <input 
                    type="checkbox" 
                    id="investor" 
                    checked={isInvestor}
                    onChange={(e) => setIsInvestor(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="loan">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input 
                    id="interestRate" 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="loanTerm">Loan Term (years)</Label>
                  <Input 
                    id="loanTerm" 
                    type="number" 
                    min="1"
                    max="30"
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <Button onClick={handleCalculate} className="w-full">Calculate Borrowing Power</Button>
          </div>
        </CardContent>
      </Card>
      
      {calculationResult && (
        <div className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Your Borrowing Power</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Maximum Loan Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculationResult.maxLoan)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Maximum Property Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculationResult.maxProperty)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Monthly Repayment</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculationResult.monthlyRepayment)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Loan to Value Ratio</p>
                  <p className="text-2xl font-bold">{calculationResult.loanToValueRatio.toFixed(2)}%</p>
                </div>
              </div>
              
              {/* Add deposit breakdown section */}
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h3 className="text-md font-medium mb-2">Deposit Breakdown</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Original Savings</p>
                    <p className="font-medium">{formatCurrency(calculationResult.originalSavings)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Stamp Duty</p>
                    <p className="font-medium">-{formatCurrency(calculationResult.stampDuty)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Other Charges</p>
                    <p className="font-medium">-{formatCurrency(calculationResult.otherCharges)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Available Deposit</p>
                    <p className="font-medium">{formatCurrency(calculationResult.deposit)}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="showDetails" 
                  checked={showDetails}
                  onChange={(e) => setShowDetails(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="showDetails">Show detailed breakdown</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {calculationResult && (
        <div className="mt-8">
          <FinancialCalculationsSummary 
            results={calculationResult}
            propertyValue={propertyValue}
            parseCurrencyFn={parseCurrency}
            interestRate={interestRate}
          />
        </div>
      )}
      
      {calculationResult && showDetails && (
        <div className="mt-8">
          <BorrowingPowerCalculationDetails 
            results={calculationResult}
            desiredLoanAmount={parseCurrency(loanAmount || '0')}
            interestRate={interestRate}
            propertyValue={propertyValue}
            parseCurrencyFn={parseCurrency}
            loanTerm={loanTerm}
          />
        </div>
      )}
      
      <div className="flex space-x-4 mb-4">
        {/* Mortgage Choice Logo */}
        <div className="h-8">
          <svg width="120" height="24" viewBox="0 0 256 48" className="h-full">
            {/* SVG path data from your Mortgage Choice logo */}
          </svg>
        </div>
        
        {/* OwnHome Logo */}
        <div className="h-8">
          <svg width="100" height="24" viewBox="0 0 200 48" className="h-full">
            {/* SVG path data from your OwnHome logo */}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default BorrowingPowerCalculator; 