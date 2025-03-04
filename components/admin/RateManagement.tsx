"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  RateConfiguration,
  LoanProductType,
  RepaymentType,
  BorrowerType,
  LvrRange,
  formatProductType,
  formatRepaymentType,
  formatBorrowerType,
  formatLvrRange
} from "@/types/rates"
import { getAllRates } from "@/utils/newRateRepository"
import RateImporter from "./RateImporter"

export default function RateManagement() {
  const [rates, setRates] = useState<RateConfiguration[]>([])
  const [activeTab, setActiveTab] = useState("view")
  const [newRate, setNewRate] = useState<Partial<RateConfiguration>>({
    id: "",
    productName: "",
    lender: "",
    productType: "variable",
    repaymentType: "principal_and_interest",
    borrowerType: "owner_occupier",
    lvrRange: "70_80",
    hasOffset: false,
    hasRedraw: false,
    rate: 0,
    comparisonRate: 0,
    maxLvr: 80,
    minLoanAmount: 50000,
    maxLoanAmount: null,
    isFirstHomeBuyerEligible: true,
    effectiveDate: new Date().toISOString().split("T")[0]
  })
  
  useEffect(() => {
    // Load rates when component mounts
    setRates(getAllRates())
  }, [])
  
  const handleAddRate = () => {
    // Generate a unique ID
    const id = `rate_${Date.now()}`
    
    // Create a new rate with the ID
    const rateToAdd: RateConfiguration = {
      ...newRate as RateConfiguration,
      id
    }
    
    // Add the rate to the list
    setRates([...rates, rateToAdd])
    
    // Reset the form
    setNewRate({
      id: "",
      productName: "",
      lender: "",
      productType: "variable",
      repaymentType: "principal_and_interest",
      borrowerType: "owner_occupier",
      lvrRange: "70_80",
      hasOffset: false,
      hasRedraw: false,
      rate: 0,
      comparisonRate: 0,
      maxLvr: 80,
      minLoanAmount: 50000,
      maxLoanAmount: null,
      isFirstHomeBuyerEligible: true,
      effectiveDate: new Date().toISOString().split("T")[0]
    })
    
    // Switch to the view tab
    setActiveTab("view")
  }
  
  const handleDeleteRate = (id: string) => {
    // Remove the rate from the list
    setRates(rates.filter(rate => rate.id !== id))
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    // Handle checkboxes
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setNewRate({
        ...newRate,
        [name]: checked
      })
      return
    }
    
    // Handle number inputs
    if (type === 'number') {
      setNewRate({
        ...newRate,
        [name]: parseFloat(value) || 0
      })
      return
    }
    
    // Handle other inputs
    setNewRate({
      ...newRate,
      [name]: value
    })
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rate Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="view">View Rates</TabsTrigger>
              <TabsTrigger value="add">Add Rate</TabsTrigger>
              <TabsTrigger value="import">Import Rates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="view">
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lender
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        LVR
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rates.map((rate) => (
                      <tr key={rate.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{rate.lender}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{rate.productName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {formatProductType(rate.productType)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {formatLvrRange(rate.lvrRange)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {rate.rate.toFixed(2)}%
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRate(rate.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {rates.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                          No rates found. Add a rate or import rates from Excel.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="add">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Lender</label>
                    <Input
                      name="lender"
                      value={newRate.lender || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. Mortgage Choice"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Name</label>
                    <Input
                      name="productName"
                      value={newRate.productName || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. Freedom Variable"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Type</label>
                    <select
                      name="productType"
                      value={newRate.productType || "variable"}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="variable">Variable</option>
                      <option value="fixed_1">1 Year Fixed</option>
                      <option value="fixed_2">2 Year Fixed</option>
                      <option value="fixed_3">3 Year Fixed</option>
                      <option value="fixed_4">4 Year Fixed</option>
                      <option value="fixed_5">5 Year Fixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Repayment Type</label>
                    <select
                      name="repaymentType"
                      value={newRate.repaymentType || "principal_and_interest"}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="principal_and_interest">Principal & Interest</option>
                      <option value="interest_only">Interest Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Borrower Type</label>
                    <select
                      name="borrowerType"
                      value={newRate.borrowerType || "owner_occupier"}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="owner_occupier">Owner Occupier</option>
                      <option value="investor">Investor</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">LVR Range</label>
                    <select
                      name="lvrRange"
                      value={newRate.lvrRange || "70_80"}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="0_60">0-60%</option>
                      <option value="60_70">60-70%</option>
                      <option value="70_80">70-80%</option>
                      <option value="80_85">80-85%</option>
                      <option value="85_90">85-90%</option>
                      <option value="90_95">90-95%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max LVR</label>
                    <Input
                      name="maxLvr"
                      type="number"
                      value={newRate.maxLvr || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Effective Date</label>
                    <Input
                      name="effectiveDate"
                      type="date"
                      value={newRate.effectiveDate || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
                    <Input
                      name="rate"
                      type="number"
                      step="0.01"
                      value={newRate.rate || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Comparison Rate (%)</label>
                    <Input
                      name="comparisonRate"
                      type="number"
                      step="0.01"
                      value={newRate.comparisonRate || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Loan Amount</label>
                    <Input
                      name="minLoanAmount"
                      type="number"
                      value={newRate.minLoanAmount || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="hasOffset"
                        checked={newRate.hasOffset || false}
                        onChange={handleInputChange}
                        className="rounded"
                      />
                      <span>Has Offset Account</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="hasRedraw"
                        checked={newRate.hasRedraw || false}
                        onChange={handleInputChange}
                        className="rounded"
                      />
                      <span>Has Redraw Facility</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isFirstHomeBuyerEligible"
                        checked={newRate.isFirstHomeBuyerEligible || false}
                        onChange={handleInputChange}
                        className="rounded"
                      />
                      <span>First Home Buyer Eligible</span>
                    </label>
                  </div>
                </div>
                
                <Button onClick={handleAddRate}>Add Rate</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="import">
              <RateImporter />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 