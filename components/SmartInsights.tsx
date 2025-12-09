import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppState } from '../types';
import { Card3D } from './ui/Card3D';

interface SmartInsightsProps {
  data: AppState;
  currentYear: number;
}

export const SmartInsights: React.FC<SmartInsightsProps> = ({ data, currentYear }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    if (!process.env.API_KEY) {
        setInsight("Please configure the API_KEY in the environment to use AI features.");
        return;
    }
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const expenses = Object.entries(data.expenses)
        .filter(([date]) => date.startsWith(String(currentYear)))
        .slice(-30); 
        
      const contextStr = JSON.stringify(expenses);
      const name = data.displayName || "the user";
      
      const prompt = `
        You are a financial advisor for ${name}. Here is their recent expense data (Date: Amount in ₹ INR) for a monthly budget of roughly ₹3100.
        Expenses cover food, travel, and movies only.
        Data: ${contextStr}.
        Analyze the spending pattern. Are they on track to stay under ₹3100 this month? Give 1 short, actionable tip in 2 sentences max. Address them by name.
        Ensure any monetary values in your response are prefixed with the Indian Rupee symbol (₹).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setInsight(response.text);
    } catch (err) {
      console.error(err);
      setInsight("Could not generate insights at the moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card3D className="bg-surface border-border border relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-16 translate-x-10 pointer-events-none group-hover:bg-primary/20 transition-all duration-500" />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </span>
            Smart Insights
          </h3>
          <p className="text-muted text-xs leading-relaxed max-w-[200px]">
            AI-powered spending analysis and budget tips.
          </p>
        </div>
        <button
          onClick={generateInsight}
          disabled={loading}
          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 rounded-lg text-xs font-medium transition-all disabled:opacity-50 hover:shadow-lg"
        >
          {loading ? 'Analyzing...' : 'Generate'}
        </button>
      </div>
      
      {insight && (
        <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-primary/20 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed animate-float relative">
           <div className="absolute left-0 top-0 w-0.5 h-full bg-primary/50 rounded-l-lg"></div>
           {insight}
        </div>
      )}
    </Card3D>
  );
};