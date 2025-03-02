import { calculateStampDuty as calculateStampDutyFromUtils } from './stampDutyUtils';
import { LoanPurpose } from '@/types/rateTypes';
import { determineInterestRate } from './rateUtils';
import { 
  INCOME_SHADING_RULES, 
  DEBT_SHADING_RULES,
  applyIncomeShading,
  getDebtShadingPercentage,
  getExpenseAmount,
  getInterestBuffer
} from './shadingRules';

// Types for calculation inputs
export type FinancialInput = {
  amount: number;
  frequency: string;
};

export type BorrowerInfo = {
  primary: FinancialInput;
  supplementary?: FinancialInput;
  other?: FinancialInput;
  rental?: FinancialInput;
};

export type CalculationInput = {
  borrowers: BorrowerInfo[];
  dependents: number;
  expenses: FinancialInput;
  existingDebt?: FinancialInput;
  creditCardLimit?: number;
  interestRate: number;
  loanTerm: number;
  propertyValue: number;
  deposit: number;
  state: string;
  isFirstHomeBuyer: boolean;
  isInvestor: boolean;
  baseRate: number;
};

export type CalculationResult = {
  maxLoan: number;
  maxProperty: number;
  stampDuty: number;
  deposit: number;
  originalSavings: number;
  otherCharges: number;
  loanToValueRatio: number;
  monthlyRepayment: number;
  isServiceable: boolean;
  surplus: number;
  totalIncome: number;
  annualNetIncome: number;
  totalExpenses: number;
  totalDebt: number;
  iterations: number;
  iterationResults: { iteration: number; lvr: number; rate: number; maxLoan: number }[];
  finalRate: number;
  debtBreakdown?: {
    existingDebt: number;
    creditCard: number;
    proposedLoan: number;
    creditCardFactor: number;
    assessmentRate: number;
    bufferRate: number;
  };
};

// Constants
const INTEREST_BUFFER = getInterestBuffer();
const CREDIT_CARD_FACTOR = getDebtShadingPercentage('CREDIT_CARD');
const LIVING_EXPENSE_BASE = getExpenseAmount('LIVING_EXPENSE_BASE');
const DEPENDENT_COST = getExpenseAmount('DEPENDENT_COST');

// Helper functions
export const normalizeToAnnual = (input: FinancialInput): number => {
  const { amount, frequency } = input;
  const multipliers: Record<string, number> = { 
    weekly: 52, 
    fortnightly: 26, 
    monthly: 12, 
    annual: 1 
  };
  return amount * multipliers[frequency];
};

export const normalizeToMonthly = (input: FinancialInput): number => {
  const { amount, frequency } = input;
  const multipliers: Record<string, number> = { 
    weekly: 52/12, 
    fortnightly: 26/12, 
    monthly: 1, 
    annual: 1/12 
  };
  return amount * multipliers[frequency];
};

export const createFinancialInput = (amount: number, frequency: string): FinancialInput => {
  return { amount, frequency };
};

// Calculate tax (simplified Australian tax rates)
export const calculateTax = (annualIncome: number): number => {
  if (annualIncome <= 18200) return 0;
  if (annualIncome <= 45000) return (annualIncome - 18200) * 0.19;
  if (annualIncome <= 120000) return 5092 + (annualIncome - 45000) * 0.325;
  if (annualIncome <= 180000) return 29467 + (annualIncome - 120000) * 0.37;
  return 51667 + (annualIncome - 180000) * 0.45;
};

// Calculate present value (maximum loan)
export const calculatePV = (payment: number, rate: number, nper: number): number => {
  const monthlyRate = rate / 100 / 12;
  console.log('DEBUG_PV_INPUTS:', { payment, rate, nper, monthlyRate });
  const result = payment * (1 - Math.pow(1 + monthlyRate, -nper)) / monthlyRate;
  console.log('DEBUG_PV_RESULT:', result);
  return result;
};

// Calculate payment amount
export const calculatePmt = (principal: number, rate: number, nper: number): number => {
  const monthlyRate = rate / 100 / 12;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -nper));
};

