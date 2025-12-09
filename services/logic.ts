
import { AppState, DayCalculation, MonthlySummary } from '../types';

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

export const formatDate = (year: number, month: number, day: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Core Logic: Calculate monthly bucket with Carry Over logic
export const calculateYearData = (
  year: number,
  data: AppState
): Record<string, DayCalculation> => {
  const result: Record<string, DayCalculation> = {};
  
  let previousMonthBalance = 0;

  for (let month = 1; month <= 12; month++) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthlyBudget = data.customBudgets[monthKey] ?? data.defaultMonthlyBudget;
    const daysInMonth = getDaysInMonth(year, month);
    
    // Start Balance for this month includes leftovers from prev month
    // If it's Jan, we usually reset, but user requested carrying (or we can decide Jan starts fresh).
    // Let's assume Jan starts fresh for simplicity in Yearly view, OR carry from Dec of prev year if we had that data.
    // For this scope, let's carry forward strictly within the selected year.
    let startBalance = (month === 1) ? 0 : previousMonthBalance;

    let cumulativeSpent = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDate(year, month, day);
      const spent = data.expenses[dateKey] || 0;
      const note = data.notes[dateKey] || '';
      
      cumulativeSpent += spent;
      
      // Remaining for this month = (Budget + StartBalance) - SpentSoFar
      const remainingBalance = (monthlyBudget + startBalance) - cumulativeSpent;

      result[dateKey] = {
        date: dateKey,
        dayOfMonth: day,
        spent,
        cumulativeSpent,
        remainingBalance,
        note,
        startBalance: (day === 1) ? startBalance : 0 // Only relevant on day 1 for display
      };
    }
    
    // The final remaining balance of this month becomes the start balance for next month
    previousMonthBalance = (monthlyBudget + startBalance) - cumulativeSpent;
  }

  return result;
};

export const getMonthlySummary = (
  year: number,
  month: number,
  data: AppState,
  dailyData: Record<string, DayCalculation>
): MonthlySummary => {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const budget = data.customBudgets[monthKey] ?? data.defaultMonthlyBudget;
  
  const daysInMonth = getDaysInMonth(year, month);
  let totalDailySpent = 0;

  // 1. Sum Daily Expenses
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDate(year, month, day);
    const dayData = dailyData[dateKey];
    if (dayData) {
      totalDailySpent += dayData.spent;
    }
  }

  // 2. Sum Fixed Expenses (Grocery, Travel)
  const fixedItems = data.monthlyFixedExpenses[monthKey] || [];
  const totalFixedSpent = fixedItems.reduce((acc, item) => acc + item.amount, 0);

  const totalSpent = totalDailySpent + totalFixedSpent;

  return {
    year,
    month,
    budget,
    totalDailySpent,
    totalFixedSpent,
    totalSpent,
    remaining: budget - totalDailySpent, // Note: Fixed expenses usually don't deduct from Daily Budget, they are separate.
    percentUsed: budget > 0 ? (totalDailySpent / budget) * 100 : 0
  };
};
