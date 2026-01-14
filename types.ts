
export enum LeadTemperature {
  COLD = 'Cold',
  WARM = 'Warm',
  HOT = 'Hot'
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  role: string;
  score: number;
  temperature: LeadTemperature;
  lastSignal: string;
  lastSignalTime: string;
  intentSummary: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  justification: string;
  action: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Invest' | 'Cut' | 'Scale' | 'Pause';
}

export interface StrategySnapshot {
  maturity: number;
  risks: string[];
  strategicPaths: string[];
}
