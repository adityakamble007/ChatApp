"use client";

import React, { useState } from "react";

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:20670/search-users?query=${query}`);
      const data = await res.json();
      console.log("Response data:", data);

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format");
      }

      setResults(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to search users.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <h2 className="text-xl font-semibold mb-2">Search Users</h2>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border px-3 py-1.5 rounded text-sm"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && results.length > 0 && (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1 mt-2">
          {results.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 transition"
            >
              <img
                src={user.imageUrl}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <p className="text-sm font-medium truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
