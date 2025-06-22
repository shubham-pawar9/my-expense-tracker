export interface User {
  uid: string;
  email: string;
  displayName?: string;
  monthlyIncome?: number;
  fixedExpenses?: number;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: Date;
}

export interface ExpenseCategory {
  name: string;
  color: string;
  icon: string;
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}

export interface MonthlySummary {
  totalExpenses: number;
  totalIncome: number;
  savings: number;
  expensesByCategory: ChartData[];
} 