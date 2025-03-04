import { useState, useCallback } from 'react';
import { 
  getBestRate, 
  getAllAvailableRates, 
  getRatesByLenderName,
  convertOldRateTypesToNew,
  calculateAssessmentRate,
  getDefaultRate,
  getDefaultComparisonRate,
  calculateMonthlyRepayment
} from '@/utils/rateService';
import { 
  LoanProductType, 
  RepaymentType, 
  BorrowerType, 
  RateConfiguration 
} from '@/types/rates';

/**
 * Custom hook for rate-related functionality
 * Provides a clean API for working with rates throughout the application
 */
export const useRates = () => {
  const [currentRate, setCurrentRate] = useState<number>(getDefaultRate());
  const [currentComparisonRate, setCurrentComparisonRate] = useState<number>(getDefaultComparisonRate());
  const [selectedRateConfig, setSelectedRateConfig] = useState<RateConfiguration | null>(null);

  /**
   * Find the best rate based on loan parameters
   */
  const findBestRate = useCallback((
    lvrPercentage: number,
    productType: LoanProductType,
    repaymentType: RepaymentType,
    borrowerType: BorrowerType,
    loanAmount: number,
    isFirstHomeBuyer: boolean = false,
    hasOffset: boolean = false,
    hasRedraw: boolean = false
  ): RateConfiguration | null => {
    const bestRate = getBestRate(
      lvrPercentage,
      productType,
      repaymentType,
      borrowerType,
      loanAmount,
      isFirstHomeBuyer,
      hasOffset,
      hasRedraw
    );

    if (bestRate) {
      setCurrentRate(bestRate.rate);
      setCurrentComparisonRate(bestRate.comparisonRate);
      setSelectedRateConfig(bestRate);
    } else {
      setCurrentRate(getDefaultRate());
      setCurrentComparisonRate(getDefaultComparisonRate());
      setSelectedRateConfig(null);
    }

    return bestRate;
  }, []);

  /**
   * Find the best rate using old rate system parameters
   */
  const findBestRateFromOldParams = useCallback((
    lvrPercentage: number | string,
    interestRateType: string,
    repaymentType: string,
    loanPurpose: string,
    featureType: string,
    loanAmount: number,
    isFirstHomeBuyer: boolean = false,
    fixedPeriod?: number
  ): RateConfiguration | null => {
    const { 
      productType, 
      newRepaymentType, 
      borrowerType, 
      hasOffset, 
      hasRedraw 
    } = convertOldRateTypesToNew(
      interestRateType,
      repaymentType,
      loanPurpose,
      featureType,
      fixedPeriod
    );

    // Convert lvrPercentage to number if it's a string
    const lvrNumber = typeof lvrPercentage === 'string' ? parseFloat(lvrPercentage) : lvrPercentage;

    return findBestRate(
      lvrNumber,
      productType,
      newRepaymentType,
      borrowerType,
      loanAmount,
      isFirstHomeBuyer,
      hasOffset,
      hasRedraw
    );
  }, [findBestRate]);

  /**
   * Calculate monthly repayment amount
   */
  const getMonthlyRepayment = useCallback((
    loanAmount: number,
    interestRate: number = currentRate,
    loanTermYears: number
  ): number => {
    return calculateMonthlyRepayment(loanAmount, interestRate, loanTermYears);
  }, [currentRate]);

  /**
   * Calculate assessment rate (base rate + buffer)
   */
  const getAssessmentRate = useCallback((
    baseRate: number = currentRate,
    buffer: number = 3.0
  ): number => {
    return calculateAssessmentRate(baseRate, buffer);
  }, [currentRate]);

  /**
   * Get all available rates
   */
  const getAllRates = useCallback((): RateConfiguration[] => {
    return getAllAvailableRates();
  }, []);

  /**
   * Get rates by lender
   */
  const getRatesByLender = useCallback((lender: string): RateConfiguration[] => {
    return getRatesByLenderName(lender);
  }, []);

  return {
    currentRate,
    currentComparisonRate,
    selectedRateConfig,
    findBestRate,
    findBestRateFromOldParams,
    getMonthlyRepayment,
    getAssessmentRate,
    getAllRates,
    getRatesByLender,
    defaultRate: getDefaultRate(),
    defaultComparisonRate: getDefaultComparisonRate()
  };
}; 