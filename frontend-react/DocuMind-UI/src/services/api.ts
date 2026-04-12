import type { Document } from "../interfaces/Document";

const BASE_URL = "http://localhost:5166/api";

export const api = {

  register: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }

    return data;
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    if (!data.userId) {
      throw new Error("Invalid login response");
    }
    return data;
  },

  allDocs: async () => {
    const res = await fetch(`${BASE_URL}/documents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to fetch documents");
    }
    return res.json() as Promise<Document[]>;
  },

  uploadDoc: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "File upload failed");
    }

    return res.json();
  },

  deleteDoc: async (docId: string) => {
    const res = await fetch(`${BASE_URL}/documents/${docId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to delete document");
    }
    return true;
  },

  askAI: async (query: string, documentId: string) => {
    const res = await fetch(`${BASE_URL}/ai/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, documentId }),
      credentials: "include",
    });

    return res.json();
  },

  getChatHistory: async (docId: string) => {
    const res = await fetch(`${BASE_URL}/documents/chat/${docId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch chat history");
    }

    return res.json();
  },

};