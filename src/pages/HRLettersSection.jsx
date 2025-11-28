// src/pages/HRLettersSection.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HRLettersSection = () => {
  // Templates & categories
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Template filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Recent documents state
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentPage, setRecentPage] = useState(1);
  const [recentPages, setRecentPages] = useState(1);
  const [recentCategory, setRecentCategory] = useState("");
  const [recentLoading, setRecentLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Role-based permission states
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [userPermissions, setUserPermissions] = useState([]);

  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTargetTemplate, setRenameTargetTemplate] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSubmitting, setRenameSubmitting] = useState(false);

  const navigate = useNavigate();

  // =========================
  // Auth helpers
  // =========================
  const getAuthHeaders = () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) {
      showToast("Authentication Error: Please login again", "error");
      return {};
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const decodeJWT = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  // =========================
  // Permissions
  // =========================
  useEffect(() => {
    const initializeUserPermissions = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        if (token) {
          const decoded = decodeJWT(token);
          if (decoded && decoded.role) {
            setCurrentUserRole(decoded.role);
            await fetchUserPermissions(decoded.role);
          }
        }
      } catch (error) {
        console.error("Error initializing permissions:", error);
      }
    };
    initializeUserPermissions();
  }, []);

  const fetchUserPermissions = async (role) => {
    try {
      const res = await fetch("http://localhost:5000/api/settings/roles/roles");
      if (res.ok) {
        const data = await res.json();
        const userRoleData = data.data.find((r) => r.name === role);
        if (userRoleData) {
          setUserPermissions(userRoleData.permissions);
        }
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const hasPermission = (action) => {
    if (currentUserRole === "admin") return true;
    const hrLettersPermission = userPermissions.find(
      (p) => p.module === "HR-Letters"
    );
    if (!hrLettersPermission) return false;

    const accessLevel = hrLettersPermission.accessLevel;
    switch (action) {
      case "read":
        return ["read", "read-self", "custom", "crud"].includes(accessLevel);
      case "download_letter":
        return ["read", "read-self", "custom", "crud"].includes(accessLevel);
      case "edit_letter":
        return ["custom", "crud"].includes(accessLevel);
      default:
        return false;
    }
  };

  // =========================
  // Toast helper
  // =========================
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "" }),
      3000
    );
  };

  // =========================
  // Data loading
  // =========================
  const loadTemplatesAndCategories = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) return;

      // Templates
      const templatesResponse = await fetch(
        "http://localhost:5000/api/letter-templates",
        {
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }

      // Categories
      const categoriesResponse = await fetch(
        "http://localhost:5000/api/letter-templates/categories",
        {
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }
    } catch (error) {
      console.error("Error loading templates/categories:", error);
      showToast("Failed to load template data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentDocuments = async (
    page = recentPage,
    category = recentCategory
  ) => {
    try {
      setRecentLoading(true);
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) return;

      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 10);
      if (category) params.append("category", category);

      const res = await fetch(
        `http://localhost:5000/api/editor/user/documents?${params.toString()}`,
        {
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRecentDocs(data.documents || []);
          setRecentPages(data.pages || 1);
          setRecentPage(data.page || 1);
        }
      }
    } catch (error) {
      console.error("Error loading recent documents:", error);
      showToast("Failed to load recent letters", "error");
    } finally {
      setRecentLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTemplatesAndCategories();
  }, []);

  // Reload recent docs when page / filter changes
  useEffect(() => {
    loadRecentDocuments(recentPage, recentCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentPage, recentCategory]);

  // =========================
  // Helpers
  // =========================
  const getCategoryName = (category) => {
    if (category && typeof category === "object" && category.name) {
      return category.name;
    }
    if (category && typeof category === "string") {
      const categoryObj = categories.find((cat) => cat._id === category);
      return categoryObj ? categoryObj.name : "Unknown Category";
    }
    return "Uncategorized";
  };

  const getCategoryNameFromDoc = (doc) => {
    const catId = doc?.originalTemplate?.category;
    if (!catId) return "Uncategorized";
    const id =
      typeof catId === "object" && catId._id ? catId._id.toString() : catId;
    const categoryObj = categories.find((c) => c._id === id);
    return categoryObj ? categoryObj.name : "Uncategorized";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFileIconClass = (fileName) => {
    if (!fileName) return "file-icon file-icon-default";
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "file-icon file-icon-pdf";
      case "doc":
      case "docx":
        return "file-icon file-icon-doc";
      case "xls":
      case "xlsx":
        return "file-icon file-icon-xls";
      case "txt":
        return "file-icon file-icon-txt";
      default:
        return "file-icon file-icon-default";
    }
  };

  // =========================
  // Actions
  // =========================
  const handleDownloadTemplate = async (template) => {
    if (!hasPermission("download_letter")) {
      showToast("You don't have permission to download templates", "error");
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) return;

      const response = await fetch(
        `http://localhost:5000/api/letter-templates/${template._id}/download`,
        {
          headers,
          method: "GET",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = template.file.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("Template downloaded successfully", "success");
      } else {
        throw new Error("Failed to download template");
      }
    } catch (error) {
      console.error("Download error:", error);
      showToast("Failed to download template", "error");
    }
  };

  // Open rename modal BEFORE creating user document
  const handleUseTemplate = (template) => {
    if (!hasPermission("edit_letter")) {
      showToast("You don't have permission to use templates", "error");
      return;
    }

    setRenameTargetTemplate(template);
    setRenameValue(template.name || "New Letter");
    setRenameModalOpen(true);
  };

  const closeRenameModal = () => {
    if (renameSubmitting) return;
    setRenameModalOpen(false);
    setRenameTargetTemplate(null);
    setRenameValue("");
  };

 const confirmRenameAndCreate = async () => {
  if (!renameTargetTemplate) return;
  const trimmed = renameValue.trim();
  if (!trimmed) {
    showToast("Please enter a name for your letter", "warning");
    return;
  }

  try {
    setRenameSubmitting(true);
    const headers = getAuthHeaders();
    if (Object.keys(headers).length === 0) {
      setRenameSubmitting(false);
      return;
    }

    const res = await fetch(
      `http://localhost:5000/api/editor/template/${renameTargetTemplate._id}/create`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmed }),
      }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to create document");
    }

    const docId = data.documentId;

    closeRenameModal();
    showToast("Letter created, opening editor...", "success");

    // ✔ Correct — open editor with USER DOCUMENT ID
    navigate(`/editor/${docId}`);

  } catch (error) {
    console.error("Create document error:", error);
    showToast("Failed to create letter from template", "error");
  } finally {
    setRenameSubmitting(false);
  }
};


  const handleOpenRecentDoc = (doc) => {
    if (!hasPermission("edit_letter")) {
      showToast("You don't have permission to edit letters", "error");
      return;
    }
    navigate(`/editor/${doc._id}`);
  };

  // =========================
  // Filters
  // =========================
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description &&
        template.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesCategory =
      !filterCategory ||
      (template.category &&
        (typeof template.category === "object"
          ? template.category._id
          : template.category) === filterCategory);

    return matchesSearch && matchesCategory;
  });

  // =========================
  // Render
  // =========================
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light text-gray-900 tracking-tight">
            HR Letter Templates
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Professional letter templates for streamlined HR communications and documentation
          </p>
        </div>

        {/* Template Library */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl font-medium text-gray-900">
                  Template Library
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredTemplates.length} templates available
                </p>
              </div>

              {/* Search + Category filter */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-8">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-gray-300 mb-4">
                  <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">No templates found</p>
                <p className="text-sm">
                  {searchTerm || filterCategory
                    ? "Try adjusting your search or filter criteria"
                    : "No templates are currently available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template._id}
                    className="border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-white group hover:border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-lg mb-2 group-hover:text-gray-700 transition-colors">
                          {template.name}
                        </h3>
                        <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {getCategoryName(template.category)}
                        </span>
                      </div>
                      <div className={`ml-4 ${getFileIconClass(template.file?.fileName)}`}></div>
                    </div>

                    {template.description && (
                      <p className="text-sm text-gray-600 mb-5 line-clamp-3 leading-relaxed">
                        {template.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-500 mb-6">
                      <div className="flex justify-between">
                        <span>File Size:</span>
                        <span className="font-medium">
                          {formatFileSize(template.file?.fileSize)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="font-medium">
                          {formatDate(template.createdAt)}
                        </span>
                      </div>
                      {template.file?.fileType && (
                        <div className="flex justify-between">
                          <span>File Type:</span>
                          <span className="font-medium">
                            {template.file.fileType}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        disabled={!hasPermission("edit_letter")}
                        className="w-full px-4 py-3 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Use Template
                      </button>

                      <button
                        onClick={() => handleDownloadTemplate(template)}
                        disabled={!hasPermission("download_letter")}
                        className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl font-medium text-gray-900">
                Recent Letters
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Your recently edited documents
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={recentCategory}
                onChange={(e) => {
                  setRecentPage(1);
                  setRecentCategory(e.target.value);
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-8">
            {recentLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading recent letters...</p>
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-gray-300 mb-4">
                  <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">No recent letters</p>
                <p className="text-sm">Your recently edited documents will appear here</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentDocs.map((doc) => (
                    <div
                      key={doc._id}
                      className="border border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-white group hover:border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-md group-hover:text-gray-700 transition-colors">
                            {doc.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            From template: {doc.originalTemplate?.name || "Unknown"}
                          </p>
                          <span className="inline-block mt-2 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {getCategoryNameFromDoc(doc)}
                          </span>
                        </div>
                        <div className={`ml-3 ${getFileIconClass(doc.file?.fileName)}`}></div>
                      </div>

                      <div className="mt-4 text-xs text-gray-500 space-y-2">
                        <div className="flex justify-between">
                          <span>Last edited:</span>
                          <span className="font-medium">
                            {formatDate(doc.updatedAt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span className="font-medium">
                            {formatDate(doc.createdAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenRecentDoc(doc)}
                        className="mt-5 w-full px-4 py-2.5 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Open Letter
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                    disabled={recentPage <= 1}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <div className="text-sm text-gray-600">
                    Page {recentPage} of {recentPages}
                  </div>
                  <button
                    onClick={() =>
                      setRecentPage((p) => (p < recentPages ? p + 1 : p))
                    }
                    disabled={recentPage >= recentPages}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-3xl font-light text-gray-900 mb-2">
              {templates.length}
            </div>
            <div className="text-sm text-gray-600">Total Templates</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-3xl font-light text-gray-900 mb-2">
              {categories.length}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-3xl font-light text-gray-900 mb-2">
              {templates.filter((t) => t.file && t.file.fileName).length}
            </div>
            <div className="text-sm text-gray-600">Files Available</div>
          </div>
        </div>

        {/* No read permission */}
        {!hasPermission("read") && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-light text-gray-900 mb-3">
              Access Denied
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You don't have permission to view Letter Templates. Please contact your administrator.
            </p>
            <div className="text-sm text-gray-500">
              Current Role: <span className="font-medium">{currentUserRole}</span>
            </div>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Name your letter
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              This name will be shown in your Recent Letters list.
            </p>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!renameSubmitting) confirmRenameAndCreate();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  closeRenameModal();
                }
              }}
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter document name"
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeRenameModal}
                disabled={renameSubmitting}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRenameAndCreate}
                disabled={renameSubmitting}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {renameSubmitting && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                Create & Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 p-4 rounded-xl shadow-lg z-50 max-w-sm border ${
            toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : toast.type === "warning"
              ? "bg-yellow-50 border-yellow-200 text-yellow-800"
              : "bg-green-50 border-green-200 text-green-800"
          }`}
        >
          <div className="flex items-center">
            <div
              className={`flex-shrink-0 mr-3 ${
                toast.type === "error"
                  ? "text-red-500"
                  : toast.type === "warning"
                  ? "text-yellow-500"
                  : "text-green-500"
              }`}
            >
              {toast.type === "error" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : toast.type === "warning" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: "", type: "" })}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .file-icon {
          width: 2.5rem;
          height: 2.5rem;
          background-size: 1.5rem;
          background-repeat: no-repeat;
          background-position: center;
          opacity: 0.6;
        }
        .file-icon-pdf {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%236b7280' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'%3E%3C/path%3E%3C/svg%3E");
        }
        .file-icon-doc {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%236b7280' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'%3E%3C/path%3E%3C/svg%3E");
        }
        .file-icon-xls {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%236b7280' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'%3E%3C/path%3E%3C/svg%3E");
        }
        .file-icon-txt {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%236b7280' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'%3E%3C/path%3E%3C/svg%3E");
        }
        .file-icon-default {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%236b7280' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'%3E%3C/path%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
};

export default HRLettersSection;
