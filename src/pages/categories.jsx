import React, { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, X, RefreshCcw, ChevronDown, ChevronRight, Search, Folder, FolderOpen } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../services/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [filterParent, setFilterParent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", parent: "" });

  const normalizeList = (resp) => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (resp.results && Array.isArray(resp.results)) return resp.results;
    return [];
  };

  const fetchParents = async () => {
    try {
      const { data } = await api.get("/categories/");
      setParents(normalizeList(data));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load parent options");
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterParent) params.parent = filterParent;
      const { data } = await api.get("/categories/", { params });
      const list = normalizeList(data);
      setCategories(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchParents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParent]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", parent: filterParent || "" });
    setIsModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat?.name || "", parent: cat?.parent || "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm({ name: "", parent: "" });
  };

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (editing && editing.id === form.parent) {
      toast.error("A category cannot be its own parent");
      return false;
    }
    return true;
  };

  const saveCategory = async (e) => {
    e?.preventDefault?.();
    if (!validateForm()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      parent: form.parent || null,
    };

    try {
      if (editing) {
        await api.patch(`/categories/${editing.id}/`, payload);
        toast.success("Category updated");
      } else {
        await api.post("/categories/", payload);
        toast.success("Category created");
      }
      closeModal();
      fetchCategories();
      fetchParents();
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data;
      if (detail?.non_field_errors) {
        toast.error(detail.non_field_errors.join(" "));
      } else if (detail?.name) {
        toast.error(Array.isArray(detail.name) ? detail.name.join(" ") : String(detail.name));
      } else {
        toast.error("Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!id) return;
    setDeletingId(id);
    try {
      await api.delete(`/categories/${id}/`);
      toast.success("Category deleted");
      fetchCategories();
      fetchParents();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => (c.name || "").toLowerCase().includes(term));
  }, [categories, searchTerm]);

  const findParentName = (id) => {
    if (!id) return "—";
    const p = parents.find((x) => x.id === id);
    return p ? p.name : "—";
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px'
          },
        }}
      />
      
      <header className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Categories</h1>
            <p className="text-sm text-gray-500 mt-1">Create, edit, and organize your categories with a hierarchical structure.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchCategories}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium transition-all hover:border-gray-300 hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={openCreate}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4" /> New Category
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filterParent}
              onChange={(e) => setFilterParent(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">All categories</option>
              <option value="__ROOT__" disabled>────────────</option>
              {parents
                .filter((p) => !p.parent)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    Filter by: {p.name}
                  </option>
                ))}
            </select>
            <div className="flex items-center text-sm text-gray-500 bg-gray-50 rounded-xl px-4 border border-gray-200">
              {filterParent ? (
                <span className="flex items-center">
                  <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                  Filtering by parent
                </span>
              ) : (
                <span className="flex items-center">
                  <Folder className="h-4 w-4 mr-2 text-gray-400" />
                  Showing all categories
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-100 rounded-md w-1/2 mb-6"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-gray-100 rounded-lg w-16"></div>
                  <div className="h-8 bg-gray-100 rounded-lg w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Folder className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No categories found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm 
                ? `No results for "${searchTerm}". Try a different search term.`
                : "Get started by creating your first category."}
            </p>
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4" /> Create Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{c.name}</h3>
                  {!c.parent && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      Root
                    </span>
                  )}
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <span className="mr-2">Parent:</span>
                    {c.parent ? (
                      <span className="inline-flex items-center font-medium text-gray-700">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        {findParentName(c.parent)}
                      </span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Created: {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEdit(c)}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:bg-gray-200"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100"
                    disabled={deletingId === c.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === c.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {editing ? "Edit Category" : "New Category"}
              </h2>
              <button 
                onClick={closeModal} 
                className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={saveCategory} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={onFormChange}
                  placeholder="e.g., Food, Transport, Utilities"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                  autoFocus
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Parent (optional)</label>
                <select
                  name="parent"
                  value={form.parent || ""}
                  onChange={onFormChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">None (root category)</option>
                  {parents
                    .filter((p) => !editing || p.id !== editing.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                {editing && editing.parent && editing.parent === editing.id && (
                  <p className="mt-2 text-xs text-red-600">Invalid parent: cannot be itself.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 min-w-[80px]"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    editing ? "Update" : "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}