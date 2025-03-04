"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { importRatesFromExcel, initializeRateDatabase } from '@/utils/newRateRepository'
import { RateConfiguration } from '@/types/rates'
import { Input } from '@/components/ui/input'

export default function RateImporter() {
  const [isLoading, setIsLoading] = useState(false)
  const [importedRates, setImportedRates] = useState<RateConfiguration[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Read the file as ArrayBuffer
      const buffer = await file.arrayBuffer()
      
      // Import rates from Excel
      const rates = await importRatesFromExcel(buffer)
      
      // Initialize the rate database
      initializeRateDatabase(rates)
      
      // Update state
      setImportedRates(rates)
      
      // Show success message
      alert(`Successfully imported ${rates.length} rates`)
    } catch (err) {
      console.error('Error importing rates:', err)
      setError('Failed to import rates. Please check the file format.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Rates from Excel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="excel-file" className="block text-sm font-medium mb-2">
              Select Excel File
            </label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload an Excel file containing rate information.
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}
          
          {importedRates.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Imported Rates</h3>
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
                        LVR Range
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comparison Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importedRates.slice(0, 10).map((rate, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{rate.lender}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{rate.productName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{rate.lvrRange.replace('_', '-')}%</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{rate.rate.toFixed(2)}%</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{rate.comparisonRate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importedRates.length > 10 && (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Showing 10 of {importedRates.length} rates
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 