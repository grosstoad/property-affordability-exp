import React, { useState, useEffect } from 'react';

const BasicLoanCalculator = () => {
  // Core state values
  const [savings, setSavings] = useState(100000);
  const [state, setState] = useState('NSW');
  const [isFirstHomeBuyer, setIsFirstHomeBuyer] = useState(false);
  const [interestRate, setInterestRate] = useState(6.0);
  const [loanTerm, setLoanTerm] = useState(30);
  
  // Income states
  const [income, setIncome] = useState(90000);
  const [incomeFrequency, setIncomeFrequency] = useState('annual');
  
  // Expense states
  const [expenses, setExpenses] = useState(20000);
  const [expenseFrequency, setExpenseFrequency] = useState('annual');
  
  // Debt states
  const [existingDebt, setExistingDebt] = useState(0);
  const [creditCardLimit, setCreditCardLimit] = useState(0);
  
  // Testing modes
  const [calculationMode, setCalculationMode] = useState('maxBorrowing');
  const [testLoanAmount, setTestLoanAmount] = useState(500000);
  
  // Results
  const [results, setResults] = useState({
    maxLoan: 0,
    maxProperty: 0,
    stampDuty: 0,
    deposit: 0,
    monthlyRepayment: 0,
    isServiceable: false,
    surplus: 0
  });
  
  // Constants
  const INTEREST_BUFFER = 2.0; // 2% buffer
  const CREDIT_CARD_FACTOR = 0.038; // 3.8% of limit
  
  // Simplified stamp duty calculation
  const calculateStampDuty = (value) => {
    if (isFirstHomeBuyer) {
      if (state === 'NSW' && value <= 650000) return 0;
      if (state === 'VIC' && value <= 600000) return 0;
      if (state === 'QLD' && value <= 500000) return 0;
    }
    
    // Simplified rates
    const rates = {
      'NSW': 0.04,
      'VIC': 0.05,
      'QLD': 0.035,
      'SA': 0.04,
      'WA': 0.04,
      'TAS': 0.04,
      'NT': 0.035,
      'ACT': 0.045
    };
    
    return value * (rates[state] || 0.04);
  };
  
  // Helper functions
  const normalizeToAnnual = (amount, frequency) => {
    const multipliers = { weekly: 52, fortnightly: 26, monthly: 12, annual: 1 };
    return amount * multipliers[frequency];
  };
  
  const normalizeToMonthly = (amount, frequency) => {
    const multipliers = { weekly: 52/12, fortnightly: 26/12, monthly: 1, annual: 1/12 };
    return amount * multipliers[frequency];
  };
  
  // Calculate tax (simplified)
  const calculateTax = (annualIncome) => {
    if (annualIncome <= 18200) return 0;
    if (annualIncome <= 45000) return (annualIncome - 18200) * 0.19;
    if (annualIncome <= 120000) return 5092 + (annualIncome - 45000) * 0.325;
    if (annualIncome <= 180000) return 29467 + (annualIncome - 120000) * 0.37;
    return 51667 + (annualIncome - 180000) * 0.45;
  };
  
  // Calculate present value (maximum loan)
  const calculatePV = (payment, rate, nper) => {
    const monthlyRate = rate / 100 / 12;
    return payment * (1 - Math.pow(1 + monthlyRate, -nper)) / monthlyRate;
  };
  
  // Calculate payment amount
  const calculatePmt = (principal, rate, nper) => {
    const monthlyRate = rate / 100 / 12;
    return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -nper));
  };
  
  // Main calculation function
  const calculate = () => {
    // Calculate income
    const annualIncome = normalizeToAnnual(income, incomeFrequency);
    const tax = calculateTax(annualIncome);
    const annualNetIncome = annualIncome - tax;
    const monthlyNetIncome = annualNetIncome / 12;
    
    // Calculate expenses
    const monthlyExpenses = normalizeToMonthly(expenses, expenseFrequency);
    const monthlyDebt = normalizeToMonthly(existingDebt, 'monthly');
    const monthlyCreditCard = creditCardLimit * CREDIT_CARD_FACTOR;
    
    // Calculate monthly disposable income
    const monthlyDisposable = monthlyNetIncome - monthlyExpenses - monthlyDebt - monthlyCreditCard;
    
    // Calculate maximum loan
    const effectiveRate = interestRate + INTEREST_BUFFER;
    const maxLoan = calculatePV(monthlyDisposable, effectiveRate, loanTerm * 12);
    
    // Calculate property value
    // Simple version - iterative approach for more accurate calculation
    let maxProperty = maxLoan + savings;
    for (let i = 0; i < 5; i++) {
      const stampDuty = calculateStampDuty(maxProperty);
      const deposit = savings - stampDuty;
      maxProperty = maxLoan + deposit;
    }
    
    const finalStampDuty = calculateStampDuty(maxProperty);
    const finalDeposit = savings - finalStampDuty;
    
    // Test loan serviceability
    let isServiceable = false;
    let surplus = 0;
    let monthlyRepayment = 0;
    
    if (calculationMode === 'testLoan') {
      monthlyRepayment = calculatePmt(testLoanAmount, effectiveRate, loanTerm * 12);
      surplus = monthlyDisposable - monthlyRepayment;
      isServiceable = surplus >= 0;
    } else {
      monthlyRepayment = monthlyDisposable; // Max payment = disposable income
    }
    
    return {
      maxLoan,
      maxProperty,
      stampDuty: finalStampDuty,
      deposit: finalDeposit,
      monthlyRepayment,
      isServiceable,
      surplus
    };
  };
  
  // Handle calculation
  const handleCalculate = () => {
    const result = calculate();
    setResults(result);
  };
  
  useEffect(() => {
    handleCalculate();
  }, []);
  
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4 text-center">Australian Home Loan Calculator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
          
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setCalculationMode('maxBorrowing')}
                className={`px-3 py-1 rounded ${calculationMode === 'maxBorrowing' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Max Borrowing
              </button>
              <button
                onClick={() => setCalculationMode('testLoan')}
                className={`px-3 py-1 rounded ${calculationMode === 'testLoan' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Test Loan
              </button>
            </div>
            
            {calculationMode === 'testLoan' && (
              <div className="mb-2">
                <label className="block text-sm mb-1">Test Loan Amount ($)</label>
                <input
                  type="number"
                  value={testLoanAmount}
                  onChange={(e) => setTestLoanAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Savings ($)</label>
              <input
                type="number"
                value={savings}
                onChange={(e) => setSavings(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">State</label>
              <select 
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="NSW">NSW</option>
                <option value="VIC">VIC</option>
                <option value="QLD">QLD</option>
                <option value="SA">SA</option>
                <option value="WA">WA</option>
                <option value="TAS">TAS</option>
                <option value="NT">NT</option>
                <option value="ACT">ACT</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={isFirstHomeBuyer}
              onChange={(e) => setIsFirstHomeBuyer(e.target.checked)}
              className="mr-2"
            />
            <label>First Home Buyer</label>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Interest Rate (%)</label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full p-2 border rounded"
                step="0.01"
              />
              <div className="text-xs text-gray-500 mt-1">+{INTEREST_BUFFER}% buffer applied</div>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Loan Term (years)</label>
              <input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Income & Expenses</h2>
          
          <div className="mb-4">
            <div className="flex mb-2">
              <div className="w-3/4 pr-2">
                <label className="block text-sm mb-1">Income ($)</label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-1/4">
                <label className="block text-sm mb-1">Frequency</label>
                <select
                  value={incomeFrequency}
                  onChange={(e) => setIncomeFrequency(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex mb-2">
              <div className="w-3/4 pr-2">
                <label className="block text-sm mb-1">Expenses ($)</label>
                <input
                  type="number"
                  value={expenses}
                  onChange={(e) => setExpenses(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="w-1/4">
                <label className="block text-sm mb-1">Frequency</label>
                <select
                  value={expenseFrequency}
                  onChange={(e) => setExpenseFrequency(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Existing Monthly Debt ($)</label>
              <input
                type="number"
                value={existingDebt}
                onChange={(e) => setExistingDebt(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Credit Card Limit ($)</label>
              <input
                type="number"
                value={creditCardLimit}
                onChange={(e) => setCreditCardLimit(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
              <div className="text-xs text-gray-500 mt-1">{CREDIT_CARD_FACTOR * 100}% used in calculations</div>
            </div>
          </div>
          
          <button
            onClick={handleCalculate}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Calculate
          </button>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium text-lg mb-2">Borrowing Power</h3>
              <div className="mb-2">
                <span className="font-medium">Maximum Loan Amount:</span> ${results.maxLoan.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <div className="mb-2">
                <span className="font-medium">Maximum Property Value:</span> ${results.maxProperty.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <div className="mb-2">
                <span className="font-medium">Stamp Duty (${state}):</span> ${results.stampDuty.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <div className="mb-2">
                <span className="font-medium">Available Deposit:</span> ${results.deposit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
          </div>
          
          <div>
            {calculationMode === 'testLoan' ? (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium text-lg mb-2">Loan Serviceability</h3>
                <div className="p-3 rounded mb-2" style={{ backgroundColor: results.isServiceable ? '#d1fae5' : '#fee2e2' }}>
                  <div className="font-medium mb-1">
                    {results.isServiceable ? 'Loan is Serviceable ✅' : 'Loan is Not Serviceable ❌'}
                  </div>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Monthly Repayment:</span> ${results.monthlyRepayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Net Monthly Surplus:</span> ${results.surplus.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium text-lg mb-2">Monthly Repayment</h3>
                <div className="mb-2">
                  <span className="font-medium">Maximum Monthly Repayment:</span> ${results.monthlyRepayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div className="text-sm text-gray-600">
                  This is the maximum monthly amount you can pay based on your income, expenses, and existing debts.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicLoanCalculator;