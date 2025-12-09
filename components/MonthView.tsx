
import React, { useMemo, useState, useEffect } from 'react';
import { DayCalculation, FixedExpenseItem } from '../types';
import { motion } from 'framer-motion';
import { FixedExpenses } from './FixedExpenses';

interface MonthViewProps {
  year: number;
  month: number;
  monthlyBudget: number;
  fixedBudget: number; // New Prop
  data: Record<string, DayCalculation>;
  fixedExpenses: FixedExpenseItem[];
  onUpdateExpense: (date: string, amount: number, note: string) => void;
  onUpdateBudget: (amount: number) => void;
  onUpdateFixedBudget: (amount: number) => void; // New Handler
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddFixedExpense: (monthKey: string, item: Omit<FixedExpenseItem, 'id' | 'date'>) => void;
  onDeleteFixedExpense: (monthKey: string, id: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ 
  year, month, monthlyBudget, fixedBudget, data, fixedExpenses, 
  onUpdateExpense, onUpdateBudget, onUpdateFixedBudget, onPrevMonth, onNextMonth,
  onAddFixedExpense, onDeleteFixedExpense
}) => {
  const [localBudget, setLocalBudget] = useState(monthlyBudget);
  const [localFixedBudget, setLocalFixedBudget] = useState(fixedBudget);

  // Sync local state when props change
  useEffect(() => {
    setLocalBudget(monthlyBudget);
  }, [monthlyBudget]);

  useEffect(() => {
    setLocalFixedBudget(fixedBudget);
  }, [fixedBudget]);

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  const days = useMemo(() => {
    return (Object.values(data) as DayCalculation[])
      .filter(d => d.date.startsWith(monthKey))
      .sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  }, [data, monthKey]);

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  
  // Daily Logic
  const lastDay = days.length > 0 ? days[days.length - 1] : null;
  const totalDailySpent = lastDay ? lastDay.cumulativeSpent : 0;
  const startBalance = days.length > 0 ? days[0].startBalance : 0;
  
  // Get calculated daily limit
  const dailyLimit = days.length > 0 ? days[0].dailyLimit : 0;
  
  const effectiveBudget = monthlyBudget + startBalance;
  const dailyRemaining = effectiveBudget - totalDailySpent;
  const dailyPercentUsed = Math.min((totalDailySpent / effectiveBudget) * 100, 100);

  // Fixed Expense Logic
  const totalFixed = fixedExpenses.reduce((acc, item) => acc + item.amount, 0);
  const fixedRemaining = fixedBudget - totalFixed;
  const fixedPercentUsed = Math.min((totalFixed / fixedBudget) * 100, 100);

  const grandTotalSpent = totalDailySpent + totalFixed;

  const handleBlur = (item: DayCalculation, e: React.FocusEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    if (!isNaN(newVal) && newVal !== item.spent) {
      onUpdateExpense(item.date, newVal, item.note || '');
    }
  };

  const handleNoteBlur = (item: DayCalculation, e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== item.note) {
      onUpdateExpense(item.date, item.spent, e.target.value);
    }
  };

  const handleBudgetBlur = () => {
    if (localBudget !== monthlyBudget) {
      onUpdateBudget(localBudget);
    }
  };

  const handleFixedBudgetBlur = () => {
    if (localFixedBudget !== fixedBudget) {
      onUpdateFixedBudget(localFixedBudget);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-32">
      {/* HEADER: Split into Daily Logic and Fixed Logic */}
      <div className="flex flex-col lg:flex-row items-stretch gap-6 mb-8">
        
        {/* LEFT: Daily Budget Section */}
        <div className="flex-1 bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1">
                <button onClick={onPrevMonth} className="hover:text-primary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap min-w-[100px] text-center">{monthName} {year}</span>
                <button onClick={onNextMonth} className="hover:text-primary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
             </div>
             
             <div className="flex items-center gap-2 group relative">
               <span className="text-[10px] font-medium text-muted bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-border cursor-help">
                 Target: ₹{Math.floor(dailyLimit).toLocaleString()}/day
               </span>
               <div className="absolute top-full mt-2 right-0 w-48 p-2 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Calculated as: Monthly Limit ÷ Days in Month. <br/>
                  (Ignores rollover debt/savings)
               </div>
               <span className="text-xs font-medium text-primary px-2 py-1 bg-primary/10 rounded-lg">Daily Cycle</span>
             </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-around">
              {/* Daily Rollover */}
              {startBalance !== 0 && (
                <div className="flex flex-col items-center relative group">
                    <span className="text-[10px] text-muted uppercase font-bold tracking-wider cursor-help border-b border-dashed border-border">Daily Rollover</span>
                    <span className={`text-sm font-bold ${startBalance < 0 ? 'text-danger' : 'text-success'}`}>
                      {startBalance > 0 ? '+' : ''}₹{startBalance.toLocaleString()}
                    </span>
                    <div className="absolute bottom-full mb-2 w-40 p-2 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                        Unspent daily allowance from previous months.
                    </div>
                </div>
              )}

              {/* Editable Base Budget */}
              <div className="flex flex-col items-center group cursor-pointer relative">
                  <span className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                    Monthly Limit
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </span>
                  <div className="flex items-center">
                    <span className="text-muted text-sm mr-0.5">₹</span>
                    <input 
                      type="number"
                      value={localBudget}
                      onChange={(e) => setLocalBudget(parseFloat(e.target.value) || 0)}
                      onBlur={handleBudgetBlur}
                      className="w-16 bg-transparent text-xl font-bold text-zinc-900 dark:text-white focus:outline-none p-0 border-b border-dashed border-transparent hover:border-zinc-300 focus:border-primary text-center no-spinner transition-all"
                    />
                  </div>
              </div>

              {/* Operator */}
              <div className="text-muted opacity-30 text-xl font-light">-</div>

              {/* Daily Spent */}
              <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Daily Spent</span>
                  <span className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
                    ₹{totalDailySpent.toLocaleString()}
                  </span>
              </div>

              {/* Operator */}
              <div className="text-muted opacity-30 text-xl font-light">=</div>

              {/* Daily Remaining */}
              <div className="flex flex-col items-center bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Remaining</span>
                  <span className={`text-2xl font-bold ${dailyRemaining < 0 ? 'text-danger' : 'text-success'}`}>
                    ₹{dailyRemaining.toLocaleString()}
                  </span>
              </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 relative h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden w-full">
            <motion.div 
                className={`absolute top-0 left-0 h-full ${dailyRemaining < 0 ? 'bg-danger' : 'bg-primary'}`}
                initial={{ width: 0 }}
                animate={{ width: `${dailyPercentUsed}%` }}
                transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* RIGHT: Fixed / Extra Expenses Section */}
        <div className="lg:w-1/3 bg-zinc-50 dark:bg-zinc-900/50 border border-border border-dashed rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
               <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
            </div>
            
            <div className="flex items-center justify-between mb-2 relative z-10">
               <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg">Extra / Fixed</span>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 relative z-10">
                <div className="grid grid-cols-3 w-full text-center gap-2 items-end">
                    {/* Fixed Budget Edit */}
                    <div className="flex flex-col items-center group cursor-pointer">
                        <span className="text-[9px] text-muted uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                            Limit
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </span>
                        <div className="flex items-center justify-center">
                            <span className="text-muted text-xs mr-0.5">₹</span>
                            <input 
                              type="number"
                              value={localFixedBudget}
                              onChange={(e) => setLocalFixedBudget(parseFloat(e.target.value) || 0)}
                              onBlur={handleFixedBudgetBlur}
                              className="w-14 bg-transparent text-lg font-bold text-zinc-600 dark:text-zinc-400 focus:outline-none p-0 border-b border-dashed border-transparent hover:border-zinc-300 focus:border-orange-500 text-center no-spinner transition-all"
                            />
                        </div>
                    </div>
                    
                    {/* Fixed Spent */}
                    <div>
                        <span className="text-[9px] text-muted uppercase font-bold tracking-wider mb-1 block">Spent</span>
                        <span className="text-xl font-bold text-zinc-900 dark:text-white block">
                            ₹{totalFixed.toLocaleString()}
                        </span>
                    </div>

                    {/* Fixed Remaining */}
                    <div>
                         <span className="text-[9px] text-muted uppercase font-bold tracking-wider mb-1 block">Left</span>
                         <span className={`text-lg font-bold ${fixedRemaining < 0 ? 'text-danger' : 'text-zinc-500'}`}>
                            {fixedRemaining < 0 ? '-' : ''}₹{Math.abs(fixedRemaining).toLocaleString()}
                         </span>
                    </div>
                </div>
            </div>
            
             {/* Fixed Progress Bar */}
             <div className="mt-4 relative h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden w-full z-10">
                <motion.div 
                    className={`absolute top-0 left-0 h-full ${fixedRemaining < 0 ? 'bg-danger' : 'bg-orange-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${fixedPercentUsed}%` }}
                    transition={{ duration: 0.8 }}
                />
             </div>
            
             <div className="mt-3 pt-3 border-t border-border w-full flex justify-between items-center text-xs text-muted z-10">
                 <span>Grand Total Outflow:</span>
                 <span className="font-semibold text-zinc-900 dark:text-zinc-200">₹{grandTotalSpent.toLocaleString()}</span>
             </div>
        </div>
      </div>

      {/* DAILY GRID */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-soft mb-8">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-border text-xs font-semibold text-muted uppercase tracking-wider">
            <div className="col-span-1">Day</div>
            <div className="col-span-3 text-right">Daily Spend</div>
            <div className="col-span-3 text-right">Cumulative</div>
            <div className="col-span-2 text-right">Balance</div>
            <div className="col-span-3 pl-4">Note</div>
        </div>

        <div className="divide-y divide-border">
            {days.map((day, idx) => (
            <motion.div 
                key={day.date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.01 }}
                className={`
                group grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors
                ${day.date === new Date().toISOString().split('T')[0] ? 'bg-primary/5' : ''}
                `}
            >
                {/* Mobile Label / Day */}
                <div className="col-span-1 flex justify-between md:block items-center">
                    <span className="text-muted text-sm md:hidden">Date</span>
                    <div className="flex flex-col">
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono font-medium text-sm">{String(day.dayOfMonth).padStart(2, '0')}</span>
                        <span className="text-[10px] text-muted md:hidden">{monthName}</span>
                    </div>
                </div>

                {/* Input Area */}
                <div className="col-span-3 flex justify-between md:justify-end items-center">
                     <span className="text-muted text-sm md:hidden">Spent</span>
                     <div className="relative group/input">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs transition-colors group-focus-within/input:text-primary">₹</span>
                        <input 
                            type="number"
                            defaultValue={day.spent === 0 ? '' : day.spent}
                            placeholder="-"
                            onBlur={(e) => handleBlur(day, e)}
                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                            className={`w-24 bg-zinc-100 dark:bg-zinc-900 border border-border rounded-lg pl-6 pr-3 py-1.5 text-right focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono text-sm placeholder-muted
                                ${
                                  day.spent > day.dailyLimit && day.spent > 0 
                                  ? 'text-danger font-semibold' 
                                  : day.spent > 0 
                                    ? 'text-success font-semibold' 
                                    : 'text-zinc-900 dark:text-zinc-200'
                                }
                            `}
                        />
                     </div>
                </div>

                {/* Cumulative */}
                <div className="col-span-3 flex justify-between md:justify-end items-center">
                   <span className="text-muted text-sm md:hidden">Total</span>
                   <span className="text-zinc-500 dark:text-zinc-400 font-mono text-sm">₹{day.cumulativeSpent.toLocaleString()}</span>
                </div>

                {/* Remaining */}
                <div className="col-span-2 flex justify-between md:justify-end items-center">
                   <span className="text-muted text-sm md:hidden">Balance</span>
                   <span className={`font-mono font-medium text-sm px-2 py-0.5 rounded ${
                       day.remainingBalance < 0 
                       ? 'bg-danger/10 text-danger' 
                       : 'bg-success/10 text-success'
                   }`}>
                     ₹{day.remainingBalance.toLocaleString()}
                   </span>
                </div>

                {/* Note */}
                <div className="col-span-3 md:pl-4 mt-2 md:mt-0">
                  <input
                    type="text"
                    placeholder="Add note..."
                    defaultValue={day.note}
                    onBlur={(e) => handleNoteBlur(day, e)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="w-full bg-transparent text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 dark:placeholder-zinc-700 text-sm focus:text-zinc-900 dark:focus:text-zinc-100 focus:outline-none transition-colors truncate"
                  />
                </div>
            </motion.div>
            ))}
        </div>
      </div>

      {/* Visual Separation */}
      <div className="flex items-center gap-4 mb-8 opacity-50">
        <div className="h-px bg-border flex-1"></div>
        <span className="text-xs font-semibold text-muted uppercase tracking-widest">Fixed / Extra Expenses</span>
        <div className="h-px bg-border flex-1"></div>
      </div>

      {/* FIXED EXPENSES SECTION */}
      <FixedExpenses 
        monthKey={monthKey}
        items={fixedExpenses}
        onAdd={onAddFixedExpense}
        onDelete={onDeleteFixedExpense}
      />
    </div>
  );
};
