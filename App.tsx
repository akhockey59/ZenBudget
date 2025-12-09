
import React, { useState, useEffect, useMemo } from 'react';
import { ViewMode, AppState, ThemeColor, FixedExpenseItem } from './types';
import { saveUserData, INITIAL_STATE, subscribeToUserData, initializeUser } from './services/storage';
import { calculateYearData } from './services/logic';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { MonthView } from './components/MonthView';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Ensure user exists in DB before we render or subscribe
        await initializeUser(currentUser);

        // Name Sync Check
        if (currentUser.displayName) {
           const userRef = doc(db, "users", currentUser.uid);
           getDoc(userRef).then((snap) => {
             if (snap.exists()) {
               const data = snap.data() as AppState;
               if (!data.displayName || data.displayName === 'Friend') {
                 console.log("Syncing display name from Auth to DB...");
                 updateDoc(userRef, { displayName: currentUser.displayName });
               }
             }
           });
        }
      }
      setUser(currentUser);
      setAuthLoading(false);
      
      // Reset state on logout
      if (!currentUser) {
        setAppState(INITIAL_STATE);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Subscription
  useEffect(() => {
    if (user) {
      setSyncStatus('syncing');
      const unsubscribe = subscribeToUserData(
        user.uid, 
        (data) => {
          setAppState(data);
          setSyncStatus('synced');
        },
        (error) => {
          console.error("Sync Error", error);
          setSyncStatus('error');
        }
      );
      return () => unsubscribe();
    }
  }, [user]);

  // 3. Theme Effect
  useEffect(() => {
    const root = document.documentElement;
    if (appState.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const classesToRemove = Array.from(root.classList).filter(c => c.startsWith('theme-'));
    root.classList.remove(...classesToRemove);
    root.classList.add(`theme-${appState.themeColor}`);
  }, [appState.themeColor, appState.isDarkMode]);

  // 4. Persistence
  const persistChanges = (newState: AppState) => {
    setAppState(newState);
    if (user) {
      setSyncStatus('syncing');
      saveUserData(user.uid, newState)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'));
    }
  };

  const calculatedData = useMemo(() => {
    return calculateYearData(year, appState);
  }, [year, appState]);

  const handleUpdateExpense = (date: string, amount: number, note: string) => {
    persistChanges({
      ...appState,
      expenses: { ...appState.expenses, [date]: amount },
      notes: { ...appState.notes, [date]: note }
    });
  };

  const handleUpdateDefaultBudget = (val: number) => {
    persistChanges({ ...appState, defaultMonthlyBudget: val });
  };
  
  const handleUpdateDefaultFixedBudget = (val: number) => {
    persistChanges({ ...appState, defaultFixedBudget: val });
  };

  const handleUpdateMonthBudget = (y: number, m: number, val: number) => {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    persistChanges({
      ...appState,
      customBudgets: { ...appState.customBudgets, [key]: val }
    });
  };

  const handleUpdateFixedBudget = (y: number, m: number, val: number) => {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    persistChanges({
        ...appState,
        customFixedBudgets: { ...appState.customFixedBudgets, [key]: val }
    });
  };

  const handleUpdateTheme = (theme: ThemeColor) => {
    persistChanges({ ...appState, themeColor: theme });
  };

  const handleToggleDarkMode = (isDark: boolean) => {
    persistChanges({ ...appState, isDarkMode: isDark });
  };

  const handleAddFixedExpense = (monthKey: string, item: Omit<FixedExpenseItem, 'id' | 'date'>) => {
    const newItem: FixedExpenseItem = {
      ...item,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };
    
    const existingItems = appState.monthlyFixedExpenses[monthKey] || [];
    
    persistChanges({
      ...appState,
      monthlyFixedExpenses: {
        ...appState.monthlyFixedExpenses,
        [monthKey]: [...existingItems, newItem]
      }
    });
  };

  const handleDeleteFixedExpense = (monthKey: string, id: string) => {
    const existingItems = appState.monthlyFixedExpenses[monthKey] || [];
    const newItems = existingItems.filter(i => i.id !== id);
    
    persistChanges({
      ...appState,
      monthlyFixedExpenses: {
        ...appState.monthlyFixedExpenses,
        [monthKey]: newItems
      }
    });
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const currentMonthKey = `${year}-${String(month).padStart(2, '0')}`;
  const currentMonthlyBudget = appState.customBudgets[currentMonthKey] ?? appState.defaultMonthlyBudget;
  const currentFixedBudget = appState.customFixedBudgets[currentMonthKey] ?? appState.defaultFixedBudget;
  const currentFixedExpenses = appState.monthlyFixedExpenses[currentMonthKey] || [];

  return (
    <div className="min-h-screen bg-background text-zinc-900 dark:text-zinc-50 selection:bg-primary selection:text-white overflow-x-hidden relative transition-colors duration-300">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none bg-background transition-colors duration-300">
         <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] opacity-40 animate-pulse-slow" />
         <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px] opacity-30" />
      </div>
      
      {/* Sync Status Indicator */}
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-soft text-xs font-medium transition-colors ${
         syncStatus === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-surface border-border text-muted'
      }`}>
        <span className={`w-2 h-2 rounded-full ${
          syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 
          syncStatus === 'error' ? 'bg-red-500' : 'bg-emerald-400'
        }`} />
        <span>
          {syncStatus === 'syncing' ? 'Syncing...' : 
           syncStatus === 'error' ? 'Offline / Error' : 'Saved'}
        </span>
      </div>

      <div className="container mx-auto px-4 pt-10 pb-28">
        {view === ViewMode.DASHBOARD && (
          <Dashboard 
            year={year} 
            data={calculatedData} 
            onChangeYear={setYear}
            fullState={appState}
          />
        )}

        {view === ViewMode.MONTHLY && (
          <MonthView 
            year={year} 
            month={month} 
            monthlyBudget={currentMonthlyBudget}
            fixedBudget={currentFixedBudget}
            data={calculatedData}
            fixedExpenses={currentFixedExpenses}
            onUpdateExpense={handleUpdateExpense}
            onUpdateBudget={(val) => handleUpdateMonthBudget(year, month, val)}
            onUpdateFixedBudget={(val) => handleUpdateFixedBudget(year, month, val)}
            onNextMonth={handleNextMonth}
            onPrevMonth={handlePrevMonth}
            onAddFixedExpense={handleAddFixedExpense}
            onDeleteFixedExpense={handleDeleteFixedExpense}
          />
        )}

        {view === ViewMode.SETTINGS && (
          <Settings 
            state={appState}
            year={year}
            onUpdateDefaultBudget={handleUpdateDefaultBudget}
            onUpdateDefaultFixedBudget={handleUpdateDefaultFixedBudget}
            onUpdateMonthBudget={handleUpdateMonthBudget}
            onUpdateTheme={handleUpdateTheme}
            onToggleDarkMode={handleToggleDarkMode}
          />
        )}
      </div>

      <Navbar currentView={view} setView={setView} />
    </div>
  );
};

export default App;
