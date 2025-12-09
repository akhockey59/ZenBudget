
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { DayCalculation, MonthlySummary } from '../types';
import { getMonthlySummary } from '../services/logic';
import { Card3D } from './ui/Card3D';
import { SmartInsights } from './SmartInsights';
import { AppState } from '../types';

interface DashboardProps {
  year: number;
  data: Record<string, DayCalculation>;
  fullState: AppState;
  onChangeYear: (y: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ year, data, fullState, onChangeYear }) => {
  const monthlySummaries: MonthlySummary[] = [];
  for (let i = 1; i <= 12; i++) {
    monthlySummaries.push(getMonthlySummary(year, i, fullState, data));
  }

  const dailyTrend = (Object.values(data) as DayCalculation[])
    .filter(d => d.date.startsWith(String(year)))
    .sort((a,b) => a.date.localeCompare(b.date));

  // Calculated Totals
  const totalDailySpent = monthlySummaries.reduce((acc, cur) => acc + cur.totalDailySpent, 0);
  const totalFixedSpent = monthlySummaries.reduce((acc, cur) => acc + cur.totalFixedSpent, 0);
  const totalBudget = monthlySummaries.reduce((acc, cur) => acc + cur.budget, 0);
  const totalGrandSpent = totalDailySpent + totalFixedSpent;
  const totalYearlySavings = totalBudget - totalDailySpent;
  
  const remainingDailyBudget = monthlySummaries.reduce((acc, cur) => acc + cur.remaining, 0);
  
  // Greeting Logic
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const name = fullState.displayName ? fullState.displayName.split(' ')[0] : 'Friend';

  return (
    <div className="max-w-6xl mx-auto pb-32 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
            {timeGreeting}, {name}
          </h1>
          <p className="text-muted text-sm">Here is your financial overview for {year}.</p>
        </div>
        <div className="flex bg-surface p-1 rounded-lg border border-border">
          {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
            <button
              key={y}
              onClick={() => onChangeYear(y)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                year === y ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Daily Budget Status */}
        <Card3D className="bg-surface border-border">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-success/10 rounded-lg text-success">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
             </div>
             <span className={`text-xs font-medium px-2 py-1 rounded-full ${remainingDailyBudget >= 0 ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400' : 'bg-danger/10 text-danger'}`}>
                Daily Limit
             </span>
          </div>
          <p className="text-muted text-xs font-medium uppercase tracking-wider">Remaining Daily Budget</p>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mt-1 tracking-tight">
            ₹{remainingDailyBudget.toLocaleString()}
          </h2>
          <div className="mt-3 w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
             {/* This bar shows % of Daily Budget Used */}
             <div 
               className={`h-full ${remainingDailyBudget < 0 ? 'bg-danger' : 'bg-success'}`} 
               style={{ width: `${Math.min(((totalBudget - remainingDailyBudget)/totalBudget)*100, 100)}%`}}
             />
          </div>
        </Card3D>

        {/* Card 2: Fixed Expenses (Separate from Daily) */}
        <Card3D className="bg-surface border-border">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
             </div>
             <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                Extra / Fixed
             </span>
          </div>
          <p className="text-muted text-xs font-medium uppercase tracking-wider">Fixed Expenses Total</p>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mt-1 tracking-tight">
            ₹{totalFixedSpent.toLocaleString()}
          </h2>
          <p className="text-muted text-xs mt-2">Rent, SIPs, Travel (Excluded from Daily)</p>
        </Card3D>

        {/* Card 3: AI Insights */}
        <SmartInsights data={fullState} currentYear={year} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-soft">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Monthly Expense Breakdown</h3>
             <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Daily</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Fixed</div>
             </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySummaries} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                <XAxis 
                    dataKey="month" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickFormatter={(val) => new Date(0, val-1).toLocaleString('default',{month:'short'})} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                />
                <YAxis 
                    stroke="#71717a" 
                    fontSize={12} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                    cursor={{fill: 'currentColor', opacity: 0.1}}
                    contentStyle={{ 
                      backgroundColor: 'rgb(var(--surface-color))', 
                      borderColor: 'rgb(var(--border-color))', 
                      borderRadius: '8px',
                      color: 'rgb(var(--text-main))'
                    }}
                    itemStyle={{ fontSize: '12px' }}
                    labelStyle={{ color: 'rgb(var(--text-muted))', fontSize: '12px', marginBottom: '4px' }}
                    formatter={(value: number, name: string) => [`₹${value.toLocaleString()}`, name]}
                />
                <Bar dataKey="totalDailySpent" name="Daily Lifestyle" stackId="a" fill="rgb(var(--primary))" radius={[0, 0, 2, 2]} maxBarSize={20} />
                <Bar dataKey="totalFixedSpent" name="Fixed Obligations" stackId="a" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-soft">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Cumulative Daily Spending</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" hide />
                <YAxis 
                    stroke="#71717a" 
                    fontSize={12} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                   contentStyle={{ 
                      backgroundColor: 'rgb(var(--surface-color))', 
                      borderColor: 'rgb(var(--border-color))', 
                      borderRadius: '8px',
                      color: 'rgb(var(--text-main))'
                    }}
                   labelStyle={{ color: 'rgb(var(--text-muted))', fontSize: '12px' }}
                   itemStyle={{ color: '#fb7185', fontSize: '12px' }}
                   formatter={(value: number) => [`₹${value.toLocaleString()}`, "Daily Cumulative"]}
                />
                <Area 
                    type="monotone" 
                    dataKey="cumulativeSpent" 
                    stroke="#fb7185" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSpent)" 
                    name="Daily Spent" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Yearly Spending Summary - SEPARATED COLUMNS */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Yearly Overview ({year})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* LEFT COLUMN: Lifestyle / Daily */}
             <div className="bg-zinc-50 dark:bg-zinc-900 border border-border rounded-xl p-5">
                 <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-primary"></div>
                     Lifestyle / Daily Expenses
                 </h4>
                 <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Total Budget</p>
                        <p className="text-lg font-bold text-zinc-900 dark:text-white">₹{totalBudget.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Total Spent</p>
                        <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">₹{totalDailySpent.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Savings</p>
                        <p className={`text-lg font-bold ${totalYearlySavings >= 0 ? 'text-success' : 'text-danger'}`}>
                            {totalYearlySavings >= 0 ? '+' : ''}₹{totalYearlySavings.toLocaleString()}
                        </p>
                    </div>
                 </div>
             </div>

             {/* RIGHT COLUMN: Fixed / Bills */}
             <div className="bg-zinc-50 dark:bg-zinc-900 border border-border rounded-xl p-5">
                 <h4 className="text-sm font-bold text-orange-500 mb-4 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                     Fixed Obligations
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Total Fixed Spent</p>
                        <p className="text-lg font-bold text-orange-500">₹{totalFixedSpent.toLocaleString()}</p>
                        <p className="text-[10px] text-muted mt-1">Rent, Bills, Travel</p>
                    </div>
                    <div className="pl-4 border-l border-border border-dashed">
                         <p className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Grand Total Outflow</p>
                         <p className="text-lg font-bold text-zinc-900 dark:text-white">₹{totalGrandSpent.toLocaleString()}</p>
                         <p className="text-[10px] text-muted mt-1">Lifestyle + Fixed</p>
                    </div>
                 </div>
             </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-soft">
        <div className="px-6 py-4 border-b border-border">
             <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Detailed Monthly Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-muted uppercase text-xs font-semibold">
                    <tr>
                        <th className="px-6 py-3">Month</th>
                        <th className="px-6 py-3">Daily Budget</th>
                        <th className="px-6 py-3">Daily Spent</th>
                        <th className="px-6 py-3">Fixed Spent</th>
                        <th className="px-6 py-3 text-right">Daily Savings</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border text-zinc-700 dark:text-zinc-300">
                    {monthlySummaries.map((summary) => (
                        <tr key={summary.month} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium">
                                {new Date(year, summary.month - 1).toLocaleString('default', { month: 'long' })}
                            </td>
                            <td className="px-6 py-4">₹{summary.budget.toLocaleString()}</td>
                            <td className="px-6 py-4 text-primary font-medium">₹{summary.totalDailySpent.toLocaleString()}</td>
                            <td className="px-6 py-4 text-orange-500">₹{summary.totalFixedSpent.toLocaleString()}</td>
                            <td className={`px-6 py-4 text-right font-medium ${summary.remaining >= 0 ? 'text-success' : 'text-danger'}`}>
                                {summary.remaining >= 0 ? '+' : ''}₹{summary.remaining.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
