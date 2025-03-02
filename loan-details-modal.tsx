"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

type LoanDetailsModalProps = {
  isOpen: boolean
  onClose: () => void
  loanTerm?: number
  interestRate?: string
  interestRateType?: string
  repaymentType?: string
  featureType?: string
  loanPurpose?: string
  onUpdate?: (values: {
    loanTerm: number
    interestRateType: string
    repaymentType: string
    featureType: string
    loanPurpose: string
  }) => void
}

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

export function LoanDetailsModal({ 
  isOpen, 
  onClose,
  loanTerm: initialLoanTerm = 30,
  interestRateType: initialInterestRateType = "VARIABLE",
  repaymentType: initialRepaymentType = "PRINCIPAL_AND_INTEREST",
  featureType: initialFeatureType = "BASIC",
  loanPurpose: initialLoanPurpose = "OWNER_OCCUPIER",
  onUpdate
}: LoanDetailsModalProps) {
  // Map API values to UI values
  const mapLoanPurposeToUI = (value: string) => value === "OWNER_OCCUPIER" ? "owner-occupier" : "investor";
  const mapInterestRateTypeToUI = (value: string) => {
    if (value === "VARIABLE") return "variable";
    if (value.startsWith("FIXED_")) return "fixed";
    return "variable";
  };
  const mapFeatureTypeToUI = (value: string) => value === "OFFSET" ? "offset" : "redraw";
  const mapRepaymentTypeToUI = (value: string) => value === "PRINCIPAL_AND_INTEREST" ? "principal-and-interest" : "interest-only";
  
  // Map UI values to API values
  const mapLoanPurposeToAPI = (value: string) => value === "owner-occupier" ? "OWNER_OCCUPIER" : "INVESTOR";
  const mapInterestRateTypeToAPI = (value: string, fixedPeriod: string) => {
    if (value === "variable") return "VARIABLE";
    return `FIXED_${fixedPeriod}YR`;
  };
  const mapFeatureTypeToAPI = (value: string) => value === "offset" ? "OFFSET" : "BASIC";
  const mapRepaymentTypeToAPI = (value: string) => value === "principal-and-interest" ? "PRINCIPAL_AND_INTEREST" : "INTEREST_ONLY";

  // Extract fixed period from interest rate type if applicable
  const getFixedPeriodFromType = (type: string): string => {
    if (type.startsWith("FIXED_")) {
      return type.replace("FIXED_", "").replace("YR", "");
    }
    return "1";
  };

  const [loanPurpose, setLoanPurpose] = useState(mapLoanPurposeToUI(initialLoanPurpose))
  const [interestRateType, setInterestRateType] = useState(mapInterestRateTypeToUI(initialInterestRateType))
  const [loanFeatureType, setLoanFeatureType] = useState(mapFeatureTypeToUI(initialFeatureType))
  const [repaymentType, setRepaymentType] = useState(mapRepaymentTypeToUI(initialRepaymentType))
  const [fixedRatePeriod, setFixedRatePeriod] = useState(getFixedPeriodFromType(initialInterestRateType))
  const [interestOnlyPeriod, setInterestOnlyPeriod] = useState("1")
  const [loanTerm, setLoanTerm] = useState(initialLoanTerm)

  const handleApplyChanges = () => {
    if (onUpdate) {
      onUpdate({
        loanTerm,
        interestRateType: mapInterestRateTypeToAPI(interestRateType, fixedRatePeriod),
        repaymentType: mapRepaymentTypeToAPI(repaymentType),
        featureType: mapFeatureTypeToAPI(loanFeatureType),
        loanPurpose: mapLoanPurposeToAPI(loanPurpose)
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Loan Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-base font-medium">Loan Purpose</h3>
            <RadioGroup value={loanPurpose} onValueChange={setLoanPurpose} className="grid grid-cols-2 gap-2">
              <RadioCard value="owner-occupier" checked={loanPurpose === "owner-occupier"}>
                Owner Occupier
              </RadioCard>
              <RadioCard value="investor" checked={loanPurpose === "investor"}>
                Investor
              </RadioCard>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-medium">Interest rate type</h3>
            <RadioGroup value={interestRateType} onValueChange={setInterestRateType} className="grid grid-cols-2 gap-2">
              <RadioCard value="variable" checked={interestRateType === "variable"}>
                Variable rate
              </RadioCard>
              <RadioCard value="fixed" checked={interestRateType === "fixed"}>
                Fixed rate
              </RadioCard>
            </RadioGroup>
          </div>

          {interestRateType === "fixed" && (
            <div className="space-y-2">
              <h3 className="text-base font-medium">Fixed rate period</h3>
              <RadioGroup value={fixedRatePeriod} onValueChange={setFixedRatePeriod} className="grid grid-cols-3 gap-2">
                <RadioCard value="1" checked={fixedRatePeriod === "1"}>
                  1 year
                </RadioCard>
                <RadioCard value="2" checked={fixedRatePeriod === "2"}>
                  2 years
                </RadioCard>
                <RadioCard value="3" checked={fixedRatePeriod === "3"}>
                  3 years
                </RadioCard>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-base font-medium">Loan Feature Type</h3>
            <RadioGroup value={loanFeatureType} onValueChange={setLoanFeatureType} className="grid grid-cols-2 gap-2">
              <RadioCard value="redraw" checked={loanFeatureType === "redraw"}>
                Redraw
              </RadioCard>
              <RadioCard value="offset" checked={loanFeatureType === "offset"}>
                Offset
              </RadioCard>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-medium">Repayment Type</h3>
            <RadioGroup value={repaymentType} onValueChange={setRepaymentType} className="grid grid-cols-2 gap-2">
              <RadioCard value="principal-and-interest" checked={repaymentType === "principal-and-interest"}>
                Principal and Interest
              </RadioCard>
              <RadioCard value="interest-only" checked={repaymentType === "interest-only"}>
                Interest Only
              </RadioCard>
            </RadioGroup>
          </div>

          {repaymentType === "interest-only" && (
            <div className="space-y-2">
              <h3 className="text-base font-medium">Interest Only period</h3>
              <Select value={interestOnlyPeriod} onValueChange={setInterestOnlyPeriod}>
                <SelectTrigger className="w-full h-10 text-sm">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-sm">
                      {year} year{year > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-base font-medium">Loan term</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Loan term</span>
                <span>{loanTerm} years</span>
              </div>
              <Slider
                value={[loanTerm]}
                onValueChange={(value) => setLoanTerm(value[0])}
                min={10}
                max={30}
                step={1}
                className="[&_.slider-thumb]:w-4 [&_.slider-thumb]:h-4 [&_.slider-track]:h-1"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>10</span>
                <span>30</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleApplyChanges} className="bg-black hover:bg-gray-800 text-sm">
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

