// Define more specific types for our rules
type PercentageRule = {
  percentage: number;
  description: string;
};

type AmountRule = {
  amount: number;
  description: string;
};

// Income shading rules
export const INCOME_SHADING_RULES = {
  PRIMARY: {
    percentage: 100,
    description: "Regular employment income"
  },
  SUPPLEMENTARY: {
    percentage: 90,
    description: "Overtime, bonuses, commissions"
  },
  OTHER: {
    percentage: 90,
    description: "Government benefits, dividends"
  },
  RENTAL: {
    percentage: 90,
    description: "Rental property income"
  }
} as const;

// Create a type from the object keys
export type IncomeRuleType = keyof typeof INCOME_SHADING_RULES;

// Debt and expense shading rules
export const DEBT_SHADING_RULES = {
  CREDIT_CARD: {
    percentage: 3.8,
    description: "Percentage of credit card limit considered as monthly commitment"
  } as PercentageRule,
  EXISTING_LOAN: {
    percentage: 100,
    description: "Existing loan repayments"
  } as PercentageRule,
  LIVING_EXPENSE_BASE: {
    amount: 20000,
    description: "Base annual living expense"
  } as AmountRule,
  DEPENDENT_COST: {
    amount: 6000,
    description: "Additional annual cost per dependent"
  } as AmountRule,
  INTEREST_BUFFER: {
    percentage: 2.0,
    description: "Buffer added to interest rate for serviceability assessment"
  } as PercentageRule
} as const;

// Create a type from the object keys
export type DebtRuleType = keyof typeof DEBT_SHADING_RULES;

// Helper function to apply income shading
export const applyIncomeShading = (amount: number, incomeType: IncomeRuleType): number => {
  const rule = INCOME_SHADING_RULES[incomeType];
  return amount * (rule.percentage / 100);
};

// Helper function to get debt shading percentage
export const getDebtShadingPercentage = (debtType: Extract<DebtRuleType, 'CREDIT_CARD' | 'EXISTING_LOAN' | 'INTEREST_BUFFER'>): number => {
  const rule = DEBT_SHADING_RULES[debtType] as PercentageRule;
  return rule.percentage / 100;
};

// Helper function to get expense amount
export const getExpenseAmount = (expenseType: Extract<DebtRuleType, 'LIVING_EXPENSE_BASE' | 'DEPENDENT_COST'>): number => {
  const rule = DEBT_SHADING_RULES[expenseType] as AmountRule;
  return rule.amount;
};

// Helper function to get interest buffer
export const getInterestBuffer = (): number => {
  const rule = DEBT_SHADING_RULES.INTEREST_BUFFER as PercentageRule;
  return rule.percentage;
}; 