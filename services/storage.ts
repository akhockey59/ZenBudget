
import { AppState } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { User } from "firebase/auth";

export const INITIAL_STATE: AppState = {
  displayName: '',
  expenses: {},
  notes: {},
  customBudgets: {},
  monthlyFixedExpenses: {},
  defaultMonthlyBudget: 3100,
  themeColor: 'violet',
  isDarkMode: true,
};

// --- Firestore Sync Logic ---

/**
 * Ensures the user document exists in Firestore. 
 * If it's a new user, it creates the doc using INITIAL_STATE and the user's displayName.
 */
export const initializeUser = async (user: User) => {
  if (!user) return;
  
  const docRef = doc(db, "users", user.uid);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      // Create new user document
      const newState = {
        ...INITIAL_STATE,
        displayName: user.displayName || 'Friend', // Use Auth name or default
      };
      await setDoc(docRef, newState);
    } else {
        // Doc exists, but let's check if we need to fix the name
        const data = docSnap.data();
        if ((!data.displayName || data.displayName === 'Friend') && user.displayName) {
            await updateDoc(docRef, { displayName: user.displayName });
        }
    }
  } catch (e: any) {
    console.warn("⚠️ Firestore Initialization Warning:", e.message);
    if (e.message.includes("Cloud Firestore API") || e.code === 'permission-denied') {
        console.error("ACTION REQUIRED: Please Create Firestore Database in Firebase Console.");
    }
    // We swallow the error here so the app can continue in Offline Mode
  }
};

let debounceTimer: any = null;

export const saveUserData = async (userId: string, data: AppState) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  
  return new Promise<void>((resolve, reject) => {
    debounceTimer = setTimeout(async () => {
      try {
        await setDoc(doc(db, "users", userId), data, { merge: true });
        resolve();
      } catch (e: any) {
        console.error("Error saving user data:", e);
        reject(e);
      }
    }, 1000); // 1s debounce
  });
};

export const subscribeToUserData = (userId: string, onUpdate: (data: AppState) => void, onError?: (err: any) => void) => {
  const docRef = doc(db, "users", userId);
  // Returns unsubscribe function
  return onSnapshot(docRef, 
    (doc) => {
        if (doc.exists()) {
            onUpdate({ ...INITIAL_STATE, ...doc.data() } as AppState);
        } else if (!doc.metadata.fromCache) {
             // If doc doesn't exist on server, we might rely on local state or wait for initializeUser
        }
    }, 
    (error) => {
        console.error("Firestore Subscription Error:", error);
        if (onError) onError(error);
    }
  );
};

export const exportToCSV = (data: AppState, year: number) => {
  const rows = [['Date', 'Type', 'Category', 'Amount', 'Note']];
  
  // 1. Daily Expenses
  Object.keys(data.expenses).sort().forEach(date => {
    if (date.startsWith(String(year))) {
      rows.push([
        date,
        'Daily',
        'General',
        String(data.expenses[date]),
        data.notes[date] || ''
      ]);
    }
  });

  // 2. Fixed Expenses
  Object.keys(data.monthlyFixedExpenses).forEach(monthKey => {
      if (monthKey.startsWith(String(year))) {
          const items = data.monthlyFixedExpenses[monthKey];
          items.forEach(item => {
              rows.push([
                  monthKey, // Just month resolution
                  'Fixed',
                  item.category,
                  String(item.amount),
                  item.note
              ]);
          });
      }
  });

  const csvContent = "data:text/csv;charset=utf-8," 
    + rows.map(e => e.join(",")).join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `zenbudget_export_${year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
