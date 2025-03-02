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

export const STAMP_DUTY_RATES: Record<string, StampDutyRates> = {
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
      concessionRate: 0.5, // 50% discount
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
      concessionRate: 0.25, // 25% discount
    }
  },
  QLD: {
    standard: [
      { threshold: 0, rate: 0.01 },
      { threshold: 175000, rate: 0.02, baseAmount: 1750 },
      { threshold: 540000, rate: 0.0375, baseAmount: 9075 },
      { threshold: 1000000, rate: 0.045, baseAmount: 26775 },
    ],
    firstHomeBuyer: {
      exemptionThreshold: 500000,
      concessionThreshold: 550000,
      concessionRate: 0.3, // 30% discount
    }
  },
  WA: {
    standard: [
      { threshold: 0, rate: 0.019 },
      { threshold: 120000, rate: 0.0285, baseAmount: 2280 },
      { threshold: 360000, rate: 0.0305, baseAmount: 9105 },
      { threshold: 725000, rate: 0.0515, baseAmount: 20330 },
    ],
    firstHomeBuyer: {
      exemptionThreshold: 430000,
      concessionThreshold: 530000,
      concessionRate: 0.4, // 40% discount
    }
  },
  SA: {
    standard: [
      { threshold: 0, rate: 0.01 },
      { threshold: 50000, rate: 0.02, baseAmount: 500 },
      { threshold: 200000, rate: 0.03, baseAmount: 3500 },
      { threshold: 250000, rate: 0.035, baseAmount: 5000 },
      { threshold: 500000, rate: 0.055, baseAmount: 13750 },
    ],
    firstHomeBuyer: {
      exemptionThreshold: 0, // No specific exemption
      concessionThreshold: 0,
      concessionRate: 0, // No specific concession
    }
  },
  TAS: {
    standard: [
      { threshold: 0, rate: 0.0175 },
      { threshold: 100000, rate: 0.0225, baseAmount: 1750 },
      { threshold: 200000, rate: 0.035, baseAmount: 4000 },
      { threshold: 500000, rate: 0.045, baseAmount: 14500 },
    ],
    firstHomeBuyer: {
      exemptionThreshold: 0, // No full exemption
      concessionThreshold: 500000,
      concessionRate: 0.5, // 50% discount up to $500,000
    }
  },
  ACT: {
    standard: [
      { threshold: 0, rate: 0.016 },
      { threshold: 200000, rate: 0.0242, baseAmount: 3200 },
      { threshold: 300000, rate: 0.0332, baseAmount: 5620 },
      { threshold: 500000, rate: 0.0412, baseAmount: 12260 },
      { threshold: 750000, rate: 0.0512, baseAmount: 22560 },
      { threshold: 1000000, rate: 0.0612, baseAmount: 35310 },
      { threshold: 1455000, rate: 0.0712, baseAmount: 63020 },
    ],
    firstHomeBuyer: {
      exemptionThreshold: 750000, // Exempt if income below threshold and property below $750,000
      concessionThreshold: 750000,
      concessionRate: 1.0, // 100% discount
    }
  },
  NT: {
    standard: [
      { threshold: 0, rate: 0.015 },
      { threshold: 525000, rate: 0.0375, baseAmount: 7875 },
      { threshold: 3000000, rate: 0.0575, baseAmount: 101175 },
    ],
    firstHomeBuyer: {
      exemptionThreshold: 500000,
      concessionThreshold: 650000,
      concessionRate: 0.5, // 50% discount
    }
  }
};

// Helper function to calculate duty using progressive rates
export function calculateProgressiveDuty(value: number, thresholds: StampDutyThreshold[]): number {
  // Find the applicable threshold
  let applicableThreshold = thresholds[0];
  
  for (let i = 1; i < thresholds.length; i++) {
    if (value >= thresholds[i].threshold) {
      applicableThreshold = thresholds[i];
    } else {
      break;
    }
  }
  
  // Calculate duty
  const { threshold, rate, baseAmount = 0 } = applicableThreshold;
  return baseAmount + (value - threshold) * rate;
}

export const calculateStampDuty = (
  value: number, 
  state: string, 
  isFirstHomeBuyer: boolean,
  isInvestor: boolean = false
): number => {
  // Default to NSW if state not found
  const stateRates = STAMP_DUTY_RATES[state] || STAMP_DUTY_RATES['NSW'];
  
  // First home buyer exemptions and concessions
  if (isFirstHomeBuyer) {
    const { exemptionThreshold, concessionThreshold, concessionRate } = stateRates.firstHomeBuyer;
    
    // Full exemption
    if (value <= exemptionThreshold) return 0;
    
    // Partial concession
    if (value <= concessionThreshold && concessionRate) {
      // Calculate standard duty then apply concession
      const standardDuty = calculateProgressiveDuty(value, stateRates.standard);
      return standardDuty * (1 - concessionRate);
    }
  }
  
  // Standard calculation for owner-occupiers and investors
  // Note: In most states, investors pay the same rates as owner-occupiers
  return calculateProgressiveDuty(value, stateRates.standard);
}; 