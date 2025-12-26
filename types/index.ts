export interface User {
  uid: string;
  email: string;
  displayName?: string;
  monthlyIncome?: number;
  fixedExpenses?: number;
  fixedExpenseItems?: FixedExpenseItem[];
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: Date;
  isFixed?: boolean;
}

export interface FixedExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: string;
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

export interface MonthlyChartData {
  month: string;
  total: number;
  fixed: number;
  variable: number;
}

export interface MonthlySummary {
  totalExpenses: number;
  totalIncome: number;
  savings: number;
  fixedExpenses: number;
  variableExpenses: number;
  expensesByCategory: ChartData[];
}

export interface DateSelection {
  month: number;
  year: number;
}
