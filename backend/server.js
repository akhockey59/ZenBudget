
/* 
  ZenBudget Backend Server
  To run this:
  1. Install nodejs
  2. Create a package.json: npm init -y
  3. Install deps: npm install express mongoose cors dotenv
  4. Run: node server.js
*/

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zenbudget')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Schema
const UserDataSchema = new mongoose.Schema({
  expenses: { type: Object, default: {} },
  notes: { type: Object, default: {} },
  customBudgets: { type: Object, default: {} },
  defaultMonthlyBudget: { type: Number, default: 3100 },
  themeColor: { type: String, default: 'violet' },
  isDarkMode: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

// We'll use a single document for this personal app demo
const UserData = mongoose.model('UserData', UserDataSchema);

// Routes
app.get('/api/data', async (req, res) => {
  try {
    let data = await UserData.findOne();
    if (!data) {
      data = new UserData();
      await data.save();
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const { data } = req.body;
    // Find first doc or create
    let doc = await UserData.findOne();
    if (!doc) {
      doc = new UserData(data);
    } else {
      // Update fields
      doc.expenses = data.expenses;
      doc.notes = data.notes;
      doc.customBudgets = data.customBudgets;
      doc.defaultMonthlyBudget = data.defaultMonthlyBudget;
      doc.themeColor = data.themeColor;
      doc.isDarkMode = data.isDarkMode;
      doc.updatedAt = new Date();
    }
    await doc.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
