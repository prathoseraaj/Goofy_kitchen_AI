"use client";

import React, { useState, useRef, useEffect } from "react";
import { RefreshCw, AlertCircle, Send, Plus, Camera, Search, MoreVertical, ChefHat } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

const SAMPLE_CONVERSATIONS = [
  { id: "1", icon: "history", title: "Bachelor Pasta Night", active: true },
  { id: "2", icon: "restaurant", title: "The $0 Pantry Challenge", active: false },
  { id: "3", icon: "auto_awesome", title: "Smoothie Roast", active: false },
  { id: "4", icon: "group", title: "Dinner Party Planners", active: false },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "0",
    role: "ai",
    content:
      "Oh look, someone's hungry again. I've seen pantries like yours — culinary tragedies, all of them. Tell me what you have and I'll work my magic. Or my roast. Probably both.",
    timestamp: new Date(),
  },
];

const SUGGESTIONS = [
  "3 eggs, old bread, pickles 🥒",
  "Only pasta and garlic 🧄",
  "Rice, chicken, soy sauce 🍚",
  "My fridge is basically empty 😢",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeConv, setActiveConv] = useState("1");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/roast", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ ingredients: content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "The fridge refused to comment.");
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.roast,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: err.message || "Failed to communicate with the kitchen oracle.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="chat-app">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span style={{ fontSize: 22 }}>🍳</span>
            {sidebarOpen && (
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--on-surface)", whiteSpace: "nowrap" }}>
                Goofy Kitchen <span style={{ background: "linear-gradient(135deg,#d2bbff,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
              </span>
            )}
          </div>
          <button className="icon-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
            <span style={{ fontSize: 20 }}>☰</span>
          </button>
        </div>

        <button
          className="new-chat-btn"
          onClick={() => { setMessages(INITIAL_MESSAGES); setActiveConv("new"); }}
        >
          <Plus size={16} />
          {sidebarOpen && <span>New Chat</span>}
        </button>

        {sidebarOpen && (
          <div className="conv-section">
            <span className="conv-label">RECENT CHATS</span>
            <div className="conv-list">
              {SAMPLE_CONVERSATIONS.map((c) => (
                <button
                  key={c.id}
                  className={`conv-item ${activeConv === c.id ? "conv-item-active" : ""}`}
                  onClick={() => setActiveConv(c.id)}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {c.icon === "history" ? "🕐" : c.icon === "restaurant" ? "🍽️" : c.icon === "auto_awesome" ? "✨" : "👥"}
                  </span>
                  <span className="conv-title">{c.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="chef-profile">
            <div className="chef-avatar">🧑‍🍳</div>
            {sidebarOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surface)" }}>Sous-Chef Mode</span>
                <span className="status-chip">● Active</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Chat ── */}
      <main className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar-wrap">
              <ChefHat size={20} style={{ color: "#d2bbff" }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--on-surface)" }}>Witty Sous-Chef</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ae176", display: "inline-block" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-variant)", letterSpacing: "0.04em" }}>
                  ACTIVE · ROASTING ON DEMAND
                </span>
              </div>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="icon-btn" title="Search"><Search size={18} /></button>
            <button className="icon-btn" title="More"><MoreVertical size={18} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-wrap ${msg.role === "user" ? "message-user" : "message-ai"}`}
            >
              {msg.role === "ai" && (
                <div className="msg-avatar">🍳</div>
              )}
              <div className="msg-bubble-wrap">
                {msg.role === "ai" && (
                  <span className="msg-sender">Sous-Chef AI</span>
                )}
                <div
                  className={`msg-bubble ${msg.role === "user" ? "bubble-user" : msg.isError ? "bubble-error" : "bubble-ai"}`}
                >
                  {msg.isError ? (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: "var(--tertiary)" }} />
                      <span>{msg.content}</span>
                    </div>
                  ) : (
                    <div className={msg.role === "ai" ? "ai-prose" : undefined}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <span className="msg-time">{fmtTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="message-wrap message-ai">
              <div className="msg-avatar">🍳</div>
              <div className="msg-bubble-wrap">
                <span className="msg-sender">Sous-Chef AI</span>
                <div className="msg-bubble bubble-ai" style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 18px" }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <span style={{ marginLeft: 6, fontSize: 13, color: "var(--outline)", fontStyle: "italic" }}>
                    Consulting the oracle...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          {/* Suggestion chips */}
          <div className="suggestions-row">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>

          <div className="input-row">
            <button className="icon-btn" title="Attach photo" style={{ flexShrink: 0 }}>
              <Camera size={18} />
            </button>
            <textarea
              ref={textareaRef}
              id="chat-input"
              className="chat-textarea"
              placeholder="Tell me what's in your fridge… 🍳"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              id="send-button"
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              title="Send"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
}