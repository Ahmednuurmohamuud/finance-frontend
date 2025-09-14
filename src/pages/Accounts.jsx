import React, { useState, useEffect } from "react";
import { Plus, Eye, Trash2, Wallet, Banknote, PiggyBank, CreditCard, TrendingUp, MoreVertical, Edit, Loader } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get("/accounts/");
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAccounts(data);
      } catch (err) {
        setError("Failed to fetch accounts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Delete account
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    
    try {
      await api.delete(`/accounts/${id}/`);
      setAccounts(accounts.filter((acc) => acc.id !== id));
      toast.success("Account deleted successfully");
    } catch (err) {
      toast.error("Failed to delete account");
      console.error(err);
    }
  };

  // Add account
  const handleAdd = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    const newAcc = {
      name: e.target.name.value,
      balance: Number(e.target.balance.value),
      type: e.target.type.value,
      currency: e.target.currency.value,
    };
    
    try {
      const res = await api.post("/accounts/", newAcc);
      setAccounts([...accounts, res.data]);
      toast.success("Account added successfully");
      setOpenModal(null);
    } catch (err) {
      toast.error("Failed to add account");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Icons per type
  const typeIcon = (type) => {
    switch (type) {
      case "Bank":
        return <Banknote className="h-5 w-5 text-blue-500" />;
      case "Savings":
        return <PiggyBank className="h-5 w-5 text-green-500" />;
      case "Credit Card":
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      case "Loan":
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      case "Investment":
        return <TrendingUp className="h-5 w-5 text-yellow-500" />;
      case "Cash":
        return <Wallet className="h-5 w-5 text-gray-500" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Calculate total balance
  const totalBalance = accounts.reduce((acc, account) => acc + (parseFloat(account.balance) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader className="h-8 w-8 text-indigo-600 animate-spin mb-2" />
          <p className="text-gray-500">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
          <p className="text-gray-500 mt-1">Manage your financial accounts and track balances</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setOpenModal("add");
          }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={20} /> Add Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Accounts</p>
              <h2 className="text-2xl font-bold text-gray-800 mt-1">{accounts.length}</h2>
            </div>
            <div className="bg-indigo-100 p-3 rounded-xl">
              <Wallet className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Net Worth</p>
              <h2 className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(totalBalance)}
              </h2>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Average Balance</p>
              <h2 className="text-2xl font-bold text-gray-800 mt-1">
                {accounts.length > 0 ? formatCurrency(totalBalance / accounts.length) : formatCurrency(0)}
              </h2>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Banknote className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No accounts yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first account</p>
          <button
            onClick={() => setOpenModal("add")}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition"
          >
            Add Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all border border-gray-100"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {typeIcon(acc.type)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{acc.name}</h3>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreVertical size={18} />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className={`text-2xl font-bold ${acc.balance < 0 ? "text-red-600" : "text-gray-800"}`}>
                    {formatCurrency(acc.balance, acc.currency)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {acc.type}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                      {acc.currency}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelected(acc);
                    setOpenModal("view");
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                >
                  <Eye size={16} /> Details
                </button>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="flex items-center justify-center gap-1 px-3 py-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setOpenModal(null)}
          />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10 animate-scaleIn">
            <button
              onClick={() => setOpenModal(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              ✕
            </button>

            {/* View account */}
            {openModal === "view" && selected && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {typeIcon(selected.type)}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{selected.name}</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm">Balance</p>
                    <p className={`text-2xl font-bold ${selected.balance < 0 ? "text-red-600" : "text-gray-800"}`}>
                      {formatCurrency(selected.balance, selected.currency)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Type</p>
                      <p className="font-medium">{selected.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Currency</p>
                      <p className="font-medium">{selected.currency}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-sm">Last Updated</p>
                    <p className="font-medium">{new Date(selected.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition">
                    <Edit size={16} className="inline mr-2" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(selected.id)}
                    className="flex-1 py-2.5 px-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition"
                  >
                    <Trash2 size={16} className="inline mr-2" /> Delete
                  </button>
                </div>
              </div>
            )}

            {/* Add account */}
            {openModal === "add" && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Account</h2>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input
                      name="name"
                      placeholder="e.g., Chase Checking"
                      required
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                    <input
                      name="balance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      defaultValue={0}
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                    <select 
                      name="type" 
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition appearance-none"
                      required
                    >
                      <option value="Bank">Bank Account</option>
                      <option value="Savings">Savings Account</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Loan">Loan</option>
                      <option value="Investment">Investment</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <input
                      name="currency"
                      placeholder="USD"
                      defaultValue="USD"
                      required
                      className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl mt-2 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {formLoading ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                        Adding Account...
                      </>
                    ) : (
                      "Add Account"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}