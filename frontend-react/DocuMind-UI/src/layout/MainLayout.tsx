import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { Document } from "../interfaces/Document";
import "./MainLayout.css";

export default function MainLayout() {

  const [docs, setDocs] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {

        const fetchedDocs = await api.allDocs();
        setDocs(fetchedDocs);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const sendMessage = () => {
    if (!input) return;

    setMessages([...messages, input]);
    setInput("");
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await api.deleteDoc(docId);

      setDocs(docs.filter(doc => doc.id !== docId));
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const uploadDocument = async (file: File) => {
    try {

      setUploading(true);

      await api.uploadDoc(file);

      const fetchedDocs = await api.allDocs();
      setDocs(fetchedDocs);

      setSelectedDoc(fetchedDocs[0]);
      setMessages([]);
      sidebarRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="layout">

      <div className="sidebar" ref={sidebarRef}>
        <h3>Documents</h3>

        {docs.map((doc) => (
          <div
            key={doc.id}
            className="doc-item"
            onClick={() => setSelectedDoc(doc)}
          >
            <span className="doc-name">{doc.fileName}</span>

            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation(); // prevents selecting doc
                handleDeleteDoc(doc.id);
              }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="chat-area">

        <div className="header">
          <span>{selectedDoc?.fileName || "Select a document"}</span>
          {uploading && " (Uploading...)"}
          <input
            type="file"
            id="fileUpload"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) uploadDocument(e.target.files[0]);
            }}

          />
          <button disabled={uploading}
            onClick={() => document.getElementById("fileUpload")?.click()}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className="message user">
              {msg}
            </div>
          ))}
        </div>

        <div className="input-box">
          <input
            value={input}
            placeholder="Ask something about document..."
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>

      </div>
    </div>
  );
}