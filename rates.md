# Rate Management System Implementation Plan

This document outlines a comprehensive plan for implementing a centralized rate management system for the Property Affordability Calculator. The system will standardize how interest rates are accessed, stored, and applied throughout the application.

## Table of Contents

1. [Data Structure](#1-data-structure)
2. [Rate Repository Service](#2-rate-repository-service)
3. [Rate Import Service](#3-rate-import-service)
4. [Rate Context Provider](#4-rate-context-provider)
5. [Rate Selection Component](#5-rate-selection-component)
6. [Admin Interface](#6-admin-interface)
7. [Integration with Loan Calculator](#7-integration-with-loan-calculator)
8. [Integration with Borrowing Power Calculator](#8-integration-with-borrowing-power-calculator)
9. [Implementation Schedule](#9-implementation-schedule)
10. [Testing Plan](#10-testing-plan)

## 1. Data Structure

```typescript
// types/rates.ts

/**
 * Loan product type (variable or fixed term)
 */
export type LoanProductType = 'variable' | 'fixed_1' | 'fixed_2' | 'fixed_3' | 'fixed_5';

/**
 * Repayment type (principal & interest or interest only)
 */
export type RepaymentType = 'principal_and_interest' | 'interest_only';

/**
 * Borrower type (owner occupier or investor)
 */
export type BorrowerType = 'owner_occupier' | 'investor';

/**
 * LVR range (formatted as min_max)
 */
export type LvrRange = '0_60' | '60_70' | '70_80' | '80_85' | '85_90' | '90_95';

/**
 * Complete rate configuration structure
 */
export interface RateConfiguration {
  id: string;                       // Unique identifier
  productName: string;              // Name of the loan product
  lender: string;                   // Name of the lender
  productType: LoanProductType;     // Rate type (variable, fixed_1, etc.)
  repaymentType: RepaymentType;     // P&I or IO
  borrowerType: BorrowerType;       // Owner occupier or investor
  lvrRange: LvrRange;               // LVR range
  hasOffset: boolean;               // Whether it has offset account
  hasRedraw: boolean;               // Whether it has redraw facility
  rate: number;                     // Interest rate (%)
  comparisonRate: number;           // Comparison rate (%)
  maxLvr: number;                   // Maximum LVR allowed
  minLoanAmount: number;            // Minimum loan amount
  maxLoanAmount: number | null;     // Maximum loan amount (null if no limit)
  isFirstHomeBuyerEligible: boolean;// Whether eligible for FHB
  effectiveDate: string;            // When this rate became effective
}

/**
 * Convert numeric LVR to appropriate range
 */
export const getLvrRangeFromValue = (lvr: number): LvrRange => {
  if (lvr <= 60) return '0_60';
  if (lvr <= 70) return '60_70';
  if (lvr <= 80) return '70_80';
  if (lvr <= 85) return '80_85';
  if (lvr <= 90) return '85_90';
  return '90_95';
};

/**
 * Format LVR range for display
 */
export const formatLvrRange = (lvrRange: LvrRange): string => {
  switch (lvrRange) {
    case '0_60': return '≤60%';
    case '60_70': return '60-70%';
    case '70_80': return '70-80%';
    case '80_85': return '80-85%';
    case '85_90': return '85-90%';
    case '90_95': return '90-95%';
    default: return lvrRange;
  }
};
```

## 2. Rate Repository Service

```typescript
// services/rateRepository.ts

import { 
  RateConfiguration, 
  LoanProductType, 
  RepaymentType, 
  BorrowerType, 
  LvrRange,
  getLvrRangeFromValue
} from '@/types/rates';

/**
 * Query parameters for finding rates
 */
export interface RateQuery {
  loanAmount: number;
  lvr: number;
  productType?: LoanProductType;
  repaymentType?: RepaymentType;
  borrowerType?: BorrowerType;
  hasOffset?: boolean;
  hasRedraw?: boolean;
  isFirstHomeBuyer?: boolean;
}

/**
 * Result of a rate search including assessment rate
 */
export interface RateResult {
  config: RateConfiguration;
  assessmentRate: number;
}

/**
 * Central repository for storing and accessing rate data
 */
export class RateRepository {
  private static instance: RateRepository;
  private rates: RateConfiguration[] = [];
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): RateRepository {
    if (!RateRepository.instance) {
      RateRepository.instance = new RateRepository();
    }
    return RateRepository.instance;
  }
  
  /**
   * Set the full rates collection
   */
  public setRates(rates: RateConfiguration[]): void {
    this.rates = [...rates];
  }
  
  /**
   * Get all stored rates
   */
  public getAllRates(): RateConfiguration[] {
    return [...this.rates];
  }
  
  /**
   * Find eligible rates that match the criteria
   */
  public findEligibleRates(query: RateQuery): RateConfiguration[] {
    const lvrRange = getLvrRangeFromValue(query.lvr);
    
    return this.rates.filter(rate => {
      // Check primary criteria
      if (rate.minLoanAmount > query.loanAmount) return false;
      if (rate.maxLoanAmount && rate.maxLoanAmount < query.loanAmount) return false;
      if (rate.maxLvr < query.lvr) return false;
      
      // Check LVR range
      if (rate.lvrRange !== lvrRange) return false;
      
      // Check optional criteria when specified
      if (query.productType && rate.productType !== query.productType) return false;
      if (query.repaymentType && rate.repaymentType !== query.repaymentType) return false;
      if (query.borrowerType && rate.borrowerType !== query.borrowerType) return false;
      
      // Check features when required
      if (query.hasOffset === true && !rate.hasOffset) return false;
      if (query.hasRedraw === true && !rate.hasRedraw) return false;
      
      // Check eligibility
      if (query.isFirstHomeBuyer === true && !rate.isFirstHomeBuyerEligible) return false;
      
      return true;
    }).sort((a, b) => a.rate - b.rate); // Sort by lowest rate first
  }
  
  /**
   * Find the best rate for the given criteria
   */
  public findBestRate(query: RateQuery): RateResult | null {
    const eligibleRates = this.findEligibleRates(query);
    
    if (eligibleRates.length === 0) return null;
    
    // The first rate after sorting is the lowest/best
    const bestRate = eligibleRates[0];
    
    // Calculate assessment rate (base rate + 3% buffer)
    const assessmentRate = Math.max(bestRate.rate + 3.0, 5.5);
    
    return {
      config: bestRate,
      assessmentRate
    };
  }
}

// Export singleton
export const rateRepository = RateRepository.getInstance();
```

## 3. Rate Import Service

```typescript
// services/rateImportService.ts

import * as XLSX from 'xlsx';
import { RateConfiguration, LoanProductType, RepaymentType, BorrowerType, LvrRange } from '@/types/rates';

/**
 * Service for importing rates from Excel
 */
export class RateImportService {
  /**
   * Import rates from Excel file
   */
  public static async importFromExcel(file: File): Promise<RateConfiguration[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Assume first sheet contains the rate data
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Transform to our rate configuration format
          const rateConfigurations = this.transformExcelData(jsonData);
          resolve(rateConfigurations);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Transform raw Excel data to structured rate configurations
   */
  private static transformExcelData(data: any[]): RateConfiguration[] {
    return data.map((row, index) => {
      // Map Excel columns to our structure (adjust based on actual Excel format)
      return {
        id: `rate-${index}`,
        productName: row.ProductName || row.Product || 'Unknown',
        lender: row.Lender || row.Provider || 'MCF',
        productType: this.mapProductType(row.ProductType || row.Type),
        repaymentType: this.mapRepaymentType(row.RepaymentType || row.Repayment),
        borrowerType: this.mapBorrowerType(row.BorrowerType || row.Borrower),
        lvrRange: this.mapLvrRange(row.LvrRange || row.LVR),
        hasOffset: Boolean(row.HasOffset || row.Offset || row.OffsetAccount),
        hasRedraw: Boolean(row.HasRedraw || row.Redraw || row.RedrawFacility),
        rate: Number(row.Rate || row.InterestRate),
        comparisonRate: Number(row.ComparisonRate || row.Comparison),
        maxLvr: Number(row.MaxLvr || row.MaximumLVR || 95),
        minLoanAmount: Number(row.MinLoanAmount || row.MinimumLoan || 0),
        maxLoanAmount: row.MaxLoanAmount ? Number(row.MaxLoanAmount) : null,
        isFirstHomeBuyerEligible: Boolean(row.IsFirstHomeBuyerEligible || row.FHB || true),
        effectiveDate: row.EffectiveDate || row.Date || new Date().toISOString().split('T')[0]
      };
    });
  }
  
  /**
   * Map Excel product type values to our enum
   */
  private static mapProductType(value: string): LoanProductType {
    if (!value) return 'variable';
    
    const normalized = value.toLowerCase();
    if (normalized.includes('fixed')) {
      if (normalized.includes('1') || normalized.includes('one')) return 'fixed_1';
      if (normalized.includes('2') || normalized.includes('two')) return 'fixed_2';
      if (normalized.includes('3') || normalized.includes('three')) return 'fixed_3';
      if (normalized.includes('5') || normalized.includes('five')) return 'fixed_5';
      return 'fixed_1'; // Default fixed if period not specified
    }
    
    return 'variable';
  }
  
  /**
   * Map Excel repayment type values to our enum
   */
  private static mapRepaymentType(value: string): RepaymentType {
    if (!value) return 'principal_and_interest';
    
    const normalized = value.toLowerCase();
    if (normalized.includes('interest only') || normalized.includes('io')) {
      return 'interest_only';
    }
    
    return 'principal_and_interest';
  }
  
  /**
   * Map Excel borrower type values to our enum
   */
  private static mapBorrowerType(value: string): BorrowerType {
    if (!value) return 'owner_occupier';
    
    const normalized = value.toLowerCase();
    if (normalized.includes('investor') || normalized.includes('investment')) {
      return 'investor';
    }
    
    return 'owner_occupier';
  }
  
  /**
   * Map Excel LVR range values to our enum
   */
  private static mapLvrRange(value: string): LvrRange {
    if (!value) return '0_60';
    
    // Handle different formats like "≤60%", "60-70%", etc.
    const normalized = value.replace('%', '').toLowerCase();
    
    if (normalized.includes('≤60') || normalized.includes('0-60') || normalized.includes('<60')) {
      return '0_60';
    }
    if (normalized.includes('60-70') || normalized.includes('≤70') || normalized.includes('<70')) {
      return '60_70';
    }
    if (normalized.includes('70-80') || normalized.includes('≤80') || normalized.includes('<80')) {
      return '70_80';
    }
    if (normalized.includes('80-85') || normalized.includes('≤85') || normalized.includes('<85')) {
      return '80_85';
    }
    if (normalized.includes('85-90') || normalized.includes('≤90') || normalized.includes('<90')) {
      return '85_90';
    }
    if (normalized.includes('90-95') || normalized.includes('≤95') || normalized.includes('<95')) {
      return '90_95';
    }
    
    // If we can't determine the range, make a best guess based on numeric value
    const numericMatch = normalized.match(/(\d+)/);
    if (numericMatch) {
      const lvr = parseInt(numericMatch[0], 10);
      if (lvr <= 60) return '0_60';
      if (lvr <= 70) return '60_70';
      if (lvr <= 80) return '70_80';
      if (lvr <= 85) return '80_85';
      if (lvr <= 90) return '85_90';
      return '90_95';
    }
    
    return '0_60'; // Default
  }
}
```

## 4. Rate Context Provider

```typescript
// context/RateContext.tsx

import React, { createContext, useContext, useEffect, useState, useReducer, ReactNode } from 'react';
import { RateConfiguration, LoanProductType, RepaymentType, BorrowerType } from '@/types/rates';
import { rateRepository, RateQuery } from '@/services/rateRepository';

/**
 * Default rates to use if no rate import has been done
 */
const DEFAULT_RATES: RateConfiguration[] = [
  {
    id: 'default-variable-owner-low-lvr',
    productName: 'Freedom Variable Saver',
    lender: 'Mortgage Choice',
    productType: 'variable',
    repaymentType: 'principal_and_interest',
    borrowerType: 'owner_occupier',
    lvrRange: '0_60',
    hasOffset: true,
    hasRedraw: true,
    rate: 5.50,
    comparisonRate: 5.65,
    maxLvr: 60,
    minLoanAmount: 50000,
    maxLoanAmount: null,
    isFirstHomeBuyerEligible: true,
    effectiveDate: '2023-01-01'
  },
  // More default rates would be defined here for other scenarios
];

/**
 * Rate preferences
 */
interface RatePreferences {
  productType: LoanProductType;
  repaymentType: RepaymentType;
  borrowerType: BorrowerType;
  hasOffset: boolean;
  hasRedraw: boolean;
  isFirstHomeBuyer: boolean;
}

/**
 * Rate state
 */
interface RateState {
  rates: RateConfiguration[];
  isLoading: boolean;
  selectedRate: RateConfiguration | null;
  preferences: RatePreferences;
  lastUpdated: string | null;
}

/**
 * Rate actions
 */
type RateAction = 
  | { type: 'SET_RATES'; payload: RateConfiguration[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_RATE'; payload: RateConfiguration | null }
  | { type: 'SET_PREFERENCE'; payload: Partial<RatePreferences> }
  | { type: 'RESET_PREFERENCES' };

/**
 * Initial state
 */
const initialState: RateState = {
  rates: [],
  isLoading: false,
  selectedRate: null,
  preferences: {
    productType: 'variable',
    repaymentType: 'principal_and_interest',
    borrowerType: 'owner_occupier',
    hasOffset: false,
    hasRedraw: true,
    isFirstHomeBuyer: false
  },
  lastUpdated: null
};

/**
 * Reducer function
 */
const rateReducer = (state: RateState, action: RateAction): RateState => {
  switch (action.type) {
    case 'SET_RATES':
      return {
        ...state,
        rates: action.payload,
        lastUpdated: new Date().toISOString()
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_SELECTED_RATE':
      return {
        ...state,
        selectedRate: action.payload
      };
    case 'SET_PREFERENCE':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload
        }
      };
    case 'RESET_PREFERENCES':
      return {
        ...state,
        preferences: initialState.preferences
      };
    default:
      return state;
  }
};

/**
 * Rate context type
 */
interface RateContextType {
  state: RateState;
  dispatch: React.Dispatch<RateAction>;
  findEligibleRates: (loanAmount: number, lvr: number) => RateConfiguration[];
  findBestRate: (loanAmount: number, lvr: number) => RateConfiguration | null;
  getAssessmentRate: (baseRate: number) => number;
}

// Create context
const RateContext = createContext<RateContextType | undefined>(undefined);

/**
 * Provider component
 */
export const RateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(rateReducer, initialState);
  
  // Initialize with default rates
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Set default rates in repository
    rateRepository.setRates(DEFAULT_RATES);
    
    // Update state
    dispatch({ type: 'SET_RATES', payload: DEFAULT_RATES });
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);
  
  /**
   * Find eligible rates based on current preferences
   */
  const findEligibleRates = (loanAmount: number, lvr: number): RateConfiguration[] => {
    const query: RateQuery = {
      loanAmount,
      lvr,
      ...state.preferences
    };
    
    return rateRepository.findEligibleRates(query);
  };
  
  /**
   * Find best rate based on current preferences
   */
  const findBestRate = (loanAmount: number, lvr: number): RateConfiguration | null => {
    const query: RateQuery = {
      loanAmount,
      lvr,
      ...state.preferences
    };
    
    const result = rateRepository.findBestRate(query);
    return result ? result.config : null;
  };
  
  /**
   * Get assessment rate for serviceability calculations
   */
  const getAssessmentRate = (baseRate: number): number => {
    // Assessment rate is the higher of:
    // 1. Base rate + 3.0%
    // 2. Floor rate (e.g., 5.5%)
    const withBuffer = baseRate + 3.0;
    const floorRate = 5.5;
    
    return Math.max(withBuffer, floorRate);
  };
  
  const contextValue: RateContextType = {
    state,
    dispatch,
    findEligibleRates,
    findBestRate,
    getAssessmentRate
  };
  
  return (
    <RateContext.Provider value={contextValue}>
      {children}
    </RateContext.Provider>
  );
};

/**
 * Custom hook for using the context
 */
export const useRates = (): RateContextType => {
  const context = useContext(RateContext);
  if (context === undefined) {
    throw new Error('useRates must be used within a RateProvider');
  }
  return context;
};
```

## 5. Rate Selection Component

```tsx
// components/RateSelector.tsx

import React from 'react';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currency';
import { useRates } from '@/context/RateContext';
import { RateConfiguration, formatLvrRange } from '@/types/rates';

interface RateSelectorProps {
  loanAmount: number;
  lvr: number;
  onRateSelect: (rate: RateConfiguration) => void;
}

export const RateSelector: React.FC<RateSelectorProps> = ({
  loanAmount,
  lvr,
  onRateSelect
}) => {
  const { state, dispatch, findEligibleRates } = useRates();
  const { preferences } = state;
  
  // Get eligible rates based on current preferences
  const eligibleRates = findEligibleRates(loanAmount, lvr);
  
  // Group rates by product type for easier display
  const variableRates = eligibleRates.filter(r => r.productType === 'variable');
  const fixed1Rates = eligibleRates.filter(r => r.productType === 'fixed_1');
  const fixed2Rates = eligibleRates.filter(r => r.productType === 'fixed_2');
  const fixed3Rates = eligibleRates.filter(r => r.productType === 'fixed_3');
  
  // Handle product type selection
  const handleProductTypeChange = (value: string) => {
    dispatch({ 
      type: 'SET_PREFERENCE', 
      payload: { productType: value as any } 
    });
  };
  
  // Handle rate selection
  const handleRateSelect = (rate: RateConfiguration) => {
    dispatch({ type: 'SET_SELECTED_RATE', payload: rate });
    onRateSelect(rate);
  };
  
  // Render a rate card
  const renderRateCard = (rate: RateConfiguration) => (
    <Card 
      key={rate.id}
      className="relative cursor-pointer hover:border-primary transition-colors"
      onClick={() => handleRateSelect(rate)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{rate.productName}</CardTitle>
        <CardDescription>{rate.lender}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Interest Rate</span>
            <span className="font-semibold">{rate.rate.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Comparison Rate</span>
            <span>{rate.comparisonRate.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">LVR Range</span>
            <span>{formatLvrRange(rate.lvrRange)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full">Select</Button>
      </CardFooter>
      
      {/* Feature badges */}
      <div className="absolute top-2 right-2 flex space-x-1">
        {rate.hasOffset && (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            Offset
          </span>
        )}
        {rate.hasRedraw && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Redraw
          </span>
        )}
      </div>
    </Card>
  );
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Select Interest Rate</h2>
        <div className="text-sm">
          <span className="text-muted-foreground">For:</span> {formatCurrency(loanAmount)} at {lvr.toFixed(1)}% LVR
        </div>
      </div>
      
      {/* Rate type tabs */}
      <Tabs 
        defaultValue="variable" 
        value={preferences.productType}
        onValueChange={handleProductTypeChange}
      >
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="variable">Variable</TabsTrigger>
          <TabsTrigger value="fixed_1">1 Year Fixed</TabsTrigger>
          <TabsTrigger value="fixed_2">2 Year Fixed</TabsTrigger>
          <TabsTrigger value="fixed_3">3 Year Fixed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="variable" className="pt-4">
          {variableRates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variableRates.map(renderRateCard)}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded">
              No variable rates available for this scenario. 
              Try adjusting your loan amount or LVR.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="fixed_1" className="pt-4">
          {fixed1Rates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixed1Rates.map(renderRateCard)}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded">
              No 1-year fixed rates available for this scenario.
              Try adjusting your loan amount or LVR.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="fixed_2" className="pt-4">
          {/* Similar content for 2-year fixed rates */}
        </TabsContent>
        
        <TabsContent value="fixed_3" className="pt-4">
          {/* Similar content for 3-year fixed rates */}
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

## 6. Admin Interface

```tsx
// components/admin/RateAdmin.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { RateConfiguration } from '@/types/rates';
import { rateRepository } from '@/services/rateRepository';
import { RateImportService } from '@/services/rateImportService';
import { useRates } from '@/context/RateContext';

export function RateAdmin() {
  const { state, dispatch } = useRates();
  const [isImporting, setIsImporting] = useState(false);
  const [filter, setFilter] = useState('');
  const [filteredRates, setFilteredRates] = useState<RateConfiguration[]>([]);
  
  // Update filtered rates when rates change or filter changes
  useEffect(() => {
    if (!filter) {
      setFilteredRates(state.rates);
      return;
    }
    
    const lowerFilter = filter.toLowerCase();
    const filtered = state.rates.filter(rate => 
      rate.productName.toLowerCase().includes(lowerFilter) ||
      rate.lender.toLowerCase().includes(lowerFilter) ||
      rate.lvrRange.includes(lowerFilter)
    );
    
    setFilteredRates(filtered);
  }, [state.rates, filter]);
  
  // Handle file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      
      // Import rates from file
      const importedRates = await RateImportService.importFromExcel(file);
      
      // Update repository
      rateRepository.setRates(importedRates);
      
      // Update state
      dispatch({ type: 'SET_RATES', payload: importedRates });
      
      alert(`Successfully imported ${importedRates.length} rates`);
    } catch (error) {
      console.error('Error importing rates:', error);
      alert('Error importing rates. Please check console for details.');
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rate Management</h1>
        
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Filter rates..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64"
          />
          <div className="relative">
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileImport}
              className="sr-only"
              id="rate-file-import"
              disabled={isImporting}
            />
            <label htmlFor="rate-file-import">
              <Button 
                variant="outline" 
                className="cursor-pointer"
                disabled={isImporting}
              >
                {isImporting ? 'Importing...' : 'Import Rates'}
              </Button>
            </label>
          </div>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Lender</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Repayment</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>LVR Range</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Comparison</TableHead>
              <TableHead>Features</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>{rate.productName}</TableCell>
                <TableCell>{rate.lender}</TableCell>
                <TableCell>
                  {rate.productType === 'variable' 
                    ? 'Variable' 
                    : `Fixed ${rate.productType.split('_')[1]} Year`}
                </TableCell>
                <TableCell>
                  {rate.repaymentType === 'principal_and_interest' 
                    ? 'P&I' 
                    : 'IO'}
                </TableCell>
                <TableCell>
                  {rate.borrowerType === 'owner_occupier'
                    ? 'Owner'
                    : 'Investor'}
                </TableCell>
                <TableCell>{rate.lvrRange.replace('_', '-')}%</TableCell>
                <TableCell className="font-medium">{rate.rate.toFixed(2)}%</TableCell>
                <TableCell>{rate.comparisonRate.toFixed(2)}%</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    {rate.hasOffset && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        Offset
                      </span>
                    )}
                    {rate.hasRedraw && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Redraw
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

## 7. Integration with Loan Calculator

First, let's create a hook to easily use rates in the loan calculator:

```typescript
// hooks/useLoanRates.ts

import { useState, useEffect } from 'react';
import { useRates } from '@/context/RateContext';
import { RateConfiguration } from '@/types/rates';

interface LoanRatesOptions {
  loanAmount: number;
  propertyValue: number;
  isFirstHomeBuyer?: boolean;
  isInvestor?: boolean;
  hasOffset?: boolean;
}

export const useLoanRates = ({
  loanAmount,
  propertyValue,
  isFirstHomeBuyer = false,
  isInvestor = false,
  hasOffset = false
}: LoanRatesOptions) => {
  const { state, dispatch, findEligibleRates, findBestRate, getAssessmentRate } = useRates();
  const [lvr, setLvr] = useState(0);
  const [eligibleRates, setEligibleRates] = useState<RateConfiguration[]>([]);
  const [bestRate, setBestRate] = useState<RateConfiguration | null>(null);
  const [assessmentRate, setAssessmentRate] = useState(0);
  
  // Update preferences when props change
  useEffect(() => {
    dispatch({ 
      type: 'SET_PREFERENCE', 
      payload: { 
        isFirstHomeBuyer, 
        borrowerType: isInvestor ? 'investor' : 'owner_occupier',
        hasOffset
      } 
    });
  }, [isFirstHomeBuyer, isInvestor, hasOffset, dispatch]);
  
  // Update LVR when loan amount or property value changes
  useEffect(() => {
    if (propertyValue > 0) {
      const newLvr = (loanAmount / propertyValue) * 100;
      setLvr(newLvr);
    } else {
      setLvr(0);
    }
  }, [loanAmount, propertyValue]);
  
  // Update eligible rates when LVR changes
  useEffect(() => {
    if (lvr > 0) {
      const rates = findEligibleRates(loanAmount, lvr);
      setEligibleRates(rates);
      
      const best = findBestRate(loanAmount, lvr);
      setBestRate(best);
      
      if (best) {
        const assessment = getAssessmentRate(best.rate);
        setAssessmentRate(assessment);
      }
    }
  }, [lvr, loanAmount, findEligibleRates, findBestRate, getAssessmentRate]);
  
  return {
    lvr,
    eligibleRates,
    bestRate,
    assessmentRate,
    preferences: state.preferences,
    setProductType: (productType: any) => 
      dispatch({ type: 'SET_PREFERENCE', payload: { productType } }),
    setRepaymentType: (repaymentType: any) => 
      dispatch({ type: 'SET_PREFERENCE', payload: { repaymentType } })
  };
};
```

Now, let's update the Loan Calculator component:

```tsx
// components/LoanCalculator.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/utils/currency';
import { calculatePayment } from '@/utils/finance';
import { useLoanRates } from '@/hooks/useLoanRates';
import { RateSelector } from '@/components/RateSelector';

interface LoanCalculatorProps {
  defaultPropertyValue?: number;
  defaultDeposit?: number;
  defaultIsFirstHomeBuyer?: boolean;
  defaultIsInvestor?: boolean;
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({
  defaultPropertyValue = 750000,
  defaultDeposit = 150000,
  defaultIsFirstHomeBuyer = false,
  defaultIsInvestor = false
}) => {
  // State for inputs
  const [propertyValue, setPropertyValue] = useState(defaultPropertyValue);
  const [deposit, setDeposit] = useState(defaultDeposit);
  const [isFirstHomeBuyer, setIsFirstHomeBuyer] = useState(defaultIsFirstHomeBuyer);
  const [isInvestor, setIsInvestor] = useState(defaultIsInvestor);
  const [hasOffset, setHasOffset] = useState(false);
  const [loanTerm, setLoanTerm] = useState(30);
  const [showRateSelector, setShowRateSelector] = useState(false);
  
  // Calculate loan amount
  const loanAmount = Math.max(0, propertyValue - deposit);
  
  // Use the loan rates hook
  const { 
    lvr, 
    eligibleRates, 
    bestRate, 
    assessmentRate,
    preferences,
    setProductType,
    setRepaymentType
  } = useLoanRates({
    loanAmount,
    propertyValue,
    isFirstHomeBuyer,
    isInvestor,
    hasOffset
  });
  
  // Calculate monthly payment
  const monthlyPayment = bestRate ? calculatePayment({
    principal: loanAmount,
    annualInterestRate: bestRate.rate,
    termYears: loanTerm
  }) : 0;
  
  // Calculate assessment payment (for serviceability)
  const assessmentPayment = bestRate ? calculatePayment({
    principal: loanAmount,
    annualInterestRate: assessmentRate,
    termYears: loanTerm
  }) : 0;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loan Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="property-value">Property Value</Label>
                <CurrencyInput
                  id="property-value"
                  value={propertyValue}
                  onChange={setPropertyValue}
                />
              </div>
              
              <div>
                <Label htmlFor="deposit">Deposit</Label>
                <CurrencyInput
                  id="deposit"
                  value={deposit}
                  onChange={setDeposit}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="first-home-buyer">First Home Buyer</Label>
                <Switch
                  id="first-home-buyer"
                  checked={isFirstHomeBuyer}
                  onCheckedChange={setIsFirstHomeBuyer}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="investor">Investment Property</Label>
                <Switch
                  id="investor"
                  checked={isInvestor}
                  onCheckedChange={setIsInvestor}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="offset">Include Offset Account</Label>
                <Switch
                  id="offset"
                  checked={hasOffset}
                  onCheckedChange={setHasOffset}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="loan-term">Loan Term</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    id="loan-term"
                    value={[loanTerm]}
                    min={1}
                    max={30}
                    step={1}
                    onValueChange={(values) => setLoanTerm(values[0])}
                  />
                  <span className="w-12 text-right">{loanTerm} yr</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded space-y-3">
                <div className="flex justify-between">
                  <span>Loan Amount:</span>
                  <span className="font-bold">{formatCurrency(loanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>LVR:</span>
                  <span className="font-bold">{lvr.toFixed(1)}%</span>
                </div>
                
                {bestRate ? (
                  <>
                    <div className="flex justify-between">
                      <span>Interest Rate:</span>
                      <span className="font-bold">{bestRate.rate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Repayment:</span>
                      <span className="font-bold">{formatCurrency(monthlyPayment)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Assessment Rate:</span>
                      <span>{assessmentRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Assessment Repayment:</span>
                      <span>{formatCurrency(assessmentPayment)}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-2 text-yellow-600">
                    No eligible rates found for this scenario.
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => setShowRateSelector(!showRateSelector)}
                variant="outline"
                className="w-full"
              >
                {showRateSelector ? 'Hide Rate Options' : 'View All Rate Options'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showRateSelector && (
        <Card>
          <CardContent className="pt-6">
            <RateSelector
              loanAmount={loanAmount}
              lvr={lvr}
              onRateSelect={(rate) => {
                // Update preferences to match selected rate
                setProductType(rate.productType);
                setRepaymentType(rate.repaymentType);
                setHasOffset(rate.hasOffset);
                setShowRateSelector(false);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

## 8. Integration with Borrowing Power Calculator

```tsx
// components/BorrowingPowerCalculator.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRates } from '@/context/RateContext';
import { formatCurrency } from '@/utils/currency';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculatePV } from '@/utils/finance';

export const BorrowingPowerCalculator: React.FC = () => {
  // State for form inputs
  const [income, setIncome] = useState(90000);
  const [incomeFrequency, setIncomeFrequency] = useState('annual');
  const [expenses, setExpenses] = useState(20000);
  const [expenseFrequency, setExpenseFrequency] = useState('annual');
  const [existingDebt, setExistingDebt] = useState(0);
  const [existingDebtFrequency, setExistingDebtFrequency] = useState('monthly');
  const [creditCardLimit, setCreditCardLimit] = useState(0);
  const [dependents, setDependents] = useState(0);
  const [state, setState] = useState('NSW');
  const [isFirstHomeBuyer, setIsFirstHomeBuyer] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);
  const [loanTerm, setLoanTerm] = useState(30);
  
  // Get rates and assessment rate
  const { getAssessmentRate } = useRates();
  
  // Results state
  const [maxBorrowing, setMaxBorrowing] = useState(0);
  const [assessmentRate, setAssessmentRate] = useState(0);
  const [monthlyRepayment, setMonthlyRepayment] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);
  
  // Calculate monthly values based on frequencies
  const getMonthlyValue = (amount: number, frequency: string): number => {
    switch (frequency) {
      case 'weekly': return amount * 52 / 12;
      case 'fortnightly': return amount * 26 / 12;
      case 'monthly': return amount;
      case 'annual': return amount / 12;
      default: return amount;
    }
  };
  
  // Handle calculation
  const handleCalculate = () => {
    // Convert to monthly values
    const monthlyIncome = getMonthlyValue(income, incomeFrequency);
    const monthlyExpenses = getMonthlyValue(expenses, expenseFrequency);
    const monthlyDebt = getMonthlyValue(existingDebt, existingDebtFrequency);
    
    // Credit card commitment (3.8% of limit)
    const monthlyCreditCardCommitment = creditCardLimit * 0.038;
    
    // Calculate monthly disposable income
    const monthlyDisposable = monthlyIncome - monthlyExpenses - monthlyDebt - monthlyCreditCardCommitment;
    
    // Get assessment rate (base rate + buffer)
    // We'll use 5.5% as a base rate for simplicity
    const baseRate = 5.5;
    const newAssessmentRate = getAssessmentRate(baseRate);
    setAssessmentRate(newAssessmentRate);
    
    // Calculate maximum loan amount using PV function
    const maxLoan = calculatePV(
      monthlyDisposable, 
      newAssessmentRate, 
      loanTerm * 12
    );
    
    // Calculate monthly repayment at the base rate
    const repayment = monthlyDisposable;
    
    // Update results
    setMaxBorrowing(maxLoan);
    setMonthlyRepayment(repayment);
    setIsCalculated(true);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Borrowing Power Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Form contents from the previous implementation... */}
          <div className="mt-6">
            <Button 
              onClick={handleCalculate}
              className="w-full"
            >
              Calculate Borrowing Power
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isCalculated && (
        <Card>
          <CardHeader>
            <CardTitle>Your Borrowing Power Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Maximum Borrowing Power</h3>
                <p className="text-3xl font-bold text-primary mb-2">
                  {formatCurrency(maxBorrowing)}
                </p>
                <p className="text-sm text-gray-600">
                  This is the maximum amount you could borrow based on your income,
                  expenses, and current assessment rates.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Monthly Repayment</h3>
                <p className="text-3xl font-bold text-primary mb-2">
                  {formatCurrency(monthlyRepayment)}
                </p>
                <p className="text-sm text-gray-600">
                  This is your estimated maximum monthly repayment amount based on
                  your disposable income.
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
              <h4 className="font-medium mb-2">Details</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>Assessment Rate:</div>
                <div className="text-right font-medium">{assessmentRate.toFixed(2)}%</div>
                
                <div>Loan Term:</div>
                <div className="text-right font-medium">{loanTerm} years</div>
              </div>
              <p className="mt-4">
                This calculation uses an assessment rate that includes a buffer above
                the standard variable rate to ensure you can still make repayments if
                interest rates increase.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

## 9. Implementation Schedule

The implementation should be done in phases:

### Phase 1: Core Rate Infrastructure (Week 1)
1. Create types and interfaces in `types/rates.ts`
2. Implement `RateRepository` service
3. Create default rate data
4. Write unit tests for repository

### Phase 2: Data Import and Management (Week 2)
1. Implement `RateImportService` for Excel data
2. Create `RateContext` provider
3. Set up admin interface for rate management
4. Test import functionality with MCF rates data

### Phase 3: Loan Calculator Integration (Week 3)
1. Create `useLoanRates` hook
2. Implement `RateSelector` component
3. Update loan calculator to use new rate system
4. Test with various loan scenarios

### Phase 4: Borrowing Power Integration (Week 4)
1. Update borrowing power calculator to use the rate system
2. Test different borrowing scenarios
3. Implement assessment rate rules

### Phase 5: Finalization (Week 5)
1. Complete testing across all components
2. Optimize performance
3. Create documentation
4. Deployment

## 10. Testing Plan

### Unit Tests
1. **Rate Repository Tests**
   - Test finding eligible rates with various criteria
   - Test calculating assessment rates
   - Test finding best rates

2. **Rate Import Tests**
   - Test transforming Excel data
   - Test mapping functions
   - Test error handling

### Integration Tests
1. **Rate Context Tests**
   - Test state management
   - Test preference updates
   - Test interaction with repository

2. **Calculator Integration Tests**
   - Test loan calculator integration
   - Test borrowing power integration
   - Test UI state updates

### User Acceptance Tests
1. **Admin Interface**
   - Test uploading MCF rates
   - Test filtering and searching
   - Test rate updates

2. **Calculator Functionality**
   - Test different loan scenarios
   - Test first home buyer scenarios
   - Test investor scenarios

3. **UI/UX Testing**
   - Test responsiveness
   - Test accessibility
   - Test user flow

### Performance Testing
1. **Import Performance**
   - Test large Excel file imports
   - Optimize for speed

2. **Calculation Performance**
   - Test complex rate scenarios
   - Optimize filtering and calculations

### Security Testing
1. **Data Validation**
   - Test input validation
   - Test Excel file validation

2. **Error Handling**
   - Test error messaging
   - Test fallback mechanisms