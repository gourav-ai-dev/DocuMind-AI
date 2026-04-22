import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { Document } from "../interfaces/Document";
import "./MainLayout.css";
import { FormattedMessage } from "../components/FormattedMessage";

type Message = {
  id?: string;
  type: "user" | "ai";
  text: string;
  pending?: boolean;
};

type ChatHistoryEntry = {
  question: string;
  answer: string;
};

export default function MainLayout() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [docsLoading, setDocsLoading] = useState(true);
  const [aiLoadingByDoc, setAiLoadingByDoc] = useState<Record<string, number>>(
    {}
  );
  const [uploading, setUploading] = useState(false);
  const [chatCache, setChatCache] = useState<Record<string, Message[]>>({});
  const [pendingMessages, setPendingMessages] = useState<
    Record<string, Message[]>
  >({});

  const sidebarRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedDocRef = useRef<Document | null>(null);
  const chatCacheRef = useRef<Record<string, Message[]>>({});
  const pendingMessagesRef = useRef<Record<string, Message[]>>({});
  const aiLoadingByDocRef = useRef<Record<string, number>>({});

  useEffect(() => {
    selectedDocRef.current = selectedDoc;
  }, [selectedDoc]);

  useEffect(() => {
    chatCacheRef.current = chatCache;
  }, [chatCache]);

  useEffect(() => {
    pendingMessagesRef.current = pendingMessages;
  }, [pendingMessages]);

  useEffect(() => {
    aiLoadingByDocRef.current = aiLoadingByDoc;
  }, [aiLoadingByDoc]);

  const setMessagesForDoc = (docId: string, nextMessages: Message[]) => {
    const nextCache = {
      ...chatCacheRef.current,
      [docId]: nextMessages,
    };

    chatCacheRef.current = nextCache;
    setChatCache(nextCache);

    if (selectedDocRef.current?.id === docId) {
      setMessages(nextMessages);
    }
  };

  const setPendingMessagesForDoc = (docId: string, nextMessages: Message[]) => {
    const nextPending = {
      ...pendingMessagesRef.current,
      [docId]: nextMessages,
    };

    pendingMessagesRef.current = nextPending;
    setPendingMessages(nextPending);
  };

  const clearDocState = (docId: string) => {
    const nextCache = { ...chatCacheRef.current };
    delete nextCache[docId];

    const nextPending = { ...pendingMessagesRef.current };
    delete nextPending[docId];

    const nextLoading = { ...aiLoadingByDocRef.current };
    delete nextLoading[docId];

    chatCacheRef.current = nextCache;
    pendingMessagesRef.current = nextPending;
    aiLoadingByDocRef.current = nextLoading;

    setChatCache(nextCache);
    setPendingMessages(nextPending);
    setAiLoadingByDoc(nextLoading);
  };

  const updateAiLoadingForDoc = (docId: string, delta: number) => {
    const currentCount = aiLoadingByDocRef.current[docId] ?? 0;
    const nextCount = Math.max(0, currentCount + delta);
    const nextLoading = { ...aiLoadingByDocRef.current };

    if (nextCount === 0) {
      delete nextLoading[docId];
    } else {
      nextLoading[docId] = nextCount;
    }

    aiLoadingByDocRef.current = nextLoading;
    setAiLoadingByDoc(nextLoading);
  };

  const mergeHistoryWithPending = (
    history: ChatHistoryEntry[],
    localPending: Message[] = []
  ) => {
    const formattedHistory: Message[] = history.flatMap((chat) => [
      { type: "user", text: chat.question },
      { type: "ai", text: chat.answer },
    ]);

    return [...formattedHistory, ...localPending];
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const fetchedDocs = await api.allDocs();
        setDocs(fetchedDocs);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setDocsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!selectedDoc) {
      return;
    }

    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    const docId = selectedDoc.id;
    const pendingId = `${docId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const userMsg: Message = {
      id: pendingId,
      type: "user",
      text: trimmedInput,
      pending: true,
    };

    const existingPending = pendingMessagesRef.current[docId] ?? [];
    setPendingMessagesForDoc(docId, [...existingPending, userMsg]);

    const currentDocMessages = chatCacheRef.current[docId] ?? [];
    setMessagesForDoc(docId, [...currentDocMessages, userMsg]);

    setInput("");

    updateAiLoadingForDoc(docId, 1);

    try {
      const res = await api.askAI(trimmedInput, docId);

      const aiText = typeof res === "string" ? res : res.answer;
      const aiMsg: Message = { type: "ai", text: aiText };

      const remainingPending = (pendingMessagesRef.current[docId] ?? []).filter(
        (message) => message.id !== pendingId
      );
      setPendingMessagesForDoc(docId, remainingPending);

      const confirmedUserMsg: Message = {
        id: pendingId,
        type: "user",
        text: trimmedInput,
      };

      const updatedDocMessages = (chatCacheRef.current[docId] ?? []).filter(
        (message) => message.id !== pendingId
      );

      setMessagesForDoc(docId, [...updatedDocMessages, confirmedUserMsg, aiMsg]);
    } catch (err) {
      const remainingPending = (pendingMessagesRef.current[docId] ?? []).filter(
        (message) => message.id !== pendingId
      );
      setPendingMessagesForDoc(docId, remainingPending);

      const updatedDocMessages = (chatCacheRef.current[docId] ?? []).filter(
        (message) => message.id !== pendingId
      );
      setMessagesForDoc(docId, updatedDocMessages);

      console.error("AI error:", err);
    } finally {
      updateAiLoadingForDoc(docId, -1);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await api.deleteDoc(docId);

      setDocs((prev) => prev.filter((doc) => doc.id !== docId));
      clearDocState(docId);

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

    const cachedMessages = chatCacheRef.current[doc.id] ?? [];
    setMessages(cachedMessages);

    try {
      const history = await api.getChatHistory(doc.id);

      if (selectedDocRef.current?.id !== doc.id) {
        return;
      }

      const nextMessages = mergeHistoryWithPending(
        history as ChatHistoryEntry[],
        pendingMessagesRef.current[doc.id] ?? []
      );

      setMessagesForDoc(doc.id, nextMessages);
    } catch (err) {
      console.error("Failed to load chat:", err);

      if (selectedDocRef.current?.id !== doc.id) {
        return;
      }

      const fallbackMessages = pendingMessagesRef.current[doc.id] ?? [];
      setMessagesForDoc(doc.id, fallbackMessages);
    }
  };

  const isCurrentDocAiLoading = selectedDoc
    ? (aiLoadingByDoc[selectedDoc.id] ?? 0) > 0
    : false;

  return (
    <div className="layout">
      <div className="sidebar" ref={sidebarRef}>
        <h3>Documents</h3>

        {docsLoading && (
          <div className="walking-loader">
            <div className="boy">🚶‍♂️</div>
            <p>Fetching documents...</p>
          </div>
        )}

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
            className="upload-btn"
            disabled={uploading}
            onClick={() => document.getElementById("fileUpload")?.click()}
          >
            {uploading ? (
              <>
                <span className="spinner"></span>
                Uploading...
              </>
            ) : (
              <>📤 Upload File</>
            )}
          </button>
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div
              key={msg.id ?? `${msg.type}-${i}`}
              className={`message-row ${
                msg.type === "user" ? "user-row" : "ai-row"
              }`}
            >
              <div className={`message-bubble ${msg.type}`}>
                {/* {msg.text} */}
                <FormattedMessage text={msg.text} />
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
          {isCurrentDocAiLoading && (
            <div className="message ai">
              <div className="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <div className="input-box">
            <input
              value={input}
              placeholder="Ask something about document..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