// Simplified stamp duty calculation
export const calculateStampDuty = (
  value: number, 
  state: string, 
  isFirstHomeBuyer: boolean
): number => {
  if (isFirstHomeBuyer) {
    if (state === 'NSW' && value <= 650000) return 0;
    if (state === 'VIC' && value <= 600000) return 0;
    if (state === 'QLD' && value <= 500000) return 0;
  }
  
  const rates: Record<string, number> = {
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

// Calculate government and other charges (simplified)
export const calculateOtherCharges = (propertyValue: number): number => {
  // This is a simplified calculation that includes transfer fees, mortgage registration, etc.
  return 2000 + propertyValue * 0.001; // Base amount plus 0.1% of property value
};

// Process raw inputs from the form to calculation inputs
export const processFormData = (formData: any): CalculationInput => {
  // Process borrowers data
  const borrowers: BorrowerInfo[] = [];
  
  // Process first borrower
  const borrower1 = {
    primary: createFinancialInput(formData.income.borrower1.primary, formData.income.borrower1.primaryFrequency),
    supplementary: createFinancialInput(
      formData.income.borrower1.supplementary, 
      formData.income.borrower1.supplementaryFrequency
    ),
    other: createFinancialInput(
      formData.income.borrower1.other, 
      formData.income.borrower1.otherFrequency
    ),
    rental: createFinancialInput(
      formData.income.borrower1.rental, 
      formData.income.borrower1.rentalFrequency
    )
  };
  borrowers.push(borrower1);
  
  // Process second borrower if exists
  if (formData.borrowers === 2 && formData.income.borrower2) {
    const borrower2 = {
      primary: createFinancialInput(formData.income.borrower2.primary, formData.income.borrower2.primaryFrequency),
      supplementary: createFinancialInput(
        formData.income.borrower2.supplementary, 
        formData.income.borrower2.supplementaryFrequency
      ),
      other: createFinancialInput(
        formData.income.borrower2.other, 
        formData.income.borrower2.otherFrequency
      ),
      rental: createFinancialInput(
        formData.income.borrower2.rental, 
        formData.income.borrower2.rentalFrequency
      )
    };
    borrowers.push(borrower2);
  }
  
  // Process expenses
  const expenses = createFinancialInput(formData.expenses.living, formData.expenses.livingFrequency);
  
  // Process debt
  const existingDebt = createFinancialInput(formData.debt.existing, formData.debt.existingFrequency);
  
  return {
    borrowers,
    dependents: formData.dependents,
    expenses,
    existingDebt,
    creditCardLimit: formData.debt.creditCardLimit,
    interestRate: formData.interestRate,
    loanTerm: formData.loanTerm,
    propertyValue: formData.propertyValue,
    deposit: formData.deposit,
    state: formData.state,
    isFirstHomeBuyer: formData.isFirstHomeBuyer,
    isInvestor: formData.isInvestor,
    baseRate: formData.baseRate
  };
};

// Calculate total income for all borrowers
export const calculateTotalIncome = (borrowers: BorrowerInfo[]): number => {
  return borrowers.reduce((sum, borrower) => {
    // Apply shading rules to each income type
    const primaryIncome = applyIncomeShading(
      normalizeToAnnual(borrower.primary), 
      'PRIMARY'
    );
    
    const supplementaryIncome = borrower.supplementary 
      ? applyIncomeShading(normalizeToAnnual(borrower.supplementary), 'SUPPLEMENTARY')
      : 0;
    
    const otherIncome = borrower.other 
      ? applyIncomeShading(normalizeToAnnual(borrower.other), 'OTHER')
      : 0;
    
    const rentalIncome = borrower.rental 
      ? applyIncomeShading(normalizeToAnnual(borrower.rental), 'RENTAL')
      : 0;
    
    return sum + primaryIncome + supplementaryIncome + otherIncome + rentalIncome;
  }, 0);
};

// Main calculation function
export const calculateBorrowingPower = (input: CalculationInput): CalculationResult => {
  // Calculate income
  const totalAnnualIncome = calculateTotalIncome(input.borrowers);
  const totalTax = input.borrowers.reduce((sum, borrower) => {
    const primaryIncome = applyIncomeShading(
      normalizeToAnnual(borrower.primary), 
      'PRIMARY'
    );
    
    const supplementaryIncome = borrower.supplementary 
      ? applyIncomeShading(normalizeToAnnual(borrower.supplementary), 'SUPPLEMENTARY')
      : 0;
    
    const otherIncome = borrower.other 
      ? applyIncomeShading(normalizeToAnnual(borrower.other), 'OTHER')
      : 0;
    
    const rentalIncome = borrower.rental 
      ? applyIncomeShading(normalizeToAnnual(borrower.rental), 'RENTAL')
      : 0;
    
    const borrowerIncome = primaryIncome + supplementaryIncome + otherIncome + rentalIncome;
    return sum + calculateTax(borrowerIncome);
  }, 0);
  
  const annualNetIncome = totalAnnualIncome - totalTax;
  const monthlyNetIncome = annualNetIncome / 12;
  
  // Calculate expenses - include base living expenses plus dependent costs
  const baseMonthlyExpenses = normalizeToMonthly(input.expenses);
  const dependentCosts = (DEPENDENT_COST * input.dependents) / 12;
  const totalMonthlyExpenses = baseMonthlyExpenses + dependentCosts;
  
  // Calculate debt obligations
  const monthlyDebt = input.existingDebt ? normalizeToMonthly(input.existingDebt) : 0;
  const monthlyCreditCard = (input.creditCardLimit || 0) * CREDIT_CARD_FACTOR;
  
  // Calculate monthly disposable income
  const monthlyDisposable = monthlyNetIncome - totalMonthlyExpenses - monthlyDebt - monthlyCreditCard;
  
  // Calculate initial LVR based on deposit and property value
  const initialLVR = input.deposit > 0 ? 
    (1 - (input.deposit / input.propertyValue)) * 100 : 80;
  
  // Get the LVR-specific interest rate
  // If interestRate is provided in the input, use that instead of calculating from LVR
  const lvrBasedRate = input.interestRate || determineInterestRate(
    initialLVR,
    input.baseRate,
    input.isFirstHomeBuyer,
    input.isInvestor
  );
  
  // Calculate maximum loan using assessment rate (LVR-based rate + buffer)
  const effectiveRate = lvrBasedRate + INTEREST_BUFFER;
  console.log('DEBUG_BORROWING_POWER:', { 
    monthlyNetIncome,
    totalMonthlyExpenses,
    monthlyDebt,
    monthlyCreditCard,
    monthlyDisposable,
    initialLVR,
    lvrBasedRate,
    effectiveRate,
    loanTerm: input.loanTerm
  });
  
  const maxLoan = calculatePV(monthlyDisposable, effectiveRate, input.loanTerm * 12);
  
  // Calculate property value and associated costs
  // We iteratively refine this calculation
  let maxProperty = maxLoan + input.deposit;
  for (let i = 0; i < 5; i++) {
    const stampDuty = calculateStampDutyFromUtils(
      maxProperty, 
      input.state, 
      input.isFirstHomeBuyer,
      input.isInvestor
    );
    const otherCharges = calculateOtherCharges(maxProperty);
    const totalCosts = stampDuty + otherCharges;
    const availableDeposit = input.deposit - totalCosts;
    maxProperty = maxLoan + availableDeposit;
  }
  
  // Final calculations
  const finalStampDuty = calculateStampDutyFromUtils(
    maxProperty, 
    input.state, 
    input.isFirstHomeBuyer,
    input.isInvestor
  );
  const finalOtherCharges = calculateOtherCharges(maxProperty);
  const totalUpfrontCosts = finalStampDuty + finalOtherCharges;
  const finalDeposit = input.deposit - totalUpfrontCosts;
  
  // Log the deposit breakdown for debugging
  console.log('DEBUG_DEPOSIT_BREAKDOWN:', {
    originalSavings: input.deposit,
    stampDuty: finalStampDuty,
    otherCharges: finalOtherCharges,
    totalUpfrontCosts,
    availableDeposit: finalDeposit
  });
  
  // Calculate loan serviceability for property detailed in inputs
  let isServiceable = false;
  let surplus = 0;
  
  // Calculate potential loan amount based on property value and deposit
  const potentialLoan = input.propertyValue - finalDeposit;
  
  // Calculate monthly repayment on potential loan
  const monthlyRepayment = calculatePmt(potentialLoan, effectiveRate, input.loanTerm * 12);
  
  // Check if potential loan is serviceable
  surplus = monthlyDisposable - monthlyRepayment;
  isServiceable = surplus >= 0 && potentialLoan <= maxLoan;
  
  // Calculate loan-to-value ratio
  const loanToValueRatio = (potentialLoan / input.propertyValue) * 100;
  
  // Calculate total debt
  const existingDebtAnnual = input.existingDebt ? normalizeToAnnual(input.existingDebt) : 0;
  const creditCardDebt = (input.creditCardLimit || 0) * CREDIT_CARD_FACTOR * 12; // Annual
  
  // Store the buffer rate for reporting
  const bufferRate = INTEREST_BUFFER;
  
  // Final result
  return {
    maxLoan,
    maxProperty,
    stampDuty: finalStampDuty,
    deposit: finalDeposit,
    originalSavings: input.deposit,
    otherCharges: finalOtherCharges,
    loanToValueRatio,
    monthlyRepayment,
    isServiceable,
    surplus,
    totalIncome: totalAnnualIncome,
    annualNetIncome: annualNetIncome,
    totalExpenses: totalMonthlyExpenses * 12,
    totalDebt: (monthlyDebt + monthlyCreditCard) * 12,
    iterations: 1,
    iterationResults: [{ iteration: 1, lvr: loanToValueRatio, rate: lvrBasedRate, maxLoan: maxLoan }],
    finalRate: lvrBasedRate,
    debtBreakdown: {
      existingDebt: existingDebtAnnual,
      creditCard: creditCardDebt,
      proposedLoan: 0,
      creditCardFactor: CREDIT_CARD_FACTOR,
      assessmentRate: effectiveRate,
      bufferRate: INTEREST_BUFFER
    }
  };
};

// Function to calculate servicability for a specific loan amount
export const calculateLoanServiceability = (
  input: CalculationInput, 
  loanAmount: number
): { isServiceable: boolean; surplus: number; monthlyRepayment: number } => {
  // Calculate income
  const totalAnnualIncome = calculateTotalIncome(input.borrowers);
  const totalTax = input.borrowers.reduce((sum, borrower) => {
    const primaryIncome = applyIncomeShading(
      normalizeToAnnual(borrower.primary), 
      'PRIMARY'
    );
    
    const supplementaryIncome = borrower.supplementary 
      ? applyIncomeShading(normalizeToAnnual(borrower.supplementary), 'SUPPLEMENTARY')
      : 0;
    
    const otherIncome = borrower.other 
      ? applyIncomeShading(normalizeToAnnual(borrower.other), 'OTHER')
      : 0;
    
    const rentalIncome = borrower.rental 
      ? applyIncomeShading(normalizeToAnnual(borrower.rental), 'RENTAL')
      : 0;
    
    const borrowerIncome = primaryIncome + supplementaryIncome + otherIncome + rentalIncome;
    return sum + calculateTax(borrowerIncome);
  }, 0);
  
  const annualNetIncome = totalAnnualIncome - totalTax;
  const monthlyNetIncome = annualNetIncome / 12;
  
  // Calculate expenses with dependents
  const baseMonthlyExpenses = normalizeToMonthly(input.expenses);
  const dependentCosts = (DEPENDENT_COST * input.dependents) / 12;
  const totalMonthlyExpenses = baseMonthlyExpenses + dependentCosts;
  
  // Calculate debt obligations
  const monthlyDebt = input.existingDebt ? normalizeToMonthly(input.existingDebt) : 0;
  const monthlyCreditCard = (input.creditCardLimit || 0) * CREDIT_CARD_FACTOR;
  
  // Calculate monthly disposable income
  const monthlyDisposable = monthlyNetIncome - totalMonthlyExpenses - monthlyDebt - monthlyCreditCard;
  
  // Calculate LVR for the loan amount
  const loanToValueRatio = (loanAmount / input.propertyValue) * 100;
  
  // Get the LVR-specific interest rate
  const lvrBasedRate = determineInterestRate(
    loanToValueRatio,
    input.baseRate,
    input.isFirstHomeBuyer,
    input.isInvestor
  );
  
  // Calculate repayment with buffer
  const effectiveRate = lvrBasedRate + INTEREST_BUFFER;
  const monthlyRepayment = calculatePmt(loanAmount, effectiveRate, input.loanTerm * 12);
  
  console.log('DEBUG_LOAN_SERVICEABILITY:', {
    loanAmount,
    loanToValueRatio,
    lvrBasedRate,
    effectiveRate,
    monthlyRepayment,
    monthlyDisposable
  });
  
  // Check serviceability
  const surplus = monthlyDisposable - monthlyRepayment;
  const isServiceable = surplus >= 0;
  
  return { isServiceable, surplus, monthlyRepayment };
};

// Update the existing function to use our new implementation
export const calculateEnhancedStampDuty = (
  value: number, 
  state: string, 
  isFirstHomeBuyer: boolean,
  isInvestor: boolean = false
): number => {
  return calculateStampDutyFromUtils(value, state, isFirstHomeBuyer, isInvestor);
};

export const calculateBorrowingPowerIterative = (input: CalculationInput): CalculationResult => {
  // Initial values
  let currentLVR = input.deposit > 0 ? 
    (1 - (input.deposit / input.propertyValue)) * 100 : 80;
  
  // Get the initial LVR-specific rate
  let currentRate = determineInterestRate(
    currentLVR,
    input.baseRate,
    input.isFirstHomeBuyer,
    input.isInvestor
  );
  
  let previousMaxLoan = 0;
  let iterations = 0;
  let iterationResults = [];
  const MAX_ITERATIONS = 10;
  
  console.log('DEBUG_ITERATIVE_START:', { 
    initialLVR: currentLVR, 
    initialRate: currentRate,
    deposit: input.deposit,
    propertyValue: input.propertyValue,
    baseRate: input.baseRate,
    isFirstHomeBuyer: input.isFirstHomeBuyer,
    isInvestor: input.isInvestor
  });
  
  let finalResult = null;
  
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    // Calculate with current rate
    const calculationInput = {
      ...input,
      interestRate: currentRate
    };
    
    console.log(`DEBUG_ITERATION_${iterations}_INPUT:`, { 
      currentRate,
      currentLVR
    });
    
    const result = calculateBorrowingPower(calculationInput);
    finalResult = result; // Store the latest result
    
    console.log(`DEBUG_ITERATION_${iterations}_RESULT:`, { 
      maxLoan: result.maxLoan,
      loanToValueRatio: result.loanToValueRatio,
      monthlyDisposable: result.surplus / 12,
      originalSavings: result.originalSavings,
      stampDuty: result.stampDuty,
      otherCharges: result.otherCharges,
      availableDeposit: result.deposit
    });
    
    // Store iteration data for display
    iterationResults.push({
      iteration: iterations,
      lvr: result.loanToValueRatio,
      rate: currentRate,
      maxLoan: result.maxLoan
    });
    
    // Determine new rate based on calculated LVR
    const newRate = determineInterestRate(
      result.loanToValueRatio,
      input.baseRate,
      input.isFirstHomeBuyer,
      input.isInvestor
    );
    
    console.log(`DEBUG_ITERATION_${iterations}_NEW_RATE:`, { 
      newRate,
      lvrChange: Math.abs(result.maxLoan - previousMaxLoan),
      rateChange: Math.abs(newRate - currentRate)
    });
    
    // Check for convergence
    const loanChange = Math.abs(result.maxLoan - previousMaxLoan);
    const rateChange = Math.abs(newRate - currentRate);
    
    if ((loanChange < 1000 && rateChange < 0.01) || iterations === MAX_ITERATIONS) {
      // We've converged or reached max iterations
      // Always use the new rate for the final result to ensure it matches the final LVR
      const finalRate = newRate;
      
      console.log('DEBUG_ITERATIVE_FINAL:', {
        iterations,
        finalRate,
        finalLVR: result.loanToValueRatio,
        finalMaxLoan: result.maxLoan,
        originalSavings: result.originalSavings,
        stampDuty: result.stampDuty,
        otherCharges: result.otherCharges,
        availableDeposit: result.deposit
      });
      
      return {
        ...result,
        iterations,
        iterationResults,
        finalRate // Use the new rate that matches the final LVR
      };
    }
    
    // Update for next iteration
    previousMaxLoan = result.maxLoan;
    currentRate = newRate;
  }
  
  // This should never be reached due to the MAX_ITERATIONS check
  if (finalResult) {
    return {
      ...finalResult,
      iterations,
      iterationResults,
      finalRate: currentRate
    };
  }
  
  return {
    ...input,
    maxLoan: 0,
    maxProperty: 0,
    stampDuty: 0,
    deposit: 0,
    originalSavings: input.deposit || 0,
    otherCharges: 0,
    loanToValueRatio: 0,
    monthlyRepayment: 0,
    isServiceable: false,
    surplus: 0,
    totalIncome: 0,
    annualNetIncome: 0,
    totalExpenses: 0,
    totalDebt: 0,
    iterations: MAX_ITERATIONS,
    iterationResults: [],
    finalRate: 0
  };
}; 