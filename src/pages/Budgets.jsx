import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ totalBudgeted: 0, totalSpent: 0, remaining: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: "" });

  // Fetch budgets summary - wrapped in useCallback to prevent unnecessary recreations
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/budgets/summary/", {
        params: { month: filterMonth, year: filterYear },
      });
      const budgetsData = res.data.budgets || [];

      let totalBudgeted = 0, totalSpent = 0, remaining = 0;
      budgetsData.forEach(b => {
        totalBudgeted += b.budget_amount;
        totalSpent += b.total_spent;
        remaining += b.total_remaining;
      });

      setBudgets(budgetsData);
      setTotals({ totalBudgeted, totalSpent, remaining });
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch budgets");
      setLoading(false);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const openAddModal = () => {
    setEditingBudget(null);
    setModalOpen(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setModalOpen(true);
  };

  const confirmDelete = (budget) => {
    setDeleteConfirm({
      show: true,
      id: budget.id,
      name: budget.category_name || budget.category
    });
  };

  const deleteBudget = async (id) => {
    try {
      await api.delete(`/budgets/${id}/`);
      toast.success("Budget deleted successfully");
      fetchBudgets();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete budget");
    } finally {
      setDeleteConfirm({ show: false, id: null, name: "" });
    }
  };

  // -------------------- Delete Confirmation Modal --------------------
  const DeleteConfirmationModal = () => {
    if (!deleteConfirm.show) return null;

    return (
      <div className="fixed inset-0 bg-gray bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 text-white">
            <h2 className="text-xl font-bold">Confirm Deletion</h2>
          </div>
          
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the budget for <span className="font-semibold">"{deleteConfirm.name}"</span>? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setDeleteConfirm({ show: false, id: null, name: "" })}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteBudget(deleteConfirm.id)}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete Budget
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------- Budget Modal --------------------
  const BudgetModal = ({ isOpen, onClose, onSaved, budget }) => {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
      category: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: "",
      currency: "USD",
      rollover_enabled: false,
    });
    const [loadingModal, setLoadingModal] = useState(false);

    // Load categories
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const res = await api.get("/categories/");
          setCategories(res.data.results || []);
        } catch (error) {
          console.error(error);
        }
      };
      fetchCategories();
    }, []);

    // Populate form if editing
    useEffect(() => {
      if (budget) {
        setForm({
          category: budget.category_id || budget.category,
          month: budget.month,
          year: budget.year,
          amount: budget.budget_amount,
          currency: budget.currency || "USD",
          rollover_enabled: budget.rollover_enabled,
        });
      }
    }, [budget]);

    if (!isOpen) return null;

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoadingModal(true);
      try {
        if (budget) {
          await api.patch(`/budgets/${budget.id}/`, form);
          toast.success("Budget updated successfully");
        } else {
          await api.post("/budgets/", form);
          toast.success("Budget created successfully");
        }
        onSaved();
        onClose();
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.detail || "Failed to save budget");
      } finally {
        setLoadingModal(false);
      }
    };  

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
            <h2 className="text-xl font-bold">{budget ? "Edit Budget" : "Add Budget"}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <input
                  type="number"
                  name="month"
                  value={form.month}
                  onChange={handleChange}
                  min={1}
                  max={12}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  min={2000}
                  max={2100}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">SOS (sh)</option>
               
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rollover"
                name="rollover_enabled"
                checked={form.rollover_enabled}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rollover" className="ml-2 block text-sm text-gray-700">
                Enable Rollover
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loadingModal}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loadingModal ? "Processing..." : (budget ? "Update" : "Add")}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  // -------------------- End of Modal --------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
          <button 
            onClick={openAddModal}
           className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 shadow-md hover:shadow-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2"   viewBox="0 0 20 20" fill="currentColor" >
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Budget
          </button>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filter Budgets</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ].map((month, index) => (
                  <option key={index+1} value={index+1}>{month}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="self-end">
              <button 
                onClick={fetchBudgets} 
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Budgeted</p>
                <p className="text-2xl font-bold text-gray-900">${totals.totalBudgeted.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100 text-red-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">${totals.totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">${totals.remaining.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {budgets.length === 0 ? (
            <div className="p-10 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-5 text-lg font-medium text-gray-900">No budgets found</h3>
              <p className="mt-2 text-sm text-gray-500">Get started by creating a new budget.</p>
              <div className="mt-6">
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Budget
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount / Spent</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rollover</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {budgets.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{b.category_name || b.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{b.month}/{b.year}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${b.budget_amount.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">${b.total_spent.toFixed(2)} spent</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {b.currency || "USD"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${b.rollover_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {b.rollover_enabled ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openEditModal(b)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => confirmDelete(b)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Budget Modal */}
      {modalOpen && (
        <BudgetModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={fetchBudgets}
          budget={editingBudget}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </div>
  );
}