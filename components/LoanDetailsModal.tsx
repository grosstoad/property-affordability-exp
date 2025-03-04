"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { RadioCard } from "@/components/ui/radio-card"
import { 
  InterestRateType, 
  RepaymentType, 
  FeatureType, 
  LoanPurpose 
} from "@/types/rateTypes"
import { findBestRate } from "@/utils/newRateRepository"
import { getLvrRangeFromValue, LoanProductType, RepaymentType as NewRepaymentType, BorrowerType } from "@/types/rates"

type LoanDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  loanAmount: number;
  propertyValue: number;
  loanPurpose: LoanPurpose;
  onUpdate: (details: {
    interestRateType: InterestRateType;
    repaymentType: RepaymentType;
    featureType: FeatureType;
    rate: number;
    comparisonRate: number;
    fixedPeriod?: number;
    interestOnlyPeriod?: number;
  }) => void;
}

type StampDutyThreshold = {
  threshold: number;
  rate: number;
  baseAmount?: number;
};

type StampDutyRates = {
  standard: StampDutyThreshold[];
  firstHomeBuyer: {
    exemptionThreshold: number;
    concessionThreshold: number;
    concessionRate?: number;
  };
};

const STAMP_DUTY_RATES: Record<string, StampDutyRates> = {
  NSW: {
    standard: [
      { threshold: 0, rate: 0.0125 },
      { threshold: 100000, rate: 0.02, baseAmount: 1250 },
      { threshold: 300000, rate: 0.035, baseAmount: 5250 },
      { threshold: 1000000, rate: 0.045, baseAmount: 30500 },
      { threshold: 3000000, rate: 0.07, baseAmount: 120500 },
    ],
    firstHomeBuyer: {
      exemptionThreshold: 650000,
      concessionThreshold: 800000,
      concessionRate: 0.5,
    }
  },
  VIC: {
    standard: [
      { threshold: 0, rate: 0.014 },
      { threshold: 130000, rate: 0.024, baseAmount: 1820 },
      { threshold: 440000, rate: 0.05, baseAmount: 9245 },
      { threshold: 960000, rate: 0.055, baseAmount: 35320 },
    ],
    firstHomeBuyer: {
      exemptionThreshold: 600000,
      concessionThreshold: 750000,
      concessionRate: 0.25,
    }
  }
};

