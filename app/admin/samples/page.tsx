"use client";

import { useState } from "react";

export default function SamplesPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sample Library</h1>
          <p className="text-gray-600 mt-1">
            Manage and upload audio samples
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {["all", "upload", "manage"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab === "all" && "All Samples"}
              {tab === "upload" && "Upload"}
              {tab === "manage" && "Manage"}
            </button>
          ))}
        </nav>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sample Management Coming Soon
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Bulk upload functionality will be available in Milestone 2. This will allow you to:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600 mb-8">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Upload multiple samples at once</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Add metadata (tags, categories, descriptions)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Preview and manage existing samples</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Track download statistics</span>
            </li>
          </ul>
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
            <span>🚧</span>
            <span className="text-sm font-medium">Under Development</span>
          </div>
        </div>
      </div>
    </div>
  );
}
