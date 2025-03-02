"use client"

import { useState, useEffect } from "react"
import { Bed, Bath, Car, Maximize, ExternalLink } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { 
  LvrTier, 
  InterestRateType, 
  RepaymentType, 
  FeatureType, 
  LoanPurpose 
} from "@/types/rateTypes"
import { calculatePmt } from "@/utils/calculationUtils"
import { LoanDetailsModal } from "./LoanDetailsModal"
import { calculateEnhancedStampDuty } from '@/utils/calculationUtils'
import { Badge } from '@/components/ui/badge'
import { RadioCard } from '@/components/ui/radio-card'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { calculateLvrTier } from "@/utils/rateUtils"

// Update the type to be more specific
export type PropertyData = {
  bedrooms: number;
  bathrooms: number;
  parking: number;
  landSize: number;
  inspection: string;
  auction: string;
  listingUrl: string;
  valuation: {
    low: string;
    mid: string;
    high: string;
  };
};

export type PropertyDetailsProps = {
  address?: string;
  propertyData?: PropertyData;
  setShowBorrowingPowerModal: (show: boolean) => void;
};

export default function PropertyDetails({
  address = "72 McArthur Road, Ivanhoe VIC 3079",
  propertyData = {
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    landSize: 580,
    inspection: "Sat 2 Mar 11:00am - 11:30am",
    auction: "Sat 16 Mar 1:00pm",
    listingUrl: "https://www.realestate.com.au/property",
    valuation: {
      low: "1.69M",
      mid: "1.96M",
      high: "2.23M",
    },
  },
  setShowBorrowingPowerModal,
}: PropertyDetailsProps) {
  const [activeTab, setActiveTab] = useState("buy")

  // Loan details state
  const [loanAmount, setLoanAmount] = useState(1500000)
  const [loanPurpose, setLoanPurpose] = useState<LoanPurpose>(LoanPurpose.OWNER)
  const [interestRateType, setInterestRateType] = useState<InterestRateType>(InterestRateType.VARIABLE)
  const [repaymentType, setRepaymentType] = useState<RepaymentType>(RepaymentType.PRINCIPAL_AND_INTEREST)
  const [featureType, setFeatureType] = useState<FeatureType>(FeatureType.REDRAW)
  const [interestRate, setInterestRate] = useState(5.99)
  const [comparisonRate, setComparisonRate] = useState(6.20)
  const [fixedPeriod, setFixedPeriod] = useState<number | undefined>(undefined)
  const [interestOnlyPeriod, setInterestOnlyPeriod] = useState<number | undefined>(undefined)
  const [loanTerm, setLoanTerm] = useState(30)
  const [monthlyPayment, setMonthlyPayment] = useState("$8,975")

  // Loan details modal state
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false)

  // Add isInvestor state
  const [isInvestor, setIsInvestor] = useState(false)

  // Add these state variables
  const [propertyState, setPropertyState] = useState("VIC");
  const [isFirstHomeBuyer, setIsFirstHomeBuyer] = useState(false);
  const [stampDuty, setStampDuty] = useState(0);

  // Make sure parseCurrency is defined
  const parseCurrency = (value: string): number => {
    return Number.parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
  };

  // Calculate monthly payment based on current loan details
  const updateMonthlyPayment = () => {
    const monthlyRate = interestRate / 100 / 12
    const termMonths = loanTerm * 12
    
    // For interest only, only calculate interest for the IO period
    if (repaymentType === RepaymentType.INTEREST_ONLY && interestOnlyPeriod) {
      // Interest only payment
      const ioPayment = loanAmount * monthlyRate
      
      // After IO period, calculate P&I payment for remaining term
      const remainingTermMonths = termMonths - (interestOnlyPeriod * 12)
      const piPayment = calculatePmt(loanAmount, interestRate, remainingTermMonths)
      
      setMonthlyPayment(`$${Math.round(ioPayment).toLocaleString()} (IO) → $${Math.round(piPayment).toLocaleString()} (P&I)`)
    } 
    // For fixed rate, show both fixed and variable rates
    else if (interestRateType !== InterestRateType.VARIABLE && fixedPeriod) {
      const fixedPayment = calculatePmt(loanAmount, interestRate, termMonths)
      
      // Assume variable rate is 0.5% higher after fixed period (this is just an example)
      const variableRate = interestRate + 0.5
      const remainingTermMonths = termMonths - (fixedPeriod * 12)
      const variablePayment = calculatePmt(loanAmount, variableRate, remainingTermMonths)
      
      setMonthlyPayment(`$${Math.round(fixedPayment).toLocaleString()} (Fixed) → $${Math.round(variablePayment).toLocaleString()} (Variable)`)
    }
    // Standard P&I calculation
    else {
      const payment = calculatePmt(loanAmount, interestRate, termMonths)
      setMonthlyPayment(`$${Math.round(payment).toLocaleString()}`)
    }
  }
  
  // Update payment when loan details change
  useEffect(() => {
    updateMonthlyPayment()
  }, [loanAmount, interestRate, loanTerm, repaymentType, interestRateType, fixedPeriod, interestOnlyPeriod, updateMonthlyPayment])
  
  // Handle loan details update from modal
  const handleLoanDetailsUpdate = (details: {
    interestRateType: InterestRateType;
    repaymentType: RepaymentType;
    featureType: FeatureType;
    rate: number;
    comparisonRate: number;
    fixedPeriod?: number;
    interestOnlyPeriod?: number;
  }) => {
    setInterestRateType(details.interestRateType)
    setRepaymentType(details.repaymentType)
    setFeatureType(details.featureType)
    setInterestRate(details.rate)
    setComparisonRate(details.comparisonRate)
    setFixedPeriod(details.fixedPeriod)
    setInterestOnlyPeriod(details.interestOnlyPeriod)
  }

  // Update the updateLoanAmount function to use the new stamp duty calculation
  const updateLoanAmount = (propertyValueStr: string, depositStr: string) => {
    const propValue = parseCurrency(propertyValueStr)
    const depositValue = parseCurrency(depositStr)
    
    // Calculate stamp duty using our enhanced function
    const newStampDuty = calculateEnhancedStampDuty(
      propValue,
      propertyState,
      isFirstHomeBuyer,
      isInvestor
    )
    
    setStampDuty(newStampDuty)
    
    // ... rest of the function
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Property Address */}
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{address}</h1>

      {/* Top Section: Image and Details */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Property Image */}
        <div className="aspect-[4/3] overflow-hidden rounded-lg">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-8tgZj2IKhGZmOMqEtl4kCqnqWZFcue.png"
            alt="Property"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details Stack */}
        <div className="space-y-4">
          {/* Property Details */}
          <Card className="p-4">
            <CardTitle className="mb-4">Property Details</CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-gray-500" />
                <span>{propertyData.bedrooms} Bedrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-gray-500" />
                <span>{propertyData.bathrooms} Bathrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-gray-500" />
                <span>{propertyData.parking} Parking</span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="h-5 w-5 text-gray-500" />
                <span>{propertyData.landSize}m² Land</span>
              </div>
            </div>
          </Card>

          {/* Inspection Times */}
          <Card className="p-4">
            <CardTitle className="mb-4">Inspection & Auction</CardTitle>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">Next Inspection</h4>
                <p>{propertyData.inspection}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Auction</h4>
                <p>{propertyData.auction}</p>
              </div>
              <a
                href={propertyData.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[#2a7d7d] hover:underline"
              >
                View on realestate.com.au
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* Property Insights */}
      <Card className="mb-6">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Property Insights</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="rent">Rent</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <h3 className="text-xl text-gray-600 font-normal">Estimated Property Value</h3>
        </CardHeader>
        <CardContent>
          <div className="relative py-8">
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-gray-200" />
            <div className="flex justify-between items-center relative">
              <div className="text-center bg-white px-2">
                <div className="text-2xl font-bold">${propertyData.valuation.low}</div>
                <div className="text-sm text-gray-500">Low</div>
              </div>
              <div className="text-center bg-white px-2">
                <div className="text-4xl font-bold text-[#2a7d7d]">${propertyData.valuation.mid}</div>
                <div className="text-sm text-gray-500">Mid</div>
              </div>
              <div className="text-center bg-white px-2">
                <div className="text-2xl font-bold">${propertyData.valuation.high}</div>
                <div className="text-sm text-gray-500">High</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              This is an estimate provided by PropTrack. This may differ from the listed price for the property.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Affordability Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Affordability</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLoanPurpose(LoanPurpose.OWNER)}
                className={loanPurpose === LoanPurpose.OWNER ? "bg-primary text-white" : ""}
              >
                Owner
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLoanPurpose(LoanPurpose.INVESTOR)}
                className={loanPurpose === LoanPurpose.INVESTOR ? "bg-primary text-white" : ""}
              >
                Investor
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Loan amount</h3>
                <span className="text-lg font-bold">${loanAmount.toLocaleString()}</span>
              </div>
              <Slider
                value={[loanAmount]}
                min={100000}
                max={3000000}
                step={10000}
                onValueChange={(value) => setLoanAmount(value[0])}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>$100k</span>
                <span>$3M</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Loan term</h3>
                <span className="text-lg font-bold">{loanTerm} years</span>
              </div>
              <Slider
                value={[loanTerm]}
                min={1}
                max={30}
                step={1}
                onValueChange={(value) => setLoanTerm(value[0])}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>1 year</span>
                <span>30 years</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">
                {interestRateType === InterestRateType.VARIABLE ? 'Variable rate' : `Fixed rate (${fixedPeriod} year)`}
              </p>
              <p className="text-xl font-bold">{interestRate.toFixed(2)}<span className="text-sm font-normal">% p.a.</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Comparison rate<sup>*</sup></p>
              <p className="text-xl font-bold">{comparisonRate.toFixed(2)}<span className="text-sm font-normal">% p.a.</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">
                {repaymentType === RepaymentType.PRINCIPAL_AND_INTEREST ? 'Repayments (P&I)' : `Repayments (IO ${interestOnlyPeriod}yr)`}
              </p>
              <p className="text-xl font-bold">{monthlyPayment}<span className="text-sm font-normal">/month</span></p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setShowBorrowingPowerModal(true)}>
              Calculate borrowing power
            </Button>
            <Button onClick={() => setShowLoanDetailsModal(true)}>
              Adjust loan details
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Loan Details Modal */}
      <LoanDetailsModal
        isOpen={showLoanDetailsModal}
        onClose={() => setShowLoanDetailsModal(false)}
        loanAmount={loanAmount}
        propertyValue={parseFloat(propertyData.valuation.mid.replace(/[^\d.]/g, ''))}
        loanPurpose={loanPurpose}
        onUpdate={handleLoanDetailsUpdate}
      />
    </div>
  )
} 