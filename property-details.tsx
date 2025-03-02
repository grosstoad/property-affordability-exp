"use client"

import React, { useState, useEffect } from "react"
import { ExternalLink, Bed, Bath, Car, Maximize, DollarSign, Pencil, ChevronDown, ChevronRight, HelpCircle, MapPin, ArrowLeft, Search, X, Home, Heart, Share2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { calculateLvrTier, getRateByConfiguration } from "@/utils/rateUtils"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { 
  LvrTier, 
  InterestRateType, 
  RepaymentType, 
  FeatureType, 
  LoanPurpose 
} from "@/types/rateTypes"
import { Badge } from "@/components/ui/badge"
import { LoanDetailsModal } from "./loan-details-modal"
import { BorrowingPowerModal } from "@/components/BorrowingPowerModal"
import { 
  CalculationResult, 
  processFormData, 
  calculateBorrowingPower 
} from "@/utils/calculationUtils"
import BorrowingPowerCalculationDetailsComponent from "@/components/BorrowingPowerCalculationDetails"

// Define PropertyDetailsProps type
export type PropertyDetailsProps = {
  address?: string;
  propertyData?: {
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
  setShowBorrowingPowerModal: (show: boolean) => void;
};

// Utility function to format currency
const formatCurrency = (value: string) => {
  const number = Number.parseFloat(value.replace(/[^0-9.-]+/g, ""))
  if (isNaN(number)) return "$0"
  return `$${number.toLocaleString("en-US")}`
}

// Utility function to parse currency
const parseCurrency = (value: string): number => {
  return Number.parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0
}

// Get numeric property value for calculations
const getNumericPropertyValue = (value: string): number => {
  return parseCurrency(value);
}

const InputRow = ({
  label,
  value,
  onChange,
  editable = false,
  onClick,
  expanded,
  children,
  expandable = false,
  tooltip,
}: {
  label: string
  value: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  editable?: boolean
  onClick?: () => void
  expanded?: boolean
  children?: React.ReactNode
  expandable?: boolean
  tooltip?: string
}) => {
  const baseClasses = "flex items-center justify-between p-3.5 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-200"
  const editableClasses = editable ? "border border-gray-200 hover:border-[#2a7d7d] cursor-text" : ""
  const expandableClasses = expandable ? "cursor-pointer" : ""

  return (
    <div className="space-y-2">
      <div className={`${baseClasses} ${editableClasses} ${expandableClasses}`} onClick={onClick}>
        <div className="flex items-center gap-2">
          <span className="text-gray-800 font-medium">{label}</span>
          {tooltip && (
            <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" aria-label={tooltip} />
          )}
          {editable && <Pencil className="h-4 w-4 text-gray-400 ml-1" />}
          {expandable && (
            expanded ? 
              <ChevronDown className="h-4 w-4 text-gray-500 ml-1" /> : 
              <ChevronRight className="h-4 w-4 text-gray-500 ml-1" />
          )}
        </div>
        {onChange ? (
          <div className="min-w-[140px]">
            <input
              type="text"
              value={value.startsWith('$') ? value : `$${value}`}
              onChange={onChange}
              className="text-right bg-transparent font-bold text-lg focus:outline-none w-full"
            />
          </div>
        ) : (
          <span className="font-bold text-lg text-[#2a7d7d]">{value.startsWith('$') ? value : `$${value}`}</span>
        )}
      </div>
      {expanded && children}
    </div>
  )
}

const BorrowingPowerDetails = ({ 
  results, 
  desiredLoanAmount,
  interestRate,
  propertyValue,
  parseCurrencyFn,
  loanTerm,
}: { 
  results: CalculationResult; 
  desiredLoanAmount: number;
  interestRate: string;
  propertyValue: string;
  parseCurrencyFn: (value: string) => number;
  loanTerm: string;
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['income', 'expenses', 'serviceability', 'maxLoan', 'lvr']));
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Calculate monthly values
  const monthlyGrossIncome = results.totalIncome / 12;
  const monthlyNetIncome = results.annualNetIncome / 12;
  const monthlyExpenses = results.totalExpenses / 12;
  const monthlyDebt = results.totalDebt / 12;
  
  // Calculate the actual monthly disposable income used for the PV calculation
  const monthlyDisposable = monthlyNetIncome - monthlyExpenses - monthlyDebt;
  
  // The surplus in the result is what's left after the loan repayment
  const monthlySurplus = results.surplus / 12;
  
  // Use the effective rate from the results for assessment
  const effectiveRate = results.finalRate + (results.debtBreakdown?.bufferRate || 0);
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-blue-800">
          This detailed breakdown shows how your borrowing power was calculated. Understanding these 
          calculations can help you identify ways to improve your borrowing capacity.
        </p>
      </div>
      
      {/* Income Calculation Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className={`flex items-center justify-between p-3 ${expandedSections.has('income') ? 'bg-gray-50' : 'bg-white'} cursor-pointer`}
          onClick={() => toggleSection('income')}
        >
          <h3 className="font-medium">1. Income Calculation</h3>
          {expandedSections.has('income') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
        
        {expandedSections.has('income') && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Annual Income:</span>
                <span className="font-medium">{formatCurrency(results.totalIncome)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Monthly Income:</span>
                <span>{formatCurrency(results.totalIncome / 12)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-sm text-gray-600 mb-2">
                  This includes primary income, supplementary income, and 80% of any rental income across all borrowers.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Expenses Calculation Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className={`flex items-center justify-between p-3 ${expandedSections.has('expenses') ? 'bg-gray-50' : 'bg-white'} cursor-pointer`}
          onClick={() => toggleSection('expenses')}
        >
          <h3 className="font-medium">2. Expenses Calculation</h3>
          {expandedSections.has('expenses') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
        
        {expandedSections.has('expenses') && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Living Expenses (Annual):</span>
                <span className="font-medium">{formatCurrency(results.totalExpenses)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Monthly Expenses:</span>
                <span>{formatCurrency(results.totalExpenses / 12)}</span>
              </div>
              <div className="flex justify-between">
                <span>Existing Debt (Annual):</span>
                <span className="font-medium">{formatCurrency(results.totalDebt)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Monthly Debt:</span>
                <span>{formatCurrency(results.totalDebt / 12)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-sm text-gray-600 mb-2">
                  Living expenses include a base amount plus additional costs for dependents. Debt includes existing loan repayments and 3.8% of any credit card limits.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Serviceability Calculation */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className={`flex items-center justify-between p-3 ${expandedSections.has('serviceability') ? 'bg-gray-50' : 'bg-white'} cursor-pointer`}
          onClick={() => toggleSection('serviceability')}
        >
          <h3 className="font-medium">3. Serviceability Calculation</h3>
          {expandedSections.has('serviceability') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
        
        {expandedSections.has('serviceability') && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span>Monthly Net Income:</span>
                <span>${monthlyNetIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Monthly Expenses & Debt:</span>
                <span>-${(monthlyExpenses + monthlyDebt).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200 pt-3">
                <span>Remaining:</span>
                <span>${monthlyDisposable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Monthly Loan Repayment:</span>
                <span>-${results.monthlyRepayment.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200 pt-3">
                <span>Monthly Surplus After Loan:</span>
                <span>${monthlySurplus.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Assessment Rate:</span>
                <span>{effectiveRate.toFixed(2)}%</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                The assessment rate adds a {results.debtBreakdown?.bufferRate || 2.0}% buffer to the actual interest rate to ensure you can still make repayments if rates increase.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Maximum Loan Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className={`flex items-center justify-between p-3 ${expandedSections.has('maxLoan') ? 'bg-gray-50' : 'bg-white'} cursor-pointer`}
          onClick={() => toggleSection('maxLoan')}
        >
          <h3 className="font-medium">4. Maximum Loan Calculation</h3>
          {expandedSections.has('maxLoan') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
        
        {expandedSections.has('maxLoan') && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Maximum Loan Amount:</span>
                <span className="font-medium">{formatCurrency(results.maxLoan)}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Deposit:</span>
                <span className="font-medium">{formatCurrency(results.deposit)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span>Maximum Property Value:</span>
                <span className="font-medium">{formatCurrency(results.maxProperty)}</span>
              </div>
              <div className="flex justify-between">
                <span>Stamp Duty:</span>
                <span className="font-medium">{formatCurrency(results.stampDuty)}</span>
              </div>
              
              {/* Detailed calculation breakdown */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-2">Calculation Details:</h4>
                <div className="bg-white p-3 rounded-md border border-gray-200 space-y-2">
                  <div className="flex justify-between">
                    <span>Loan Term:</span>
                    <span className="font-medium">{loanTerm} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Interest Rate:</span>
                    <span className="font-medium">{parseFloat(interestRate).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assessment Buffer:</span>
                    <span className="font-medium">2.00%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assessment Rate:</span>
                    <span className="font-medium">{effectiveRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                    <span>Remaining:</span>
                    <span>${monthlyDisposable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maximum Monthly Loan Repayment:</span>
                    <span>${monthlyDisposable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Repayment Formula:</span>
                    <span className="font-medium">P&I, {loanTerm} years</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  <strong>Formula:</strong> PV(rate/12, term*12, monthly_payment)
                  <br />- PV = present value (maximum loan amount)
                  <br />- rate = assessment rate ({effectiveRate.toFixed(2)}%)
                  <br />- term = {loanTerm} years
                  <br />- monthly_payment = ${monthlyDisposable.toLocaleString(undefined, {maximumFractionDigits: 0})}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  <strong>Note:</strong> Your Remaining amount is used as the maximum monthly loan repayment amount. 
                  This ensures that you can comfortably afford the loan repayments based on your current income and expenses.
                </p>
              </div>
              
              {/* Iteration details */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-2">Calculation Iterations:</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 text-left">Iteration</th>
                        <th className="px-2 py-1 text-left">LVR (%)</th>
                        <th className="px-2 py-1 text-left">Base Rate (%)</th>
                        <th className="px-2 py-1 text-left">Adjusted Rate (%)</th>
                        <th className="px-2 py-1 text-left">Max Loan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.iterationResults.map((iter) => (
                        <tr key={iter.iteration} className="border-t border-gray-200">
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
                <p className="text-sm text-gray-600 mt-2">
                  Multiple iterations may be needed as the LVR affects the interest rate, which in turn affects the maximum loan amount.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Loan to Value Ratio */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className={`flex items-center justify-between p-3 ${expandedSections.has('lvr') ? 'bg-gray-50' : 'bg-white'} cursor-pointer`}
          onClick={() => toggleSection('lvr')}
        >
          <h3 className="font-medium">5. Loan to Value Ratio (LVR)</h3>
          {expandedSections.has('lvr') ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
        
        {expandedSections.has('lvr') && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Loan Amount:</span>
                <span className="font-medium">{formatCurrency(desiredLoanAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Property Value:</span>
                <span className="font-medium">{formatCurrency(parseCurrencyFn(propertyValue))}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span>Loan to Value Ratio (LVR):</span>
                <span className="font-medium">{results.loanToValueRatio.toFixed(2)}%</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-sm text-gray-600 mb-2">
                  Most lenders require Lenders Mortgage Insurance (LMI) for LVRs above 80%. First home buyers may be eligible for government programs with higher LVRs.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  const [calculatorType, setCalculatorType] = useState("live-in")
  const [propertyValue, setPropertyValue] = useState("1,960,000")
  const [deposit, setDeposit] = useState("800,000")
  const [isUpfrontCostsExpanded, setIsUpfrontCostsExpanded] = useState(false)
  const [isLoanDetailsModalOpen, setIsLoanDetailsModalOpen] = useState(false)
  const [isBorrowingPowerModalOpen, setIsBorrowingPowerModalOpen] = useState(false)
  const [borrowingPowerResults, setBorrowingPowerResults] = useState<CalculationResult | null>(null)
  const [loanAmount, setLoanAmount] = useState(0)
  const [stampDuty, setStampDuty] = useState(0)
  const [otherCharges, setOtherCharges] = useState(0)
  const [upfrontCosts, setUpfrontCosts] = useState(0)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [loanTerm, setLoanTerm] = useState("30")
  const [interestRate, setInterestRate] = useState("5.74")
  const [monthlyPayment, setMonthlyPayment] = useState("$1,997")
  const [comparisonRate, setComparisonRate] = useState("5.65")
  const [isFirstHomeBuyer, setIsFirstHomeBuyer] = useState(false)
  const [propertyState, setPropertyState] = useState("VIC")
  const [interestRateType, setInterestRateType] = useState("VARIABLE")
  const [repaymentType, setRepaymentType] = useState("PRINCIPAL_AND_INTEREST")
  const [featureType, setFeatureType] = useState("BASIC")
  const [loanPurpose, setLoanPurpose] = useState("OWNER_OCCUPIER")

  // Add state for search functionality
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "3 bedroom house in Richmond",
    "Apartments in Melbourne CBD",
    "Properties in Ivanhoe"
  ]);
  const [suggestedProperties, setSuggestedProperties] = useState<{address: string; price: string}[]>([
    { address: "15 Smith Street, Richmond VIC 3121", price: "$1.2M-$1.3M" },
    { address: "42 Park Avenue, South Yarra VIC 3141", price: "$2.1M-$2.3M" },
    { address: "8/101 Collins Street, Melbourne VIC 3000", price: "$850K-$920K" }
  ]);

  // Add state for favorites
  const [isFavorite, setIsFavorite] = useState(false);

  // Add similar properties data
  const [similarProperties, setSimilarProperties] = useState([
    {
      id: 1,
      address: "68 McArthur Road, Ivanhoe VIC 3079",
      price: "$1.85M-$2.03M",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-8tgZj2IKhGZmOMqEtl4kCqnqWZFcue.png",
      bedrooms: 4,
      bathrooms: 2,
      parking: 2,
      landSize: 550
    },
    {
      id: 2,
      address: "12 Kenilworth Parade, Ivanhoe VIC 3079",
      price: "$2.1M-$2.3M",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-8tgZj2IKhGZmOMqEtl4kCqnqWZFcue.png",
      bedrooms: 5,
      bathrooms: 3,
      parking: 2,
      landSize: 620
    },
    {
      id: 3,
      address: "45 Livingstone Street, Ivanhoe VIC 3079",
      price: "$1.75M-$1.92M",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-8tgZj2IKhGZmOMqEtl4kCqnqWZFcue.png",
      bedrooms: 3,
      bathrooms: 2,
      parking: 1,
      landSize: 520
    }
  ]);

  const handlePropertyValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove dollar sign and allow only numbers and commas
    const value = e.target.value.replace(/^\$/, '').replace(/[^0-9,]/g, "")
    
    // Format with commas for thousands
    const formattedValue = value.replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    
    setPropertyValue(formattedValue)
    updateLoanAmount(formattedValue, deposit)
  }

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove dollar sign and allow only numbers and commas
    const value = e.target.value.replace(/^\$/, '').replace(/[^0-9,]/g, "")
    
    // Format with commas for thousands
    const formattedValue = value.replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    
    setDeposit(formattedValue)
    updateLoanAmount(propertyValue, formattedValue)
  }

  const updateLoanAmount = (propertyValueStr: string, depositStr: string) => {
    const propValue = parseCurrency(propertyValueStr)
    const depositValue = parseCurrency(depositStr)
    
    // Calculate stamp duty based on property value and first home buyer status
    let newStampDuty = 0;
    
    if (isFirstHomeBuyer) {
      // First home buyer concessions (simplified for demonstration)
      if (propValue <= 600000) {
        // Full exemption in some states
        newStampDuty = 0;
      } else if (propValue <= 750000) {
        // Partial concession in some states
        newStampDuty = propValue * 0.025;
      } else {
        // Standard rate with slight discount
        newStampDuty = propValue * (propertyState === "VIC" ? 0.045 : 0.035);
      }
    } else {
      // Standard stamp duty rates (simplified)
      newStampDuty = propValue * (propertyState === "VIC" ? 0.055 : 0.04);
    }
    
    setStampDuty(newStampDuty)
    
    // Calculate other charges
    const newOtherCharges = 2000 + propValue * 0.001
    setOtherCharges(newOtherCharges)
    
    // Total upfront costs
    const newUpfrontCosts = newStampDuty + newOtherCharges
    setUpfrontCosts(newUpfrontCosts)
    
    // Calculate actual deposit available for the loan (total savings minus upfront costs)
    const depositForLoan = depositValue - newUpfrontCosts
    
    // Calculate loan amount using the deposit available for the loan
    const newLoanAmount = propValue - depositForLoan
    setLoanAmount(newLoanAmount)
    
    // Calculate monthly payment (simplified)
    const monthlyRate = parseFloat(interestRate) / 100 / 12
    const termMonths = parseInt(loanTerm) * 12
    const monthlyPaymentValue = (newLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
(Math.pow(1 + monthlyRate, termMonths) - 1)
    setMonthlyPayment(`$${Math.round(monthlyPaymentValue).toLocaleString()}`)
  }

  // Handle borrowing power calculation
  const handleBorrowingPowerCalculate = (formData: any) => {
    console.log("Borrowing Power Form Data:", formData)
    
    // Process form data
    const calculationInput = processFormData(formData)
    
    // Calculate borrowing power
    const results = calculateBorrowingPower(calculationInput)
    
    // Log results for debugging
    console.log("Borrowing Power Results:", results)
    
    // Update state with results
    setBorrowingPowerResults(results)
  }
  
  // Calculate loan amount on component mount
  useEffect(() => {
    // Extract state from address (assuming format like "... VIC 3079")
    const addressParts = address.split(" ");
    const extractedState = addressParts[addressParts.length - 2] || "VIC";
    setPropertyState(extractedState);
    
    // Initialize loan amount on component mount
    updateLoanAmount(propertyValue, deposit);
  }, [address, propertyValue, deposit]);

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  const formatValueRange = (value: string) => {
    return value.replace(/\.\d+/, "")
  }

  // Inside the component, add a function to determine LVR
  const calculateLVR = () => {
    return Math.round((loanAmount / parseCurrency(propertyValue)) * 100);
  };

  // Add a function to calculate monthly repayments
  const calculateMonthlyRepayment = (principal: number, rate: number, years: number) => {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = years * 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  // Handle loan details update from modal
  const handleLoanDetailsUpdate = (values: {
    loanTerm: number;
    interestRateType: string;
    repaymentType: string;
    featureType: string;
    loanPurpose: string;
  }) => {
    setLoanTerm(values.loanTerm.toString());
    setInterestRateType(values.interestRateType);
    setRepaymentType(values.repaymentType);
    setFeatureType(values.featureType);
    setLoanPurpose(values.loanPurpose);
    
    // Update loan amount with new settings
    updateLoanAmount(propertyValue, deposit);
  };

  // Add SVG components for the logos
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

  const OwnHomeLogo = () => (
    <svg width="40" height="40" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#FFFFFF" opacity="1.000000" stroke="none" d="M405.000000,601.000000 C270.000000,601.000000 135.500000,601.000000 1.000000,601.000000 C1.000000,401.000000 1.000000,201.000000 1.000000,1.000000 C201.000000,1.000000 401.000000,1.000000 601.000000,1.000000 C601.000000,201.000000 601.000000,401.000000 601.000000,601.000000 C535.833313,601.000000 470.666656,601.000000 405.000000,601.000000 M289.524353,104.310287 C277.483398,106.745125 265.147278,108.211632 253.450760,111.776581 C191.218506,130.744141 146.978638,170.479095 120.491249,229.722763 C107.375381,259.058685 102.204926,290.101196 103.878517,322.206207 C104.089104,326.245911 103.407036,327.984894 98.803589,328.462677 C85.175400,329.877197 76.329254,345.246185 81.320602,358.047943 C85.385071,368.472382 93.485077,373.281464 106.918396,372.763763 C110.754829,372.615967 112.812416,373.342682 114.189224,377.417328 C131.732132,429.334930 164.395187,468.824493 212.437927,495.269409 C216.636963,497.580750 222.454376,498.692841 227.166412,497.990204 C239.151276,496.203064 246.023224,487.079712 246.047012,474.716125 C246.098953,447.719482 246.206116,420.721222 245.930832,393.727295 C245.884064,389.140961 247.473785,386.908142 251.287979,384.907684 C269.260254,375.481934 287.199615,365.983765 304.942871,356.136902 C310.389343,353.114349 314.944244,353.132477 320.334473,356.122589 C338.366669,366.125610 356.535950,375.886292 374.781677,385.494995 C378.078217,387.231049 379.189941,389.199493 379.171173,392.838226 C379.031006,420.000885 379.808929,447.190369 378.829254,474.318359 C378.235107,490.771973 396.429169,505.482056 413.683380,495.170532 C428.032135,486.595398 441.934875,477.499481 454.013733,465.972382 C502.547882,419.655304 525.231018,363.042999 520.873901,295.906952 C518.890869,265.352631 510.177429,236.649536 494.978424,210.183670 C464.201233,156.591705 418.611481,122.372673 358.376038,108.092873 C336.003296,102.789047 313.298248,101.471115 289.524353,104.310287 z"/>
      <path fill="#FE2C42" opacity="1.000000" stroke="none" d="M289.968445,104.241508 C313.298248,101.471115 336.003296,102.789047 358.376038,108.092873 C418.611481,122.372673 464.201233,156.591705 494.978424,210.183670 C510.177429,236.649536 518.890869,265.352631 520.873901,295.906952 C525.231018,363.042999 502.547882,419.655304 454.013733,465.972382 C441.934875,477.499481 428.032135,486.595398 413.683380,495.170532 C396.429169,505.482056 378.235107,490.771973 378.829254,474.318359 C379.808929,447.190369 379.031006,420.000885 379.171173,392.838226 C379.189941,389.199493 378.078217,387.231049 374.781677,385.494995 C356.535950,375.886292 338.366669,366.125610 320.334473,356.122589 C314.944244,353.132477 310.389343,353.114349 304.942871,356.136902 C287.199615,365.983765 269.260254,375.481934 251.287979,384.907684 C247.473785,386.908142 245.884064,389.140961 245.930832,393.727295 C246.206116,420.721222 246.098953,447.719482 246.047012,474.716125 C246.023224,487.079712 239.151276,496.203064 227.166412,497.990204 C222.454376,498.692841 216.636963,497.580750 212.437927,495.269409 C164.395187,468.824493 131.732132,429.334930 114.189224,377.417328 C112.812416,373.342682 110.754829,372.615967 106.918396,372.763763 C93.485077,373.281464 85.385071,368.472382 81.320602,358.047943 C76.329254,345.246185 85.175400,329.877197 98.803589,328.462677 C103.407036,327.984894 104.089104,326.245911 103.878517,322.206207 C102.204926,290.101196 107.375381,259.058685 120.491249,229.722763 C146.978638,170.479095 191.218506,130.744141 253.450760,111.776581 C265.147278,108.211632 277.483398,106.745125 289.968445,104.241508 M384.086273,164.320908 C320.502472,136.177536 260.712341,142.788727 206.914368,186.810776 C165.483521,220.713013 147.329544,266.198273 148.282333,320.449249 C151.042923,319.726807 152.846466,319.502350 154.438736,318.799347 C168.556320,312.566254 182.599686,306.163788 196.751526,300.010437 C200.680283,298.302155 201.769318,295.823242 201.830490,291.584839 C202.118393,271.631378 200.406372,251.521927 204.892868,231.822250 C209.354385,212.232132 218.301208,195.797485 237.531830,186.624741 C262.097076,174.907516 292.579773,185.059631 304.516479,209.458130 C313.862732,228.561874 311.159027,247.471985 302.134430,265.697876 C291.041168,288.101440 273.022858,304.316193 252.864136,318.372284 C245.921753,323.213013 244.417816,327.447021 247.125458,336.033478 C247.877472,335.719391 248.638000,335.471527 249.333176,335.101044 C262.251740,328.216492 275.050354,321.096222 288.103333,314.477386 C304.305664,306.261627 320.891022,306.059570 337.006897,314.480194 C362.353271,327.723816 387.504364,341.346191 412.603790,355.054260 C420.389740,359.306610 423.999939,366.494781 424.029907,375.342285 C424.086853,392.175140 424.041473,409.008270 424.059814,425.841309 C424.061615,427.508453 424.210449,429.175507 424.321808,431.478180 C502.767487,361.175598 495.208893,220.515762 384.086273,164.320908 M190.060120,421.429169 C193.423325,424.777100 196.786514,428.125000 201.148468,432.467163 C201.148468,403.670715 201.148468,376.430969 201.148468,348.581177 C199.251770,349.290344 197.896210,349.784912 196.549576,350.302643 C185.714066,354.468567 174.943680,358.815308 164.023041,362.744446 C157.005280,365.269318 156.929352,364.985718 159.817108,372.241974 C166.951889,390.169891 176.949036,406.338898 190.060120,421.429169 M246.866776,263.222290 C247.454132,263.344666 248.344696,263.778381 248.584991,263.544373 C257.067444,255.283401 264.098633,246.068802 265.226990,233.831436 C265.425690,231.676758 263.206543,227.684677 261.539703,227.349792 C259.022003,226.843948 255.256134,228.057205 253.401001,229.916824 C251.221344,232.101715 249.817261,235.646790 249.312012,238.799911 C248.055527,246.641541 247.500397,254.595551 246.866776,263.222290 z"/>
      {/* Additional SVG paths */}
    </svg>
  );

  useEffect(() => {
    const lvrTier = calculateLvrTier(calculateLVR())
    const rateInfo = getRateByConfiguration(
      lvrTier,
      interestRateType,
      repaymentType,
      featureType,
      loanPurpose
    )
    if (rateInfo) {
      setInterestRate(rateInfo.rate.toString())
      setComparisonRate(rateInfo.comparisonRate.toString())
    }
  }, [loanAmount, propertyValue, interestRateType, repaymentType, featureType, loanPurpose])

  // Add function to handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to recent searches (avoid duplicates)
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
      
      // In a real app, this would navigate to search results
      alert(`Searching for: ${searchQuery}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };
  
  // Add function to handle recent search click
  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    // In a real app, this would immediately execute the search
  };
  
  // Add function to handle property suggestion click
  const handlePropertyClick = (address: string) => {
    // In a real app, this would navigate to the property details page
    alert(`Navigating to property: ${address}`);
    setIsSearchOpen(false);
  };
  
  // Add function to clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
  };
  
  // Add function to handle back navigation
  const handleBackNavigation = () => {
    // In a real app, this would use router.back() or similar
    window.history.back();
  };

  // Add function to toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };
  
  // Add function to share property
  const shareProperty = () => {
    // In a real app, this would open a share dialog
    if (navigator.share) {
      navigator.share({
        title: 'Check out this property',
        text: `${address} - ${propertyData.valuation.mid}`,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      alert(`Share this property: ${window.location.href}`);
    }
  };
  
  // Extract suburb from address
  const getSuburb = () => {
    const parts = address.split(',');
    if (parts.length > 1) {
      const locationParts = parts[1].trim().split(' ');
      return locationParts[0]; // First part should be the suburb
    }
    return 'Location';
  };

  const formatInterestRate = (rate: number | string): string => {
    return parseFloat(rate.toString()).toFixed(2);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBackNavigation}
            className="hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 hidden md:block">{address}</h1>
        </div>
        
        <div className="relative">
          {isSearchOpen ? (
            <div className="flex flex-col">
              <div className="flex items-center bg-white border rounded-full overflow-hidden shadow-sm">
                <form onSubmit={handleSearchSubmit} className="flex flex-1">
                  <Input
                    type="text"
                    placeholder="Search for a property..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    autoFocus
                  />
                  <Button type="submit" variant="ghost" size="icon" className="mr-1">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSearchOpen(false)}
                  className="mr-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search dropdown with recent searches and suggestions */}
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border z-50 max-h-[70vh] overflow-y-auto">
                {/* Recent searches section */}
                {recentSearches.length > 0 && (
                  <div className="p-3 border-b">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Recent Searches</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <div 
                          key={index} 
                          className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                          onClick={() => handleRecentSearchClick(search)}
                        >
                          <Search className="h-3 w-3 text-gray-400 mr-2" />
                          <span className="text-sm">{search}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Property suggestions section */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Suggested Properties</h3>
                  <div className="space-y-3">
                    {suggestedProperties.map((property, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                        onClick={() => handlePropertyClick(property.address)}
                      >
                        <div className="flex items-start">
                          <div className="h-12 w-12 bg-gray-200 rounded-md mr-3 flex-shrink-0"></div>
                          <div>
                            <p className="text-sm font-medium">{property.address}</p>
                            <p className="text-xs text-gray-500">{property.price}</p>
                          </div>
                        </div>
                        <ArrowLeft className="h-4 w-4 text-gray-400 transform rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchOpen(true)}
              className="hover:bg-gray-100 rounded-full"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end mb-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFavorite}
            className={`flex items-center ${isFavorite ? 'text-red-500 border-red-500' : ''}`}
          >
            <Heart className={`h-4 w-4 mr-1 ${isFavorite ? 'fill-red-500' : ''}`} />
            {isFavorite ? 'Saved' : 'Save'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={shareProperty}
            className="flex items-center"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>
      
      {/* Mobile Address Display */}
      <h1 className="text-xl font-bold text-gray-900 mb-4 md:hidden">{address}</h1>

      {/* Top Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Property Image */}
        <div className="overflow-hidden rounded-lg flex items-start h-[450px]">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-8tgZj2IKhGZmOMqEtl4kCqnqWZFcue.png"
            alt="Property"
            className="w-full object-cover"
            style={{ height: "100%", objectPosition: "center" }}
          />
        </div>

        {/* Property Details */}
        <div className="flex flex-col h-[450px]">
          {/* Property Info Card */}
          <Card className="overflow-hidden border-none shadow-md h-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Property Details</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Listing
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f0f7f7] text-[#2a7d7d]">
                    <Bed className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="font-medium">{propertyData.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f0f7f7] text-[#2a7d7d]">
                    <Bath className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="font-medium">{propertyData.bathrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f0f7f7] text-[#2a7d7d]">
                    <Car className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Parking</p>
                    <p className="font-medium">{propertyData.parking}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f0f7f7] text-[#2a7d7d]">
                    <Maximize className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Land Size</p>
                    <p className="font-medium">{propertyData.landSize} m²</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center mt-3">
                  <span className="text-gray-500">Inspection</span>
                  <span className="font-medium">{propertyData.inspection}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Auction</span>
                  <span className="font-medium">{propertyData.auction}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Valuation Estimate Card - Full Width */}
      <Card className="overflow-hidden border-none shadow-md mb-6">
        <CardHeader className="bg-gradient-to-r from-[#f0f7f7] to-white pb-3">
          <CardTitle className="text-xl text-[#2a7d7d]">Property Valuation Estimate</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-[#f9fafa] p-6 rounded-lg border border-gray-100 h-full flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Estimated Market Value</h3>
                <div className="text-3xl font-bold text-[#2a7d7d] mb-3">${propertyValue}</div>
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    High Confidence
                  </Badge>
                  <HelpCircle className="h-4 w-4 text-gray-400 ml-2 cursor-help" aria-label="Our valuation model has high confidence in this estimate based on recent comparable sales in the area" />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-[#f9fafa] p-6 rounded-lg border border-gray-100 h-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Value Range</h3>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm text-gray-600">Low</div>
                  <div className="text-sm text-gray-600">High</div>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-gray-200 mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-[#2a7d7d] to-[#52a5a5]" 
                    style={{ width: '70%' }}
                  ></div>
                </div>
                <div className="flex justify-between">
                  <div className="text-md font-semibold">${(getNumericPropertyValue(propertyValue) * 0.9).toLocaleString()}</div>
                  <div className="text-md font-semibold">${(getNumericPropertyValue(propertyValue) * 1.1).toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-[#f9fafa] p-6 rounded-lg border border-gray-100 h-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Comparable Sales</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">123 Similar St</div>
                    <div className="text-sm font-medium">${(getNumericPropertyValue(propertyValue) * 0.95).toLocaleString()}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">456 Nearby Rd</div>
                    <div className="text-sm font-medium">${(getNumericPropertyValue(propertyValue) * 1.05).toLocaleString()}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">789 Local Ave</div>
                    <div className="text-sm font-medium">${(getNumericPropertyValue(propertyValue) * 1.02).toLocaleString()}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-3 text-[#2a7d7d] border-[#2a7d7d] hover:bg-[#f0f7f7]" onClick={() => setIsLoanDetailsModalOpen(true)}>
                  View All Comparables
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Affordability and Borrowing Power Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Affordability Card */}
        <Card className="overflow-hidden border-none shadow-md h-full">
          <CardHeader className="bg-gradient-to-r from-[#f0f7f7] to-white pb-3">
            <CardTitle className="text-xl text-[#2a7d7d]">Affordability</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-6">
              <Tabs defaultValue="owner" className="w-full mb-4" onValueChange={(value) => {
                if (value === "investor") {
                  setIsFirstHomeBuyer(false);
                  setCalculatorType('investment');
                } else {
                  setCalculatorType('live-in');
                }
                // Recalculate with new settings
                updateLoanAmount(propertyValue, deposit);
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="owner">Owner Occupier</TabsTrigger>
                  <TabsTrigger value="investor">Investor</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">First Home Buyer</span>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" aria-label="First home buyers may be eligible for stamp duty exemptions and government grants" />
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    value="" 
                    className="sr-only peer" 
                    checked={isFirstHomeBuyer}
                    onChange={() => {
                      setIsFirstHomeBuyer(!isFirstHomeBuyer);
                      setCalculatorType(isFirstHomeBuyer ? 'live-in' : 'first-home');
                      // Recalculate stamp duty with first home buyer benefits
                      updateLoanAmount(propertyValue, deposit);
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#f0f7f7] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2a7d7d]"></div>
                </div>
              </div>
              
              <InputRow 
                label="Estimated Property Value" 
                value={`$${propertyValue}`} 
                onChange={handlePropertyValueChange} 
                editable={true}
              />
              
              <InputRow 
                label="Savings for Deposit" 
                value={`$${deposit}`} 
                onChange={handleDepositChange} 
                editable={true}
                expandable={true}
                expanded={expandedSection === 'upfrontCosts'}
                onClick={() => toggleSection('upfrontCosts')}
                tooltip="Total amount saved for deposit, including funds for upfront costs"
              >
                <div className="bg-[#f9fafa] p-5 rounded-lg border border-gray-100 space-y-4 mt-2 ml-8">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Stamp Duty</span>
                    <span className="font-medium">{`$${Math.round(stampDuty).toLocaleString()}`}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Other Charges</span>
                    <span className="font-medium">{`$${Math.round(otherCharges).toLocaleString()}`}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-700 font-medium">Total Upfront Costs</span>
                    <span className="font-bold text-[#2a7d7d]">{`$${Math.round(upfrontCosts).toLocaleString()}`}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-700 font-medium">Deposit for Loan</span>
                    <span className="font-bold text-[#2a7d7d]">{`$${Math.round(parseCurrency(deposit) - upfrontCosts).toLocaleString()}`}</span>
                  </div>
                </div>
              </InputRow>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Loan Amount Required</h2>
                  <span className="font-bold text-2xl text-right">${Math.round(loanAmount).toLocaleString()}</span>
                </div>
                
                <div className="h-2 rounded-full overflow-hidden bg-gray-200 mb-2">
                  <div 
                    className={`h-full ${calculateLVR() > 85 ? 'bg-amber-500' : 'bg-[#2a7d7d]'}`}
                    style={{ width: `${Math.min((loanAmount / parseCurrency(propertyValue)) * 100, 100)}%` }}
                  />
                </div>
                
                <div className="mb-4">
                  <span className="text-sm text-gray-700">
                    {calculateLVR()}% loan to value ratio (LVR), borrow up to 90%.
                  </span>
                </div>
                
                {/* Standard Loan Details - Only visible for LVR <= 80% */}
                {calculateLVR() <= 80 && (
                  <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MortgageChoiceLogo />
                      <div className="text-lg font-medium">Mortgage Choice Freedom Variable Saver</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-gray-600 text-sm">Variable rate</div>
                        <div className="text-2xl font-semibold">{formatInterestRate(interestRate)}<span className="text-base">% p.a.</span></div>
                      </div>
                      <div>
                        <div className="text-gray-600 text-sm">Comparison rate*</div>
                        <div className="text-2xl font-semibold">{formatInterestRate(comparisonRate)}<span className="text-base">% p.a.</span></div>
                      </div>
                      <div>
                        <div className="text-gray-600 text-sm">Repayments</div>
                        <div className="text-2xl font-semibold">{monthlyPayment}<span className="text-base">/mth</span></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {calculateLVR() > 80 && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Low Deposit Options</h3>
                      <span className="bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">
                        {calculateLVR()}% LVR
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">
                      Mortgage Choice Freedom and OwnHome could help you secure this property with a high LVR.
                    </p>
                    
                    <div className="flex space-x-8 mb-4">
                      <div className="flex flex-col items-center">
                        <MortgageChoiceLogo />
                        <span className="text-xs font-medium text-[#006875] mt-1">Mortgage Choice</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <OwnHomeLogo />
                        <span className="text-xs font-medium text-[#FE2C42] mt-1">OwnHome</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                      <div className="text-lg font-medium mb-2">Mortgage Choice Freedom Variable Saver 60-70% LVR</div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-gray-600 text-sm">Variable rate</div>
                          <div className="text-2xl font-semibold">5.74<span className="text-base">% p.a.</span></div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-sm">Comparison rate*</div>
                          <div className="text-2xl font-semibold">5.65<span className="text-base">% p.a.</span></div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-sm">Repayments</div>
                          <div className="text-2xl font-semibold">${Math.round(calculateMonthlyRepayment(loanAmount, 5.74, Number(loanTerm))).toLocaleString()}<span className="text-base">/mth</span></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                      <div className="text-lg font-medium mb-2">OwnHome Deposit Booster Loan</div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-gray-600 text-sm">Variable rate</div>
                          <div className="text-2xl font-semibold">6.24<span className="text-base">% p.a.</span></div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-sm">Comparison rate*</div>
                          <div className="text-2xl font-semibold">6.25<span className="text-base">% p.a.</span></div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-sm">Repayments</div>
                          <div className="text-2xl font-semibold">${Math.round(calculateMonthlyRepayment(loanAmount, 6.24, Number(loanTerm))).toLocaleString()}<span className="text-base">/mth</span></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      <p>These lenders specialize in high LVR loans and can help you secure this property with your current deposit.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Minimum repayments based on principal and interest repayments for {loanTerm} years.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[#2a7d7d] border-[#2a7d7d] hover:bg-[#f0f7f7]"
                  onClick={() => setIsLoanDetailsModalOpen(true)}
                >
                  Adjust Loan Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Borrowing Power Card */}
        <Card className="overflow-hidden border-none shadow-md h-full">
          <CardHeader className="bg-gradient-to-r from-[#f0f7f7] to-white pb-3">
            <CardTitle className="text-xl text-[#2a7d7d]">Borrowing Power</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 p-6 mb-6">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 rounded-full p-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Add Your Financials</h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Calculate your borrowing power by entering your income, expenses, and existing loan details.
                </p>
                <MapPin className="h-5 w-5 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 text-center">
                  Your information is encrypted and never shared with lenders without your permission.
                </p>
              </div>
            </div>
            <Button 
              className="w-full bg-[#2a7d7d] hover:bg-[#236363]"
              onClick={() => setIsBorrowingPowerModalOpen(true)}
            >
              Calculate Borrowing Power
            </Button>
          </CardContent>
        </Card>
      </div>

      {borrowingPowerResults && (
        <Card className="overflow-hidden border-none shadow-md mb-6">
          <CardHeader className="bg-gradient-to-r from-[#f0f7f7] to-white pb-3">
            <CardTitle className="text-xl text-[#2a7d7d]">Detailed Calculations</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <BorrowingPowerCalculationDetailsComponent 
              results={borrowingPowerResults} 
              desiredLoanAmount={loanAmount}
              interestRate={interestRate}
              propertyValue={propertyValue}
              parseCurrencyFn={parseCurrency}
              loanTerm={loanTerm}
            />
          </CardContent>
        </Card>
      )}

      {/* Loan Details Modal */}
      <LoanDetailsModal
        isOpen={isLoanDetailsModalOpen}
        onClose={() => setIsLoanDetailsModalOpen(false)}
        loanTerm={parseInt(loanTerm)}
        interestRateType={interestRateType}
        repaymentType={repaymentType}
        featureType={featureType}
        loanPurpose={loanPurpose}
        onUpdate={handleLoanDetailsUpdate}
      />

      {/* Borrowing Power Modal */}
      <BorrowingPowerModal
        isOpen={isBorrowingPowerModalOpen}
        onClose={() => setIsBorrowingPowerModalOpen(false)}
        onCalculate={handleBorrowingPowerCalculate}
        propertyValue={parseCurrency(propertyValue)}
        deposit={parseCurrency(deposit)}
        state={propertyState}
        isFirstHomeBuyer={isFirstHomeBuyer}
      />
      
      {/* Footer with disclaimer */}
      <div className="mt-12 border-t pt-6 text-xs text-gray-500">
        <p className="mb-2">
          * The information provided is for general information purposes only and does not constitute financial advice.
          Property valuations are estimates and may vary from actual market values.
        </p>
        <p>
          © 2023 Property Affordability Explorer. All rights reserved.
        </p>
      </div>
    </div>
  )
}

