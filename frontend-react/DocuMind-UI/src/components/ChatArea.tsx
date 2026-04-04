import { useState } from "react";

type Message = {
  text: string;
  sender: "user" | "ai";
};

type Props = {
  selectedDoc: string;
};

function ChatArea({ selectedDoc }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      text: input,
      sender: "user",
    };

    const aiMessage: Message = {
      text: "This is a dummy AI response...",
      sender: "ai",
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col">
      
      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500">
            Ask something about <b>{selectedDoc}</b>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-xl max-w-md ${
                msg.sender === "user"
                  ? "bg-blue-600"
                  : "bg-gray-800"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your document..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-500 px-5 rounded-lg transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatArea;