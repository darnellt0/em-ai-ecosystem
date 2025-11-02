export interface RevenueAllocation {
  date: Date;
  totalRevenue: number;
  allocations: {
    ownerPay: number;
    expenses: number;
    taxes: number;
    rdAndGrowth: number;
    savings: number;
  };
  btcPurchase?: {
    amount: number;
    price: number;
    date: Date;
  };
}

export interface GrantOpportunity {
  id: string;
  title: string;
  organization: string;
  amount: number;
  deadline: Date;
  eligibility: string[];
  missionAlignmentScore: number;
  successProbability: number;
  url: string;
  notes: string;
  status: 'discovered' | 'researching' | 'drafting' | 'submitted' | 'awarded' | 'declined';
}
