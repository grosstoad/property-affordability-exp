"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  RateConfiguration, 
  LvrTier, 
  InterestRateType, 
  RepaymentType, 
  FeatureType, 
  LoanPurpose 
} from "@/types/rateTypes"

export default function RateManagement() {
  const [rates, setRates] = useState<RateConfiguration[]>([])
  const [newRate, setNewRate] = useState<Partial<RateConfiguration>>({
    lvr: LvrTier.TIER_0_50,
    interestRateType: InterestRateType.VARIABLE,
    repaymentType: RepaymentType.PRINCIPAL_AND_INTEREST,
    featureType: FeatureType.REDRAW,
    loanPurpose: LoanPurpose.OWNER,
    rate: 5.99,
    comparisonRate: 6.20
  })
  
  // Load rates from API/database
  useEffect(() => {
    // In a real app, fetch from API
    // For now, use sample data
    const sampleRates: RateConfiguration[] = [
      // Sample data
    ]
    setRates(sampleRates)
  }, [])
  
  const handleAddRate = () => {
    if (
      newRate.lvr && 
      newRate.interestRateType && 
      newRate.repaymentType && 
      newRate.featureType && 
      newRate.loanPurpose && 
      newRate.rate !== undefined && 
      newRate.comparisonRate !== undefined
    ) {
      const rateConfig = newRate as RateConfiguration
      setRates([...rates, rateConfig])
      
      // In a real app, save to API/database
      
      // Reset form
      setNewRate({
        lvr: LvrTier.TIER_0_50,
        interestRateType: InterestRateType.VARIABLE,
        repaymentType: RepaymentType.PRINCIPAL_AND_INTEREST,
        featureType: FeatureType.REDRAW,
        loanPurpose: LoanPurpose.OWNER,
        rate: 5.99,
        comparisonRate: 6.20
      })
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Loan Rate Management</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Rate</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">LVR Tier</label>
            <Select 
              value={newRate.lvr} 
              onValueChange={(value) => setNewRate({...newRate, lvr: value as LvrTier})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select LVR tier" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(LvrTier).map((tier) => (
                  <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Interest Rate Type</label>
            <Select 
              value={newRate.interestRateType} 
              onValueChange={(value) => setNewRate({...newRate, interestRateType: value as InterestRateType})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rate type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(InterestRateType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === InterestRateType.VARIABLE ? 'Variable' : 
                     type === InterestRateType.FIXED_1_YEAR ? 'Fixed 1 Year' : 
                     type === InterestRateType.FIXED_2_YEAR ? 'Fixed 2 Years' : 'Fixed 3 Years'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Repayment Type</label>
            <Select 
              value={newRate.repaymentType} 
              onValueChange={(value) => setNewRate({...newRate, repaymentType: value as RepaymentType})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select repayment type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(RepaymentType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === RepaymentType.PRINCIPAL_AND_INTEREST ? 'Principal & Interest' : 'Interest Only'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Feature Type</label>
            <Select 
              value={newRate.featureType} 
              onValueChange={(value) => setNewRate({...newRate, featureType: value as FeatureType})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select feature type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FeatureType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === FeatureType.REDRAW ? 'Redraw' : 'Offset'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Loan Purpose</label>
            <Select 
              value={newRate.loanPurpose} 
              onValueChange={(value) => setNewRate({...newRate, loanPurpose: value as LoanPurpose})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select loan purpose" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(LoanPurpose).map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>
                    {purpose === LoanPurpose.OWNER ? 'Owner Occupier' : 'Investor'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
            <Input 
              type="number" 
              step="0.01" 
              value={newRate.rate} 
              onChange={(e) => setNewRate({...newRate, rate: parseFloat(e.target.value)})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Comparison Rate (%)</label>
            <Input 
              type="number" 
              step="0.01" 
              value={newRate.comparisonRate} 
              onChange={(e) => setNewRate({...newRate, comparisonRate: parseFloat(e.target.value)})}
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={handleAddRate}>Add Rate</Button>
        </div>
      </div>
    </div>
  )
} 