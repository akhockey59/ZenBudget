
export interface DailyData {
  date: string; // YYYY-MM-DD
  spent: number;
  note?: string;
}

export interface MonthConfig {
  year: number;
  month: number; // 1-12
  monthlyBudget: number;
}

export interface DayCalculation {
  date: string;
  dayOfMonth: number;
  spent: number;
  cumulativeSpent: number;
  remainingBalance: number;
  note?: string;
  startBalance: number;
  dailyLimit: number; // New field: (Budget + CarryOver) / DaysInMonth
}

export interface MonthlySummary {
  year: number;
  month: number;
  budget: number;
  totalDailySpent: number;
  totalFixedSpent: number;
  totalSpent: number;
  remaining: number;
  percentUsed: number;
}

export type ThemeColor = 'violet' | 'blue' | 'emerald' | 'rose' | 'amber';

export type FixedExpenseCategory = 'Grocery' | 'Travel' | 'Rent' | 'Bills' | 'Other';

export interface FixedExpenseItem {
  id: string;
  category: FixedExpenseCategory;
  amount: number;
  note: string;
  date: string; // ISO timestamp
}

export interface AppState {
  displayName?: string; // User's name for personalization
  expenses: Record<string, number>; // date -> amount
  notes: Record<string, string>; // date -> note
  customBudgets: Record<string, number>; // "YYYY-MM" -> monthlyAmount
  customFixedBudgets: Record<string, number>; // "YYYY-MM" -> monthlyFixedLimit
  monthlyFixedExpenses: Record<string, FixedExpenseItem[]>; // "YYYY-MM" -> List of fixed items
  defaultMonthlyBudget: number;
  defaultFixedBudget: number; // New default for fixed/extra expenses
  themeColor: ThemeColor;
  isDarkMode: boolean;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  MONTHLY = 'MONTHLY',
  SETTINGS = 'SETTINGS',
}
