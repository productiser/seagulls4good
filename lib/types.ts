export interface Lead {
  name: string;
  email: string | null;
  timestamp: string;
  outcome_type: 'voice' | 'action';
  action: string | null;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
}
