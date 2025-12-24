/**
 * P0 Financial Allocator Flow
 *
 * Per MAB v1.0 Section 7.1:
 * "Applies EM allocation rules (Owner Pay, Taxes, Expenses, R&D, Savings, BTC split)."
 *
 * This flow implements the Elevated Movements financial allocation framework.
 */

export interface FinancialAllocatorInput {
  userId: string;
  amount: number;  // Total amount to allocate
  currency?: string;  // Defaults to 'USD'
  customRatios?: Partial<AllocationRatios>;  // Override default ratios
  includeBtc?: boolean;  // Whether to include BTC allocation (default: true)
  btcPrice?: number;  // Current BTC price for calculation
}

export interface AllocationRatios {
  ownerPay: number;
  taxes: number;
  expenses: number;
  rndGrowth: number;
  savings: number;
  btc: number;
}

export interface FinancialAllocatorOutput {
  userId: string;
  inputAmount: number;
  currency: string;
  allocations: {
    ownerPay: { amount: number; percentage: number };
    taxes: { amount: number; percentage: number };
    expenses: { amount: number; percentage: number };
    rndGrowth: { amount: number; percentage: number };
    savings: { amount: number; percentage: number };
    btc: { amount: number; percentage: number; btcAmount?: number };
  };
  totalAllocated: number;
  ratiosUsed: AllocationRatios;
  recommendations: string[];
  allocationDate: string;
}

// Default EM Allocation Ratios (from MAB v1.0)
const DEFAULT_EM_RATIOS: AllocationRatios = {
  ownerPay: 0.50,    // 50% - Owner compensation
  taxes: 0.15,       // 15% - Tax reserves
  expenses: 0.15,    // 15% - Operating expenses
  rndGrowth: 0.10,   // 10% - R&D and Growth
  savings: 0.05,     // 5%  - Emergency savings
  btc: 0.05,         // 5%  - Bitcoin accumulation
};

export async function runP0FinancialAllocator(
  input: FinancialAllocatorInput
): Promise<{ runId: string; data: FinancialAllocatorOutput }> {
  const runId = `fin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const currency = input.currency || 'USD';
  const includeBtc = input.includeBtc !== false;

  console.log(`[P0 Financial Allocator] Starting run ${runId} for ${input.userId}`);
  console.log(`[P0 Financial Allocator] Allocating ${currency} ${input.amount.toLocaleString()}`);

  // Merge custom ratios with defaults
  let ratios = { ...DEFAULT_EM_RATIOS };
  if (input.customRatios) {
    ratios = { ...ratios, ...input.customRatios };
  }

  // If BTC is disabled, redistribute to savings
  if (!includeBtc) {
    ratios.savings += ratios.btc;
    ratios.btc = 0;
  }

  // Validate ratios sum to 1.0
  const ratioSum = Object.values(ratios).reduce((sum, r) => sum + r, 0);
  if (Math.abs(ratioSum - 1.0) > 0.001) {
    console.warn(`[P0 Financial Allocator] Ratios sum to ${ratioSum}, normalizing...`);
    const normalizationFactor = 1.0 / ratioSum;
    Object.keys(ratios).forEach(key => {
      ratios[key as keyof AllocationRatios] *= normalizationFactor;
    });
  }

  // Calculate allocations
  const amount = input.amount;
  const allocations = {
    ownerPay: {
      amount: Math.round(amount * ratios.ownerPay * 100) / 100,
      percentage: ratios.ownerPay * 100,
    },
    taxes: {
      amount: Math.round(amount * ratios.taxes * 100) / 100,
      percentage: ratios.taxes * 100,
    },
    expenses: {
      amount: Math.round(amount * ratios.expenses * 100) / 100,
      percentage: ratios.expenses * 100,
    },
    rndGrowth: {
      amount: Math.round(amount * ratios.rndGrowth * 100) / 100,
      percentage: ratios.rndGrowth * 100,
    },
    savings: {
      amount: Math.round(amount * ratios.savings * 100) / 100,
      percentage: ratios.savings * 100,
    },
    btc: {
      amount: Math.round(amount * ratios.btc * 100) / 100,
      percentage: ratios.btc * 100,
      btcAmount: input.btcPrice
        ? Math.round((amount * ratios.btc / input.btcPrice) * 100000000) / 100000000  // Satoshi precision
        : undefined,
    },
  };

  const totalAllocated = Object.values(allocations).reduce((sum, a) => sum + a.amount, 0);

  // Generate recommendations based on amount
  const recommendations: string[] = [];

  if (amount < 1000) {
    recommendations.push('Consider focusing on owner pay and taxes for smaller amounts.');
  }

  if (amount >= 10000) {
    recommendations.push('Good allocation size. Ensure tax reserves are set aside immediately.');
  }

  if (ratios.btc > 0 && !input.btcPrice) {
    recommendations.push('BTC price not provided. Check current price before purchasing.');
  }

  if (ratios.savings < 0.05) {
    recommendations.push('Consider maintaining at least 5% in emergency savings.');
  }

  recommendations.push(`Total allocated: ${currency} ${totalAllocated.toLocaleString()}`);

  const output: FinancialAllocatorOutput = {
    userId: input.userId,
    inputAmount: amount,
    currency,
    allocations,
    totalAllocated,
    ratiosUsed: ratios,
    recommendations,
    allocationDate: new Date().toISOString(),
  };

  console.log(`[P0 Financial Allocator] Complete: ${runId}`, {
    inputAmount: amount,
    totalAllocated,
    btcAllocation: allocations.btc.amount,
  });

  return { runId, data: output };
}
