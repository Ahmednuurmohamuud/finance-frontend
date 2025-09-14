// src/pages/Bills.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [open, setOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  const [formData, setFormData] = useState({
    account: "",
    category: "",
    name: "",
    amount: "",
    currency: "",
    type: "Expense",
    frequency: "Monthly",
    start_date: "",
    next_due_date: "",
    end_date: "",
    is_active: true,
  });

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [totalMonthly, setTotalMonthly] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);

  // Helper function to translate Somali error messages
  const translateError = (somaliMessage) => {
    const translations = {
      "Account-kaagu waa faaruq yahay. Fadlan lacag ku shubo si aad biilka u bixiso.": 
        "Your account has insufficient funds. Please deposit money to pay the bill.",
      "Lacagta account-ka kuma filna bixinta biilka.": 
        "Your account balance is not enough to pay this bill.",
      "Bill already paid": 
        "This bill has already been paid."
    };
    
    return translations[somaliMessage] || somaliMessage;
  };

  // 🔹 Calculate summary (helper)
  const calculateSummary = useCallback((billsData) => {
    const today = new Date();
    let monthlyTotal = 0;
    let overdue = 0;
    let upcoming = 0;

    billsData.forEach((bill) => {
      const nextDue = bill.next_due_date ? new Date(bill.next_due_date) : null;
      monthlyTotal += parseFloat(bill.amount || 0);
      if (bill.is_active && nextDue && !bill.is_paid) {
        if (nextDue < today) overdue += 1;
        else upcoming += 1;
      }
    });

    setTotalMonthly(monthlyTotal.toFixed(2));
    setOverdueCount(overdue);
    setUpcomingCount(upcoming);
  }, []);

  // 🔹 Fetch bills
  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/recurring-bills/");
      const billsData = Array.isArray(res.data.results) ? res.data.results : res.data;
      setBills(billsData);
      calculateSummary(billsData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  }, [calculateSummary]);

  // 🔹 Fetch dropdowns
  const fetchDropdowns = useCallback(async () => {
    try {
      const [accountsRes, categoriesRes, currenciesRes] = await Promise.all([
        api.get("/accounts/"),
        api.get("/categories/"),
        api.get("/currencies/"),
      ]);
      setAccounts(accountsRes.data.results || accountsRes.data || []);
      setCategories(categoriesRes.data.results || categoriesRes.data || []);
      setCurrencies(currenciesRes.data.results || currenciesRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dropdown data");
    }
  }, []);

  useEffect(() => {
    fetchBills();
    fetchDropdowns();
  }, [fetchBills, fetchDropdowns]);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const openModal = (bill = null) => {
    if (bill) {
      setEditingBill(bill);
      setFormData({
        ...bill,
        account: bill.account?.id || "",
        category: bill.category?.id || "",
        currency: bill.currency?.code || (currencies[0]?.code || ""),
      });
    } else {
      setEditingBill(null);
      setFormData({
        account: "",
        category: "",
        name: "",
        amount: "",
        currency: currencies[0]?.code || "",
        type: "Expense",
        frequency: "Monthly",
        start_date: "",
        next_due_date: "",
        end_date: "",
        is_active: true,
      });
    }
    setOpen(true);
  };

  const cleanFormData = (data) => ({
    account: data.account || null,
    category: data.category || null,
    name: data.name || "",
    amount: data.amount ? parseFloat(data.amount) : null,
    currency: data.currency || null,
    type: data.type || "Expense",
    frequency: data.frequency || "Monthly",
    start_date: data.start_date || null,
    next_due_date: data.next_due_date || null,
    end_date: data.end_date || null,
    is_active: data.is_active,
  });

  const saveBill = async () => {
    if (!formData.currency || !formData.account || !formData.name || !formData.amount) {
      return toast.error("Please fill all required fields");
    }
    try {
      const payload = cleanFormData(formData);
      if (editingBill) {
        await api.put(`/recurring-bills/${editingBill.id}/`, payload);
        toast.success("Bill updated successfully");
      } else {
        await api.post("/recurring-bills/", payload);
        toast.success("Bill added successfully");
      }
      setOpen(false);
      fetchBills();
    } catch (err) {
      console.error(err);
      if (err.response) toast.error("Failed to save bill: " + JSON.stringify(err.response.data));
      else toast.error("Failed to save bill");
    }
  };

  // 🔹 Optimized Pay Bill (instant UI update + backend sync)
  const payBill = async (billId) => {
    try {
      // 🔸 update UI instantly
      const updatedBills = bills.map((bill) =>
        bill.id === billId ? { ...bill, is_paid: true } : bill
      );
      setBills(updatedBills);
      calculateSummary(updatedBills);

      // 🔸 call API
      const res = await api.post(`/recurring-bills/${billId}/pay_bill/`);
      toast.success(res.data.detail || "Bill paid!");

      // 🔸 sync with backend just in case
      fetchBills();
    } catch (err) {
      console.error(err);

      // 🔹 Rollback UI changes on error
      fetchBills(); // Refresh from server to get correct state
      
      // 🔹 Handle backend validation errors properly
      let message = "Failed to pay bill";
      
      if (err.response?.data?.detail) {
        message = translateError(err.response.data.detail);
        setPaymentError({
          message: message,
          billId: billId,
          rawMessage: err.response.data.detail
        });
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Recurring Bills</h1>
          <p className="text-gray-600 mt-1">Track and manage your recurring payments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
             className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 shadow-md hover:shadow-lg transition-all"
            onClick={() => openModal()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Bill
          </button>
          <Link 
            to="/paid-bills" 
            className="px-4 py-2 bg-white-600 hover:bg-white-700 text-black rounded-lg flex items-center gap-2 transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            View Paid Bills
          </Link>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 p-1 bg-white rounded-lg shadow-sm w-fit">
        <button
          className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${view === "list" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}
          onClick={() => setView("list")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          List View
        </button>
        <button
          className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${view === "calendar" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}
          onClick={() => setView("calendar")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Calendar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full bg-indigo-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Monthly Bills</p>
              <p className="text-2xl font-bold text-gray-800">${totalMonthly}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full bg-red-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Overdue Bills</p>
              <p className="text-2xl font-bold text-gray-800">{overdueCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="rounded-full bg-amber-100 p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Upcoming Bills</p>
              <p className="text-2xl font-bold text-gray-800">{upcomingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* List View */}
      {view === "list" && (
        <div className="mt-4 bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading bills...</span>
              </div>
            </div>
          ) : bills.length === 0 ? (
            <div className="p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No bills found</h3>
              <p className="mt-1 text-gray-500">Get started by creating a new bill.</p>
              <div className="mt-6">
                <button
                  onClick={() => openModal()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Your First Bill
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{bill.name || "-"}</div>
                            <div className="text-sm text-gray-500">{bill.category?.name || "No category"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${bill.amount || 0}</div>
                        <div className="text-sm text-gray-500">{bill.currency?.code || "USD"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {bill.frequency || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bill.next_due_date ? new Date(bill.next_due_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bill.is_active ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                        {bill.is_paid && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                            onClick={() => openModal(bill)}
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                            onClick={async () => {
                              if (window.confirm("Are you sure you want to delete this bill?")) {
                                await api.delete(`/recurring-bills/${bill.id}/`);
                                toast.success("Bill deleted");
                                fetchBills();
                              }
                            }}
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {!bill.is_paid && bill.is_active && (
                            <button
                              className="text-emerald-600 hover:text-emerald-900 p-1 rounded-full hover:bg-emerald-50"
                              onClick={() => payBill(bill.id)}
                              title="Mark as paid"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek,dayGridDay'
            }}
            events={bills.map((bill) => ({
              title: bill.name || "Untitled",
              start: bill.next_due_date || new Date().toISOString(),
              backgroundColor: bill.is_paid ? '#10B981' : (new Date(bill.next_due_date) < new Date() ? '#EF4444' : '#3B82F6')
            }))}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false
            }}
          />
        </div>
      )}

      {/* Add/Edit Modal */}
      {open && (
        <div className="fixed inset-0 bg-gray backdrop-blur-sm bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-h-[90vh] overflow-y-auto w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingBill ? "Edit Bill" : "Add New Bill"}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Bill name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
                     <select
                    name="account"
                    value={formData.account}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} - ${acc.balance || 0}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Currency</option>
                    {currencies.map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.name} ({cur.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  name="frequency"
                  value={formData.frequency || "Monthly"}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                  <input
                    type="date"
                    name="next_due_date"
                    value={formData.next_due_date || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={saveBill}
              >
                {editingBill ? "Update Bill" : "Add Bill"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Error Modal */}
      {paymentError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 text-red-600">
                Payment Failed
              </h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">{paymentError.message}</p>
              
              {paymentError.rawMessage && paymentError.rawMessage.includes("faaruq") && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Tip:</strong> You need to add funds to your account before paying this bill.
                  </p>
                </div>
              )}

              {paymentError.rawMessage && paymentError.rawMessage.includes("Lacagta account-ka") && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Tip:</strong> Your account balance is insufficient. Please add more funds or use a different account.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={() => setPaymentError(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}