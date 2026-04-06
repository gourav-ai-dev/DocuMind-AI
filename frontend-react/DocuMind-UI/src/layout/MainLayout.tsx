import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { Document } from "../interfaces/Document";
import "./MainLayout.css";

type Message = {
  type: "user" | "ai";
  text: string;
};

export default function MainLayout() {

  const [docs, setDocs] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input || !selectedDoc) return;

    const userMsg: Message = { type: "user", text: input };

    setInput("");

    setMessages(prev => [...prev, userMsg]);

    try {
      setLoading(true);

      const res = await api.askAI(input, selectedDoc.id);

      const aiText =
        typeof res === "string" ? res : res.answer;

      const aiMsg: Message = { type: "ai", text: aiText };

      setMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      console.error("AI error:", err);
    } finally {
      setLoading(false);

    }

    setInput("");
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await api.deleteDoc(docId);

      setDocs(prev => prev.filter(doc => doc.id !== docId));

      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
        setMessages([]);
      }

    } catch (err) {
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

    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectDoc = async (doc: Document) => {
    setSelectedDoc(doc);

    try {
      const history = await api.getChatHistory(doc.id);

      const formatted: Message[] = history.flatMap((chat: any) => [
        { type: "user", text: chat.question },
        { type: "ai", text: chat.answer }
      ]);

      setMessages(formatted);

    } catch (err) {
      console.error("Failed to load chat:", err);
      setMessages([]);
    }
  };

  return (
    <div className="layout">

      <div className="sidebar" ref={sidebarRef}>
        <h3>Documents</h3>

        {loading && <p>Loading...</p>}

        {docs.map((doc) => (
          <div
            key={doc.id}
            className="doc-item"
            onClick={() => handleSelectDoc(doc)}
          >
            <span className="doc-name">{doc.fileName}</span>

            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
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

          {uploading && <span>Uploading...</span>}

          <input
            type="file"
            id="fileUpload"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                uploadDocument(e.target.files[0]);
              }
            }}
          />

          <button
            disabled={uploading}
            onClick={() =>
              document.getElementById("fileUpload")?.click()
            }
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message-row ${msg.type === "user" ? "user-row" : "ai-row"}`}
            >
              <div className={`message-bubble ${msg.type}`}>
                {msg.text}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
          {loading && (
            <div className="message ai">
              <div className="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
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