export function LoanDetailsModal({ 
  isOpen, 
  onClose, 
  loanAmount, 
  propertyValue, 
  loanPurpose,
  onUpdate 
}: LoanDetailsModalProps) {
  // State for loan details
  const [interestRateType, setInterestRateType] = useState<InterestRateType>(InterestRateType.VARIABLE)
  const [repaymentType, setRepaymentType] = useState<RepaymentType>(RepaymentType.PRINCIPAL_AND_INTEREST)
  const [featureType, setFeatureType] = useState<FeatureType>(FeatureType.REDRAW)
  const [fixedPeriod, setFixedPeriod] = useState<number>(1)
  const [interestOnlyPeriod, setInterestOnlyPeriod] = useState<number>(1)
  
  // Current rates based on selections
  const [currentRate, setCurrentRate] = useState<number>(0)
  const [currentComparisonRate, setCurrentComparisonRate] = useState<number>(0)
  
  // Update rates when selections change
  useEffect(() => {
    // Calculate LVR
    const lvr = (loanAmount / propertyValue) * 100;
    
    // Map old types to new types
    let effectiveInterestRateType = interestRateType;
    if (interestRateType !== InterestRateType.VARIABLE) {
      if (fixedPeriod === 1) effectiveInterestRateType = InterestRateType.FIXED_1_YEAR
      else if (fixedPeriod === 2) effectiveInterestRateType = InterestRateType.FIXED_2_YEAR
      else if (fixedPeriod === 3) effectiveInterestRateType = InterestRateType.FIXED_3_YEAR
    }
    
    // Convert to new rate system types
    const productType: LoanProductType = effectiveInterestRateType === InterestRateType.VARIABLE 
      ? 'variable' 
      : effectiveInterestRateType === InterestRateType.FIXED_1_YEAR 
        ? 'fixed_1' 
        : effectiveInterestRateType === InterestRateType.FIXED_2_YEAR 
          ? 'fixed_2' 
          : 'fixed_3';
    
    const newRepaymentType: NewRepaymentType = repaymentType === RepaymentType.PRINCIPAL_AND_INTEREST 
      ? 'principal_and_interest' 
      : 'interest_only';
    
    const borrowerType: BorrowerType = loanPurpose === LoanPurpose.OWNER 
      ? 'owner_occupier' 
      : 'investor';
    
    const hasOffset = featureType === FeatureType.OFFSET;
    const hasRedraw = featureType === FeatureType.REDRAW;
    
    const bestRate = findBestRate(
      lvr,
      productType,
      newRepaymentType,
      borrowerType,
      loanAmount,
      false, // isFirstHomeBuyer
      hasOffset,
      hasRedraw
    );
    
    if (bestRate) {
      setCurrentRate(bestRate.rate);
      setCurrentComparisonRate(bestRate.comparisonRate);
    } else {
      // Default rates if no match found
      setCurrentRate(5.74);
      setCurrentComparisonRate(5.65);
    }
  }, [loanAmount, propertyValue, interestRateType, repaymentType, featureType, loanPurpose, fixedPeriod])
  
  // Handle save changes
  const handleSaveChanges = () => {
    onUpdate({
      interestRateType,
      repaymentType,
      featureType,
      rate: currentRate,
      comparisonRate: currentComparisonRate,
      fixedPeriod: interestRateType !== InterestRateType.VARIABLE ? fixedPeriod : undefined,
      interestOnlyPeriod: repaymentType === RepaymentType.INTEREST_ONLY ? interestOnlyPeriod : undefined
    })
    onClose()
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Loan Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-base font-medium">Interest rate type</h3>
            <RadioGroup 
              value={interestRateType} 
              onValueChange={(value) => setInterestRateType(value as InterestRateType)} 
              className="grid grid-cols-2 gap-2"
            >
              <RadioCard value={InterestRateType.VARIABLE} checked={interestRateType === InterestRateType.VARIABLE}>
                Variable rate
              </RadioCard>
              <RadioCard value="fixed" checked={interestRateType !== InterestRateType.VARIABLE}>
                Fixed rate
              </RadioCard>
            </RadioGroup>
          </div>

          {interestRateType !== InterestRateType.VARIABLE && (
            <div className="space-y-2">
              <h3 className="text-base font-medium">Fixed rate period</h3>
              <RadioGroup 
                value={fixedPeriod.toString()} 
                onValueChange={(value) => setFixedPeriod(parseInt(value))} 
                className="grid grid-cols-3 gap-2"
              >
                <RadioCard value="1" checked={fixedPeriod === 1}>
                  1 year
                </RadioCard>
                <RadioCard value="2" checked={fixedPeriod === 2}>
                  2 years
                </RadioCard>
                <RadioCard value="3" checked={fixedPeriod === 3}>
                  3 years
                </RadioCard>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-base font-medium">Loan feature</h3>
            <RadioGroup 
              value={featureType} 
              onValueChange={(value) => setFeatureType(value as FeatureType)} 
              className="grid grid-cols-2 gap-2"
            >
              <RadioCard value={FeatureType.REDRAW} checked={featureType === FeatureType.REDRAW}>
                Redraw facility
              </RadioCard>
              <RadioCard value={FeatureType.OFFSET} checked={featureType === FeatureType.OFFSET}>
                Offset account
              </RadioCard>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-medium">Repayment type</h3>
            <RadioGroup 
              value={repaymentType} 
              onValueChange={(value) => setRepaymentType(value as RepaymentType)} 
              className="grid grid-cols-2 gap-2"
            >
              <RadioCard 
                value={RepaymentType.PRINCIPAL_AND_INTEREST} 
                checked={repaymentType === RepaymentType.PRINCIPAL_AND_INTEREST}
              >
                Principal & Interest
              </RadioCard>
              <RadioCard 
                value={RepaymentType.INTEREST_ONLY} 
                checked={repaymentType === RepaymentType.INTEREST_ONLY}
              >
                Interest Only
              </RadioCard>
            </RadioGroup>
          </div>

          {repaymentType === RepaymentType.INTEREST_ONLY && (
            <div className="space-y-2">
              <h3 className="text-base font-medium">Interest only period</h3>
              <RadioGroup 
                value={interestOnlyPeriod.toString()} 
                onValueChange={(value) => setInterestOnlyPeriod(parseInt(value))} 
                className="grid grid-cols-3 gap-2"
              >
                <RadioCard value="1" checked={interestOnlyPeriod === 1}>
                  1 year
                </RadioCard>
                <RadioCard value="2" checked={interestOnlyPeriod === 2}>
                  2 years
                </RadioCard>
                <RadioCard value="5" checked={interestOnlyPeriod === 5}>
                  5 years
                </RadioCard>
              </RadioGroup>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Interest rate:</span>
              <span>{currentRate.toFixed(2)}% p.a.</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium">Comparison rate:</span>
              <span>{currentComparisonRate.toFixed(2)}% p.a.</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 