import { useState } from "react";

export default function MainLayout() {
  const [docs, setDocs] = useState([
    "project-spec.pdf",
    "architecture.docx",
  ]);

  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input) return;

    setMessages([...messages, input]);
    setInput("");
  };

  return (
    <div className="layout">

      {/* ===== SIDEBAR ===== */}
      <div className="sidebar">
        <h3>Documents</h3>

        {docs.map((doc, i) => (
          <div
            key={i}
            className="doc-item"
            onClick={() => setSelectedDoc(doc)}
          >
            {doc}
          </div>
        ))}
      </div>

      {/* ===== CHAT AREA ===== */}
      <div className="chat-area">

        {/* HEADER */}
        <div className="header">
          <span>{selectedDoc || "Select a document"}</span>
          <button>Upload</button>
        </div>

        {/* MESSAGES */}
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className="message user">
              {msg}
            </div>
          ))}
        </div>

        {/* INPUT */}
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