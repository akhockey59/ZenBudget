
import React, { useState, useRef } from 'react';
import { FixedExpenseItem, FixedExpenseCategory } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";

interface FixedExpensesProps {
  monthKey: string;
  items: FixedExpenseItem[];
  onAdd: (monthKey: string, item: Omit<FixedExpenseItem, 'id' | 'date'>) => void;
  onDelete: (monthKey: string, id: string) => void;
}

export const FixedExpenses: React.FC<FixedExpensesProps> = ({ monthKey, items, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<FixedExpenseCategory>('Grocery');
  const [note, setNote] = useState('');
  
  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: FixedExpenseCategory[] = ['Grocery', 'Travel', 'Bills', 'Rent', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    onAdd(monthKey, {
      amount: parseFloat(amount),
      category,
      note
    });
    
    setAmount('');
    setNote('');
    setIsAdding(false);
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setIsAdding(true); // Open the form to show results
    setNote("Analyzing bill...");

    try {
      if (!process.env.API_KEY) {
        throw new Error("API Key missing");
      }

      // 1. Convert to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
             const result = reader.result as string;
             // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
             const base64 = result.split(',')[1];
             resolve(base64);
        };
        reader.onerror = error => reject(error);
      });

      // 2. Call Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze this image of a bill or receipt. 
        Extract the following:
        1. The TOTAL amount (find the final grand total).
        2. The most likely category from this list: [Grocery, Travel, Bills, Rent, Other].
        3. A very short note (e.g., vendor name like "Starbucks" or "DMart").
        
        Return ONLY a JSON object like this, do not add markdown formatting:
        { "amount": 1250, "category": "Grocery", "note": "DMart" }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64Data } },
            { text: prompt }
          ]
        }
      });

      // 3. Parse Response
      const text = response.text || "{}";
      // Clean up markdown if present (```json ... ```)
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(jsonStr);

      if (result.amount) setAmount(String(result.amount));
      if (result.category && categories.includes(result.category)) setCategory(result.category);
      if (result.note) setNote(result.note);

    } catch (err) {
      console.error("Scan failed", err);
      setNote("Scan failed. Please enter manually.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const totalFixed = items.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-soft mt-8 p-6">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        capture="environment" // Prefers rear camera on mobile
        onChange={handleFileChange}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
             <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>
             </span>
             Monthly Fixed Expenses
           </h3>
           <p className="text-xs text-muted mt-1">Grocery, Travel, and other bills. These are calculated separately from daily budget.</p>
        </div>
        <div className="text-right">
           <span className="text-xs font-semibold text-muted uppercase">Total Extra</span>
           <p className="text-xl font-bold text-zinc-900 dark:text-white">₹{totalFixed.toLocaleString()}</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 mb-6">
         {items.length === 0 && (
           <div className="text-center py-8 text-muted text-sm border-2 border-dashed border-border rounded-xl">
              No extra expenses added for this month.
           </div>
         )}
         <AnimatePresence>
            {items.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-border group"
              >
                 <div className="flex items-center gap-3">
                    <div className={`
                       w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                       ${item.category === 'Grocery' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                         item.category === 'Travel' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' :
                         'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}
                    `}>
                       {item.category[0]}
                    </div>
                    <div>
                       <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.category}</p>
                       {item.note && <p className="text-xs text-muted">{item.note}</p>}
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">₹{item.amount.toLocaleString()}</span>
                    <button 
                      onClick={() => onDelete(monthKey, item.id)}
                      className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                 </div>
              </motion.div>
            ))}
         </AnimatePresence>
      </div>

      {/* Add Form */}
      {isAdding ? (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-xl border border-border relative overflow-hidden"
          onSubmit={handleSubmit}
        >
           {isScanning && (
               <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                  <p className="text-xs font-medium text-primary animate-pulse">Reading Receipt...</p>
               </div>
           )}

           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="col-span-1">
                 <label className="text-[10px] text-muted font-bold uppercase">Category</label>
                 <select 
                   value={category} 
                   onChange={(e) => setCategory(e.target.value as FixedExpenseCategory)}
                   className="w-full bg-surface border border-border rounded-lg px-2 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                 >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
              <div className="col-span-1">
                 <label className="text-[10px] text-muted font-bold uppercase">Amount (₹)</label>
                 <input 
                   type="number" 
                   required
                   value={amount}
                   onChange={e => setAmount(e.target.value)}
                   className="w-full bg-surface border border-border rounded-lg px-2 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                   placeholder="0"
                 />
              </div>
              <div className="col-span-2">
                 <label className="text-[10px] text-muted font-bold uppercase">Note</label>
                 <input 
                   type="text" 
                   value={note}
                   onChange={e => setNote(e.target.value)}
                   className="w-full bg-surface border border-border rounded-lg px-2 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                   placeholder="Details..."
                 />
              </div>
           </div>
           <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs font-medium text-muted hover:text-zinc-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primaryHover"
              >
                Add Expense
              </button>
           </div>
        </motion.form>
      ) : (
        <div className="flex gap-3">
            <button 
            onClick={() => setIsAdding(true)}
            className="flex-1 py-3 border border-dashed border-border rounded-xl text-sm font-medium text-muted hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Add Manual Entry
            </button>
            <button 
            onClick={handleScanClick}
            className="flex-1 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-medium shadow-soft hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect width="10" height="8" x="7" y="8" rx="1"/></svg>
            Scan Bill / Receipt
            </button>
        </div>
      )}
    </div>
  );
};
