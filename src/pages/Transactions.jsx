// src/pages/Transactions.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Eye, Edit2, Trash2, Download, RefreshCcw, AlertCircle, Info, Undo2, Archive, Check, X, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const typeMap = {
  Income: "Income",
  Expense: "Expense",
  Transfer: "Transfer",
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, transaction: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'descending' });

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [filter, setFilter] = useState({
    account: "All",
    category: "All",
    type: "All",
    startDate: "",
    endDate: "",
  });

  const [formType, setFormType] = useState("Expense");

  // Helper functions with useCallback to prevent unnecessary recreations
  const getAccountName = useCallback((id) => accounts.find((a) => a.id === id)?.name || "—", [accounts]);
  const getCategoryName = useCallback((id) => categories.find((c) => c.id === id)?.name || "—", [categories]);

  const fetchTransactions = async () => {
    try {
      const txRes = await api.get("/transactions/");
      setTransactions(Array.isArray(txRes.data) ? txRes.data : txRes.data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch transactions");
    }
  };

  const fetchDeletedTransactions = async () => {
    try {
      const txRes = await api.get("/transactions/?deleted=true");
      setDeletedTransactions(Array.isArray(txRes.data) ? txRes.data : txRes.data.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch deleted transactions");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [accRes, catRes, curRes] = await Promise.all([
          api.get("/accounts/"),
          api.get("/categories/"),
          api.get("/currencies/"),
        ]);

        await fetchTransactions();
        setAccounts(Array.isArray(accRes.data) ? accRes.data : accRes.data.results || []);
        setCategories(Array.isArray(catRes.data) ? accRes.data : catRes.data.results || []);
        setCurrencies(Array.isArray(curRes.data) ? curRes.data : curRes.data.results || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data from API");
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Show alert function
  const showAlert = (message, type = "error") => {
    setAlert({ show: true, message, type });
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "" });
    }, 5000);
  };

  // Filter transactions
  const filtered = useMemo(() => {
    return (showDeleted ? deletedTransactions : transactions || []).filter((t) => {
      const accountId = t.account?.id || t.account;
      const categoryId = t.category?.id || t.category;

      const matchAccount = filter.account === "All" || accountId?.toString() === filter.account;
      const matchCategory = filter.category === "All" || categoryId?.toString() === filter.category;
      const matchType = filter.type === "All" || t.type === filter.type;
      const matchStart = !filter.startDate || new Date(t.transaction_date) >= new Date(filter.startDate);
      const matchEnd = !filter.endDate || new Date(t.transaction_date) <= new Date(filter.endDate);
      
      // Search filter
      const matchSearch = searchQuery === "" || 
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category?.name || getCategoryName(t.category))?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.account?.name || getAccountName(t.account))?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchAccount && matchCategory && matchType && matchStart && matchEnd && matchSearch;
    });
  }, [showDeleted, deletedTransactions, transactions, filter, searchQuery, getCategoryName, getAccountName]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    let sortableItems = [...filtered];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'date') {
          aValue = new Date(a.transaction_date);
          bValue = new Date(b.transaction_date);
        } else if (sortConfig.key === 'amount') {
          aValue = a.amount;
          bValue = b.amount;
        } else if (sortConfig.key === 'account') {
          aValue = a.account?.name || getAccountName(a.account);
          bValue = b.account?.name || getAccountName(b.account);
        } else if (sortConfig.key === 'category') {
          aValue = a.category?.name || getCategoryName(a.category);
          bValue = b.category?.name || getCategoryName(b.category);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filtered, sortConfig, getAccountName, getCategoryName]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Rest of the component remains the same...
  // Delete transaction with custom alert
  const handleDelete = async (id) => {
    const transaction = transactions.find(t => t.id === id);
    setDeleteConfirm({ show: true, id, transaction });
  };

  // Confirm deletion
  const confirmDelete = async () => {
    const { id } = deleteConfirm;
    try {
      await api.delete(`/transactions/${id}/`);
      setTransactions(transactions.filter((t) => t.id !== id));
      toast.success("Transaction deleted");
      // Refresh the deleted transactions list if we're viewing it
      if (showDeleted) {
        await fetchDeletedTransactions();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete transaction");
    } finally {
      setDeleteConfirm({ show: false, id: null, transaction: null });
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null, transaction: null });
  };

  // Restore transaction
  const handleRestore = async (id) => {
    try {
      await api.post(`/transactions/${id}/restore/`);
      setDeletedTransactions(deletedTransactions.filter((t) => t.id !== id));
      toast.success("Transaction restored successfully ✅");
      // Refresh the active transactions list
      await fetchTransactions();
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore transaction ❌");
    }
  };

  // Toggle between active and deleted transactions view
  const toggleView = async () => {
    if (!showDeleted) {
      await fetchDeletedTransactions();
    }
    setShowDeleted(!showDeleted);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    const selectedAccount = accounts.find(
      (a) => a.id.toString() === form.account.value
    );

    // Validation: Prevent using Savings for direct expenses
    if (formType === "Expense" && selectedAccount?.type === "Savings") {
      showAlert("Saving account cannot be used directly for expenses. Transfer required.");
      return;
    }

    // Validation: Check for empty account
    if ((formType === "Expense" || formType === "Transfer") && selectedAccount?.balance <= 0) {
      showAlert("Account-kaagu waa faaruq yahay. Fadlan lacag ku shubo (Income) si aad wax u dirtid.");
      return;
    }

    // Validation: Check for insufficient funds
    const amount = parseFloat(form.amount.value) || 0;
    if ((formType === "Expense" || formType === "Transfer") && selectedAccount?.balance < amount) {
      showAlert("Ma haysatid lacag ku filan. Fadlan hubi lacagta account-kaaga.");
      return;
    }

    const data = {
      account: form.account.value || undefined,
      target_account: formType === "Transfer" ? form.target_account.value || undefined : undefined,
      category: formType !== "Transfer" ? (form.category.value || null) : null,
      type: typeMap[formType] || "Expense",
      amount: amount,
      currency: form.currency.value || "USD",
      description: form.description.value || "",
      transaction_date: form.date.value || undefined,
    };

    try {
      let res;
      if (openModal === "add") {
        res = await api.post("/transactions/", data);
        setTransactions([...transactions, res.data]);
        toast.success("Transaction added");
      } else if (openModal === "edit" && selected) {
        res = await api.put(`/transactions/${selected.id}/`, data);
        setTransactions(transactions.map((t) => (t.id === selected.id ? res.data : t)));
        toast.success("Transaction updated");
      }
      setOpenModal(null);
    } catch (err) {
      console.error(err.response?.data || err);
      
      // Handle specific backend errors
      if (err.response?.data) {
        if (err.response.data.account) {
          showAlert(err.response.data.account[0]);
        } else if (err.response.data.non_field_errors) {
          showAlert(err.response.data.non_field_errors[0]);
        } else {
          showAlert("Transaction failed. Please check your inputs.");
        }
      } else {
        toast.error("Transaction failed");
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csv = [
      ["Date", "Description", "Category", "Account", "Amount", "Type", "Currency"],
      ...sortedTransactions.map((t) => [
        t.transaction_date,
        t.description,
        t.category?.name || getCategoryName(t.category),
        t.account?.name || getAccountName(t.account),
        t.amount,
        t.type,
        t.currency?.code || "USD",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = showDeleted ? "deleted_transactions.csv" : "transactions.csv";
    link.click();
  };

  const openForm = (type, tx = null) => {
    setSelected(tx);
    setFormType(tx?.type || "Expense");
    setOpenModal(type);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (error) return <p className="text-red-500 p-6">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Alert Banner */}
      {alert.show && (
        <div className={`fixed top-4 right-4 z-60 flex items-center p-4 mb-4 rounded-lg shadow-md ${
          alert.type === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-blue-50 text-blue-800 border border-blue-200"
        }`}>
          <AlertCircle className={`flex-shrink-0 w-5 h-5 ${alert.type === "error" ? "text-red-600" : "text-blue-600"}`} />
          <div className="ml-3 text-sm font-medium">
            {alert.message}
          </div>
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8"
            onClick={() => setAlert({ show: false, message: "", type: "" })}
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-black/50" onClick={cancelDelete} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Transaction</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Ma hubtaa in aad rabto in aad tirtirtid transaction-kan?
                </p>
                {deleteConfirm.transaction && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-left">
                    <p><strong>Date:</strong> {deleteConfirm.transaction.transaction_date}</p>
                    <p><strong>Description:</strong> {deleteConfirm.transaction.description || "—"}</p>
                    <p><strong>Amount:</strong> {deleteConfirm.transaction.amount} {deleteConfirm.transaction.currency?.code || "USD"}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-3 justify-center">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                onClick={cancelDelete}
              >
                <X size={16} className="mr-1" /> Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                onClick={confirmDelete}
              >
                <Check size={16} className="mr-1" /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {showDeleted ? "Deleted Transactions" : "Transactions"}
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleView}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showDeleted 
                  ? "bg-gray-600 text-white hover:bg-gray-700" 
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {showDeleted ? <Undo2 size={16} /> : <Archive size={16} />}
              {showDeleted ? "View Active" : "View Deleted"}
            </button>
            {!showDeleted && (
              <button
                onClick={() => openForm("add")}
                 className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 shadow-md hover:shadow-lg transition-all"
              >
                <Plus size={16} /> Add Transaction
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Filter size={16} /> Filters
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={filter.account}
                onChange={(e) => setFilter({ ...filter, account: e.target.value })}
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="All">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>

              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="All">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
                <option value="Transfer">Transfer</option>
              </select>

              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() =>
                  setFilter({ account: "All", category: "All", type: "All", startDate: "", endDate: "" })
                }
                className="bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-200 transition-colors"
              >
                <RefreshCcw size={16} /> Clear Filters
              </button>

              <button
                onClick={handleExportCSV}
                className="bg-green-100 px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-green-200 transition-colors"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {!showDeleted && (
        /* Account Balance Info */
        <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start border border-blue-100">
          <Info className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
          <p className="text-blue-800 text-sm">
            <strong className="font-semibold">Xusuusnow:</strong> Marka aad dooratay account-ka, hubi in uu lacag ku filan yahay 
            si aad wax kharaash ah u sameyso ama aad u gudbid. Account-yada Savings ma awoodaan in ay 
            bixiyaan kharaash toos ah.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {sortConfig.key === 'date' && (
                      sortConfig.direction === 'ascending' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('category')}
                >
                  <div className="flex items-center">
                    Category
                    {sortConfig.key === 'category' && (
                      sortConfig.direction === 'ascending' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('account')}
                >
                  <div className="flex items-center">
                    Account
                    {sortConfig.key === 'account' && (
                      sortConfig.direction === 'ascending' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('amount')}
                >
                  <div className="flex items-center">
                    Amount
                    {sortConfig.key === 'amount' && (
                      sortConfig.direction === 'ascending' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{t.transaction_date}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{t.description || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {t.category?.name || getCategoryName(t.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{t.account?.name || getAccountName(t.account)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-medium ${
                        t.type === "Income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.type === "Income" ? "+" : "-"}{Math.abs(t.amount)?.toLocaleString() || 0} {t.currency?.code || "USD"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openForm("view", t)} 
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      {!showDeleted && (
                        <>
                          <button 
                            onClick={() => handleDelete(t.id)} 
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      {showDeleted && (
                        <button 
                          onClick={() => handleRestore(t.id)} 
                          className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors flex items-center gap-1"
                          title="Restore transaction"
                        >
                          <Undo2 size={16} /> <span className="text-xs">Restore</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Info size={32} className="mb-2 text-gray-400" />
                      <p>{showDeleted ? "No deleted transactions found" : "No transactions found"}</p>
                      {!showDeleted && searchQuery && (
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenModal(null)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative z-10 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setOpenModal(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl transition-colors"
            >
              ✕
            </button>

            {(openModal === "add" || openModal === "edit") && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    {openModal === "add" ? "Add Transaction" : "Edit Transaction"}
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        name="date"
                        type="date"
                        defaultValue={selected?.transaction_date}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        name="description"
                        placeholder="Enter description"
                        defaultValue={selected?.description}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                      <select
                        name="account"
                        defaultValue={selected?.account?.id || selected?.account || ""}
                        required
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select Account</option>
                        {accounts.map((a) => (
                          <option
                            key={a.id}
                            value={a.id}
                            disabled={formType === "Expense" && a.type === "Savings"}
                          >
                            {a.name} ({a.type}) - Balance: {a.balance} {a.currency?.code || "USD"}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        defaultValue={selected?.amount || ""}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                        <option value="Transfer">Transfer</option>
                      </select>
                    </div>

                    {formType === "Transfer" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Account</label>
                        <select
                          name="target_account"
                          defaultValue={selected?.target_account?.id || ""}
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        >
                          <option value="">Select Target Account</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {formType !== "Transfer" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          name="category"
                          defaultValue={selected?.category?.id || selected?.category || ""}
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">No Category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select
                        name="currency"
                        defaultValue={selected?.currency?.code || "USD"}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        {currencies.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors mt-2 font-medium"
                    >
                      {openModal === "add" ? "Add" : "Save"} Transaction
                    </button>
                   </form>
                </div>
            )}

            {openModal === "view" && selected && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Transaction Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{selected.transaction_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium">{selected.description || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{selected.category?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account:</span>
                    <span className="font-medium">{selected.account?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className={`font-medium ${selected.type === "Income" ? "text-green-600" : "text-red-600"}`}>
                      {selected.type === "Income" ? "+" : "-"}{Math.abs(selected.amount)} {selected.currency?.code || "USD"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{selected.type}</span>
                  </div>
                  {selected.type === "Transfer" && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target Account:</span>
                      <span className="font-medium">{selected.target_account?.name || "—"}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}