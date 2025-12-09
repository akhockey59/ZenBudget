import React, { useState } from 'react';
import { AppState, ThemeColor } from '../types';
import { exportToCSV } from '../services/storage';
import { Card3D } from './ui/Card3D';
import { auth } from '../services/firebase';

interface SettingsProps {
  state: AppState;
  onUpdateDefaultBudget: (val: number) => void;
  onUpdateMonthBudget: (year: number, month: number, val: number) => void;
  onUpdateTheme: (theme: ThemeColor) => void;
  onToggleDarkMode: (isDark: boolean) => void;
  year: number;
}

export const Settings: React.FC<SettingsProps> = ({ 
  state, onUpdateDefaultBudget, onUpdateMonthBudget, onUpdateTheme, onToggleDarkMode, year 
}) => {
  const [localDefault, setLocalDefault] = useState(state.defaultMonthlyBudget);
  
  const user = auth.currentUser;

  const themes: { id: ThemeColor; color: string; label: string }[] = [
    { id: 'violet', color: '#8b5cf6', label: 'Violet' },
    { id: 'blue', color: '#3b82f6', label: 'Blue' },
    { id: 'emerald', color: '#10b981', label: 'Emerald' },
    { id: 'rose', color: '#f43f5e', label: 'Rose' },
    { id: 'amber', color: '#f59e0b', label: 'Amber' },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-32 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Settings</h1>
        <p className="text-muted text-sm">Configure your budget preferences and appearance.</p>
      </div>

      <Card3D className="bg-surface border-border" noHover>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Account</h3>
        <div className="flex items-center justify-between">
           <div>
               <p className="text-sm font-medium text-zinc-900 dark:text-white">{user?.email}</p>
               <p className="text-xs text-muted">Synced with Firebase Cloud</p>
           </div>
           <button 
             onClick={() => auth.signOut()}
             className="px-4 py-2 text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
           >
             Sign Out
           </button>
        </div>
      </Card3D>

      <Card3D className="bg-surface border-border" noHover>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Appearance</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Dark Mode</p>
              <p className="text-xs text-muted">Switch between light and dark themes.</p>
            </div>
            <button 
              onClick={() => onToggleDarkMode(!state.isDarkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface ${state.isDarkMode ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="border-t border-border pt-4">
             <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 mb-3">Accent Color</p>
             <div className="flex gap-3">
               {themes.map((t) => (
                 <button
                   key={t.id}
                   onClick={() => onUpdateTheme(t.id)}
                   className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${state.themeColor === t.id ? 'ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110' : ''}`}
                   style={{ backgroundColor: t.color }}
                   title={t.label}
                 >
                   {state.themeColor === t.id && (
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"/></svg>
                   )}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </Card3D>

      <Card3D className="bg-surface border-border" noHover>
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div>
             <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Default Monthly Budget</h3>
             <p className="text-muted text-xs">This amount applies to all months unless overridden.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                <input 
                  type="number" 
                  value={localDefault}
                  onChange={(e) => setLocalDefault(Number(e.target.value))}
                  className="w-full sm:w-40 bg-zinc-100 dark:bg-zinc-900 border border-border rounded-lg pl-7 pr-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
            </div>
            <button 
              onClick={() => onUpdateDefaultBudget(localDefault)}
              className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Card3D>

      <div className="pt-4">
        <button 
          onClick={() => exportToCSV(state, year)}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-200 border border-border px-6 py-4 rounded-xl font-medium transition-all group shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-success transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export CSV Data
        </button>
      </div>
    </div>
  );
};
