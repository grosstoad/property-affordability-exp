"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type BorrowingPowerModalProps = {
  isOpen: boolean
  onClose: () => void
  propertyValue: number
  deposit: number
  state: string
  isFirstHomeBuyer: boolean
  onCalculate: (results: any) => void
}

type FormData = {
  income: number;
  expenses: number;
  dependents: number;
  [key: string]: number;
};

const RadioCard = ({
  children,
  checked,
  ...props
}: { children: React.ReactNode; checked?: boolean; value: string }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full p-2 border rounded-lg cursor-pointer transition-all",
        checked ? "border-blue-500 bg-white" : "border-gray-200 bg-white hover:border-gray-300",
      )}
    >
      <RadioGroupItem value={props.value} id={props.value} className="sr-only" />
      <label htmlFor={props.value} className="flex items-center justify-between w-full cursor-pointer">
        <span className="text-sm">{children}</span>
        <div
          className={cn(
            "w-4 h-4 rounded-full border-2 flex items-center justify-center",
            checked ? "border-blue-500" : "border-gray-300",
          )}
        >
          {checked && <div className="w-2 h-2 rounded-full bg-blue-500" />}
        </div>
      </label>
    </div>
  )
}

const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

export function BorrowingPowerModal({ 
  isOpen, 
  onClose, 
  propertyValue, 
  deposit, 
  state = 'VIC',
  isFirstHomeBuyer = false,
  onCalculate 
}: BorrowingPowerModalProps) {
  const [numBorrowers, setNumBorrowers] = useState("1")
  const [numDependents, setNumDependents] = useState("0")
  
  // Income states for borrower 1
  const [income1, setIncome1] = useState(90000)
  const [incomeFrequency1, setIncomeFrequency1] = useState("annual")
  const [supplementaryIncome1, setSupplementaryIncome1] = useState(0)
  const [supplementaryFrequency1, setSupplementaryFrequency1] = useState("annual")
  const [otherIncome1, setOtherIncome1] = useState(0)
  const [otherFrequency1, setOtherFrequency1] = useState("annual")
  const [rentalIncome1, setRentalIncome1] = useState(0)
  const [rentalFrequency1, setRentalFrequency1] = useState("annual")
  
  // Income states for borrower 2
  const [income2, setIncome2] = useState(0)
  const [incomeFrequency2, setIncomeFrequency2] = useState("annual")
  const [supplementaryIncome2, setSupplementaryIncome2] = useState(0)
  const [supplementaryFrequency2, setSupplementaryFrequency2] = useState("annual")
  const [otherIncome2, setOtherIncome2] = useState(0)
  const [otherFrequency2, setOtherFrequency2] = useState("annual")
  const [rentalIncome2, setRentalIncome2] = useState(0)
  const [rentalFrequency2, setRentalFrequency2] = useState("annual")
  
  // Expense states - shared for all borrowers
  const [livingExpenses, setLivingExpenses] = useState(2000)
  const [expenseFrequency, setExpenseFrequency] = useState("monthly")
  
  // Debt states - shared for all borrowers
  const [existingDebt, setExistingDebt] = useState(0)
  const [existingDebtFrequency, setExistingDebtFrequency] = useState("monthly")
  const [creditCardLimit, setCreditCardLimit] = useState(0)
  
  // Add to form state
  const [baseRate, setBaseRate] = useState(5.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      borrowers: numBorrowers === "1" ? 1 : 2,
      dependents: Number(numDependents),
      interestRate: 6.0, // Using default values
      loanTerm: 30, // Using default values
      income: {
        borrower1: {
          primary: income1,
          primaryFrequency: incomeFrequency1,
          supplementary: supplementaryIncome1,
          supplementaryFrequency: supplementaryFrequency1,
          other: otherIncome1,
          otherFrequency: otherFrequency1,
          rental: rentalIncome1,
          rentalFrequency: rentalFrequency1
        },
        borrower2: numBorrowers === "2" ? {
          primary: income2,
          primaryFrequency: incomeFrequency2,
          supplementary: supplementaryIncome2,
          supplementaryFrequency: supplementaryFrequency2,
          other: otherIncome2,
          otherFrequency: otherFrequency2,
          rental: rentalIncome2,
          rentalFrequency: rentalFrequency2
        } : null
      },
      expenses: {
        living: livingExpenses,
        livingFrequency: expenseFrequency
      },
      debt: {
        existing: existingDebt,
        existingFrequency: existingDebtFrequency,
        creditCardLimit
      },
      propertyValue,
      deposit,
      state,
      isFirstHomeBuyer,
      baseRate: baseRate
    };
    
    onCalculate(formData);
    onClose();
  }

  const FrequencySelect = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full h-10">
        <SelectValue placeholder="Frequency" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="weekly">Weekly</SelectItem>
        <SelectItem value="fortnightly">Fortnightly</SelectItem>
        <SelectItem value="monthly">Monthly</SelectItem>
        <SelectItem value="annual">Annual</SelectItem>
      </SelectContent>
    </Select>
  )

  const IncomeInput = ({ 
    label, 
    value, 
    onChange, 
    frequency, 
    onFrequencyChange,
    id
  }: { 
    label: string, 
    value: number, 
    onChange: (value: number) => void, 
    frequency: string, 
    onFrequencyChange: (value: string) => void,
    id: string
  }) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="grid grid-cols-2 gap-2">
          <CurrencyInput
            id={id}
            value={value}
            onChange={onChange}
          />
          <FrequencySelect 
            value={frequency} 
            onChange={onFrequencyChange}
          />
        </div>
      </div>
    );
  };

  const CurrencyInput = ({ 
    id, 
    value, 
    onChange 
  }: { 
    id: string, 
    value: number, 
    onChange: (value: number) => void 
  }) => {
    // Store the input value as a string for display
    const [localValue, setLocalValue] = useState(() => 
      value === 0 ? '' : value.toLocaleString('en-US')
    );
    
    // Only update the local value from props when the value prop changes significantly
    // This prevents re-renders during typing
    useEffect(() => {
      const formattedNewValue = value === 0 ? '' : value.toLocaleString('en-US');
      const currentNumericValue = localValue ? parseInt(localValue.replace(/,/g, ''), 10) : 0;
      
      // Only update if the values are significantly different to avoid cursor jumps
      if (Math.abs(currentNumericValue - value) > 1) {
        setLocalValue(formattedNewValue);
      }
    }, [value]);
    
    // Handle input changes locally without immediately updating parent
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow digits and commas
      const rawInput = e.target.value.replace(/[^0-9]/g, '');
      
      // Format with commas
      if (rawInput) {
        const numericValue = parseInt(rawInput, 10);
        setLocalValue(numericValue.toLocaleString('en-US'));
      } else {
        setLocalValue('');
      }
    };
    
    // Only update parent component when focus is lost
    const handleBlur = () => {
      const numericValue = localValue ? parseInt(localValue.replace(/,/g, ''), 10) : 0;
      onChange(numericValue);
    };

    return (
      <div className="relative">
        <div className="absolute left-3 top-2.5 text-gray-500">
          $
        </div>
        <Input
          id={id}
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="pl-7"
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Borrowing Power Calculator</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Number of borrowers</Label>
              <RadioGroup value={numBorrowers} onValueChange={setNumBorrowers} className="grid grid-cols-2 gap-2">
                <RadioCard value="1" checked={numBorrowers === "1"}>1</RadioCard>
                <RadioCard value="2" checked={numBorrowers === "2"}>2</RadioCard>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>Number of dependents</Label>
              <Select value={numDependents} onValueChange={setNumDependents}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Dependents" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Tabs defaultValue="borrower1" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="borrower1">Borrower 1</TabsTrigger>
              <TabsTrigger value="borrower2" disabled={numBorrowers === "1"}>
                Borrower 2
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="borrower1" className="space-y-4 py-4">
              <IncomeInput
                label="Primary Income"
                value={income1}
                onChange={setIncome1}
                frequency={incomeFrequency1}
                onFrequencyChange={setIncomeFrequency1}
                id="primary-income-1"
              />
              
              <IncomeInput
                label="Supplementary Income"
                value={supplementaryIncome1}
                onChange={setSupplementaryIncome1}
                frequency={supplementaryFrequency1}
                onFrequencyChange={setSupplementaryFrequency1}
                id="supplementary-income-1"
              />
              
              <IncomeInput
                label="Other Income"
                value={otherIncome1}
                onChange={setOtherIncome1}
                frequency={otherFrequency1}
                onFrequencyChange={setOtherFrequency1}
                id="other-income-1"
              />
              
              <IncomeInput
                label="Rental Income"
                value={rentalIncome1}
                onChange={setRentalIncome1}
                frequency={rentalFrequency1}
                onFrequencyChange={setRentalFrequency1}
                id="rental-income-1"
              />
            </TabsContent>
            
            <TabsContent value="borrower2" className="space-y-4 py-4">
              <IncomeInput
                label="Primary Income"
                value={income2}
                onChange={setIncome2}
                frequency={incomeFrequency2}
                onFrequencyChange={setIncomeFrequency2}
                id="primary-income-2"
              />
              
              <IncomeInput
                label="Supplementary Income"
                value={supplementaryIncome2}
                onChange={setSupplementaryIncome2}
                frequency={supplementaryFrequency2}
                onFrequencyChange={setSupplementaryFrequency2}
                id="supplementary-income-2"
              />
              
              <IncomeInput
                label="Other Income"
                value={otherIncome2}
                onChange={setOtherIncome2}
                frequency={otherFrequency2}
                onFrequencyChange={setOtherFrequency2}
                id="other-income-2"
              />
              
              <IncomeInput
                label="Rental Income"
                value={rentalIncome2}
                onChange={setRentalIncome2}
                frequency={rentalFrequency2}
                onFrequencyChange={setRentalFrequency2}
                id="rental-income-2"
              />
            </TabsContent>
          </Tabs>
          
          <div className="space-y-4 pt-2">
            <div className="bg-blue-50 p-3 rounded-md mb-4">
              <h3 className="text-base font-medium">Household Expenses & Liabilities (For All Borrowers)</h3>
              <p className="text-sm text-gray-600">These expenses are considered for your entire household regardless of the number of borrowers.</p>
            </div>
            
            <IncomeInput
              label="Monthly Living Expenses"
              value={livingExpenses}
              onChange={setLivingExpenses}
              frequency={expenseFrequency}
              onFrequencyChange={setExpenseFrequency}
              id="living-expenses"
            />
            
            <IncomeInput
              label="Existing Loan Repayments"
              value={existingDebt}
              onChange={setExistingDebt}
              frequency={existingDebtFrequency}
              onFrequencyChange={setExistingDebtFrequency}
              id="existing-debt"
            />
            
            <div className="space-y-2">
              <Label htmlFor="credit-card-limit">Credit Card Limit</Label>
              <CurrencyInput 
                id="credit-card-limit"
                value={creditCardLimit}
                onChange={setCreditCardLimit}
              />
              <div className="text-xs text-gray-500">3.8% of limit is used in serviceability calculations</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="baseRate">Base Interest Rate (%)</Label>
            <Input
              id="baseRate"
              type="number"
              step="0.01"
              min="1"
              max="15"
              value={baseRate}
              onChange={(e) => setBaseRate(parseFloat(e.target.value))}
            />
            <p className="text-xs text-gray-500">
              This is the standard variable rate before LVR adjustments.
            </p>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleSubmit} className="bg-black hover:bg-gray-800">
              Calculate Borrowing Power
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 