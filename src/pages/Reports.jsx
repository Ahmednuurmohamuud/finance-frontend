// src/pages/Reports.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { CSVLink } from "react-csv";
import { format } from "date-fns";

const TABLES = [
  { value: "transactions", label: "Transactions" },
  { value: "accounts", label: "Accounts" },
  { value: "categories", label: "Categories" },
  { value: "budgets", label: "Budgets" },
  { value: "recurring_bills", label: "Recurring Bills" },
];

const ACTION_COLORS = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
};

export default function Reports() {
  const [logs, setLogs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState("transactions");
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [count, setCount] = useState(0);
  const [pageSize] = useState(20);

  // Fetch accounts and categories for mapping IDs -> names
  const fetchAccountsCategories = useCallback(async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        api.get("/accounts/"),
        api.get("/categories/"),
      ]);
      setAccounts(Array.isArray(accRes.data) ? accRes.data : accRes.data.results);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.results);
    } catch (err) {
      console.error("Error fetching accounts/categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchAccountsCategories();
  }, [fetchAccountsCategories]);

  const fetchLogs = useCallback(
    async (url = null) => {
      setLoading(true);
      setError("");
      try {
        const endpoint = url || `/audit-logs/?table_name=${selectedTable}&page_size=${pageSize}`;
        const response = await api.get(endpoint);
        
        const data = response.data.results ? response.data.results : response.data;
        
        const processedData = Array.isArray(data) ? data.map((log) => ({
          ...log,
          action: log.action.toUpperCase(),
        })) : [];

        setLogs(processedData);
        setNext(response.data.next);
        setPrevious(response.data.previous);
        setCount(response.data.count || processedData.length);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        setError("Failed to fetch audit logs");
        if (err.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedTable, pageSize]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Mappings ID -> name
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const displayValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "-";
    
    // Handle UUID references
    if (key === "account" && accountMap[value]) return accountMap[value];
    if (key === "target_account" && accountMap[value]) return accountMap[value];
    if (key === "category" && categoryMap[value]) return categoryMap[value];
    if (key === "parent" && categoryMap[value]) return categoryMap[value];
    
    // Format dates
    if ((key.includes("date") || key.includes("_at")) && typeof value === "string") {
      try {
        return format(new Date(value), "MMM dd, yyyy");
      } catch {
        return value;
      }
    }
    
    // Format boolean values
    if (typeof value === "boolean") return value ? "Yes" : "No";
    
    // Format numbers
    if (typeof value === "number") {
      if (key === "amount") return `$${value.toFixed(2)}`;
      return value.toString();
    }
    
    return value;
  };

  // Live full-text search filter
  const filteredLogs = logs.filter((log) =>
    JSON.stringify(log).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy - HH:mm");
    } catch {
      return dateStr;
    }
  };

  // Prepare CSV data
  const csvData = filteredLogs.map(log => ({
    ID: log.id,
    User: log.user || "N/A",
    Table: log.table_name,
    "Record ID": log.record_id,
    Action: log.action,
    "Old Data": log.old_data ? JSON.stringify(log.old_data, null, 2) : "",
    "New Data": log.new_data ? JSON.stringify(log.new_data, null, 2) : "",
    "Changed At": formatDate(log.changed_at),
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Audit Logs Report</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {TABLES.map((table) => (
            <option key={table.value} value={table.value}>
              {table.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Live search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
        />

        <CSVLink
          data={csvData}
          filename={`audit-logs-${selectedTable}-${format(new Date(), "yyyy-MM-dd")}.csv`}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Export CSV
        </CSVLink>

        <button
          onClick={() => fetchLogs()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Total Records</span>
            <span className="text-2xl font-bold">{count}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Table</span>
            <span className="text-2xl font-bold capitalize">{selectedTable.replace('_', ' ')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Filtered Results</span>
            <span className="text-2xl font-bold">{filteredLogs.length}</span>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Table
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Record ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Old Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                New Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Changed At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center p-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3">Loading audit logs...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="text-center text-red-500 p-4">
                  {error}
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-8 text-gray-500">
                  {searchQuery ? "No logs match your search" : "No logs found for this table"}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.user || "System"}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {log.table_name.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-500 font-mono">
                      {log.record_id}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}`}>
                      {log.action}
                    </span>
                  </td>

                  {/* Old Data */}
                  <td className="px-4 py-3 max-w-xs">
                    {log.old_data ? (
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 overflow-auto max-h-40">
                        {Object.entries(log.old_data).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between border-b border-gray-100 py-1 text-sm"
                          >
                            <span className="font-semibold text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                            <span className="text-gray-800 truncate max-w-xs pl-2 text-right">
                              {displayValue(key, value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* New Data */}
                  <td className="px-4 py-3 max-w-xs">
                    {log.new_data ? (
                      <div className="bg-green-50 p-2 rounded-lg border border-green-200 overflow-auto max-h-40">
                        {Object.entries(log.new_data).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between border-b border-green-100 py-1 text-sm"
                          >
                            <span className="font-semibold text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                            <span className="text-gray-800 truncate max-w-xs pl-2 text-right">
                              {displayValue(key, value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(log.changed_at)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(next || previous) && (
        <div className="flex justify-between mt-6">
          <button
            disabled={!previous}
            onClick={() => fetchLogs(previous)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              previous
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Previous
          </button>
          
          <div className="flex items-center text-sm text-gray-500">
            Showing {filteredLogs.length} of {count} records
          </div>
          
          <button
            disabled={!next}
            onClick={() => fetchLogs(next)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              next
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}