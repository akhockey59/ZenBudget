/**
 * Database Models (Schema Definitions)
 * 
 * Although the current implementation runs client-side using LocalStorage/IndexedDB,
 * these schemas represent how the data is structured for a MongoDB backend.
 */

export interface IUser {
  _id: string;
  email: string;
  preferences: {
    defaultMonthlyBudget: number;
    theme: 'light' | 'dark';
  };
}

export interface IExpense {
  _id: string;
  userId: string;
  date: Date;     // YYYY-MM-DD
  amount: number;
  category?: string;
  note?: string;
  createdAt: Date;
}

export interface IMonthlyBudget {
  _id: string;
  userId: string;
  year: number;
  month: number;
  budgetAmount: number; // Override default for specific month
}

// Mongoose-like Schema Definition for Reference

/*
const ExpenseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true, index: true },
  amount: { type: Number, required: true },
  note: { type: String, maxlength: 500 },
  category: { type: String, default: 'General' }
}, { timestamps: true });

const BudgetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  amount: { type: Number, required: true }
});

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  defaultBudget: { type: Number, default: 3100 }
});
*/
