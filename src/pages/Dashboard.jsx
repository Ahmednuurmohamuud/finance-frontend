import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../services/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import api from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#3B82F6", "#22C55E", "#FACC15", "#F97316", "#A855F7", "#EF4444"];

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(true);

  // Toast welcome once, 3 seconds duration
  useEffect(() => {
    if (user && showToast) {
      toast.success(`Welcome back, ${user.username}!`, {
        duration: 2000,
        position: "top-right",
        style: {
          background: '#1F2937',
          color: '#fff',
        }
      });
      setShowToast(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, accRes, catRes, budgetRes] = await Promise.all([
          api.get("/transactions/"),
          api.get("/accounts/"),
          api.get("/categories/"),
          api.get("/budgets/"),
        ]);

        setTransactions(txRes.data.results);
        setAccounts(accRes.data.results);
        setCategories(catRes.data.results);
        setBudgets(budgetRes.data.results);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Maps for easy lookup
  const accountMap = accounts.reduce((acc, a) => {
    acc[a.id] = a.name;
    return acc;
  }, {});

  const categoryMap = categories.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  // Prepare chart data
  const incomeExpensesData = [];
  const spendingCategoriesData = [];
  const categoryTotals = {};

  transactions.forEach((tx) => {
    const month = new Date(tx.transaction_date).toLocaleString("default", { month: "short" });
    let monthObj = incomeExpensesData.find((d) => d.month === month);
    if (!monthObj) {
      monthObj = { month, income: 0, expenses: 0 };
      incomeExpensesData.push(monthObj);
    }
    if (tx.type === "Income") monthObj.income += parseFloat(tx.amount);
    if (tx.type === "Expense") monthObj.expenses += parseFloat(tx.amount);

    if (tx.type === "Expense" && tx.category) {
      const name = categoryMap[tx.category] || "Unknown";
      if (!categoryTotals[name]) categoryTotals[name] = 0;
      categoryTotals[name] += parseFloat(tx.amount);
    }
  });

  for (const [name, value] of Object.entries(categoryTotals)) {
    spendingCategoriesData.push({ name, value });
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="animate-pulse flex flex-col items-center">
        <div className="rounded-full bg-indigo-200 h-12 w-12 mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-32"></div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <Toaster />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center space-x-3 bg-white py-2 px-4 rounded-xl shadow-sm">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{user?.username}</p>
            <p className="text-xs text-gray-500">Welcome back!</p>
          </div>
        </div>
      </div>

      {/* Top Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Income vs Expenses</h2>
            <div className="flex space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                <span className="text-xs text-gray-600">Income</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span className="text-xs text-gray-600">Expenses</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incomeExpensesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#22c55e" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#22c55e' }}
                activeDot={{ r: 6, fill: '#16a34a' }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#ef4444' }}
                activeDot={{ r: 6, fill: '#dc2626' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Account Balances */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Account Balances</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={accounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']}
              />
              <Bar 
                dataKey="balance" 
                fill="#3b82f6" 
                radius={[6, 6, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-4 rounded-xl border border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-white transition-all">
                <span className="text-gray-700 font-medium">{acc.name}</span>
                <span className="font-bold text-gray-800">${parseFloat(acc.balance).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Spending Categories */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Spending Categories</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendingCategoriesData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {spendingCategoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Budget Overview</h2>
            {/* <button className="text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-1 px-3 rounded-lg transition-colors">
              Manage
            </button> */}
          </div>
          <div className="space-y-6">
            {budgets.map((b) => {
              const percent = Math.round((b.used_amount / b.amount) * 100) || 0;
              const progressColor = percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-yellow-500' : 'bg-green-500';
              
              return (
                <div key={b.id} className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">{b.category?.name || "Unknown"}</span>
                    <span className="font-medium text-gray-800">
                      ${b.used_amount || 0} / ${b.amount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div
                      className={`h-2.5 rounded-full ${progressColor} transition-all`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">{percent}% spent</span>
                    <span className="text-gray-600">
                      ${b.amount - (b.used_amount || 0)} remaining
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {budgets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No budgets set up yet</p>
              {/* <button className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-all font-medium">
                Create Budget
              </button> */}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
          <button className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
            View All →
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.slice(0, 10).map((t, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-4 hover:bg-gray-50 px-2 rounded-lg transition-all"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg mr-4 ${parseFloat(t.amount) > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {parseFloat(t.amount) > 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-4-4m4 4l4-4" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{t.description || "No description"}</p>
                  <p className="text-sm text-gray-500">
                    {categoryMap[t.category] || "No Category"} • {accountMap[t.account] || "Unknown Account"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    parseFloat(t.amount) > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {parseFloat(t.amount) > 0 ? "+" : ""}
                  ${parseFloat(t.amount).toFixed(2)}
                </p>
                <p className="text-sm text-gray-400">{new Date(t.transaction_date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}