import { useState } from "react";

interface Message {
  from: "bot" | "user";
  text: string;
}

interface Rule {
  keywords: string[];
  answer: string;
}

const RULES: Rule[] = [
  {
    keywords: ["delivery", "shipping", "van", "how long", "when will", "arrive"],
    answer:
      "Small items usually go out via national parcel courier within a few days. Larger and bespoke pieces go out on our own vans, delivered in scheduled runs — once your order is scheduled you'll see a status update on it.",
  },
  {
    keywords: ["bespoke", "custom", "design", "drawing", "sketch", "hand-drawn", "hand drawn"],
    answer:
      "For a fully bespoke piece, use \"Request a fully bespoke version\" on any product (or just place an order and describe what you want). You can attach a photo or scan of a hand-drawn design and we'll use it to plan the build.",
  },
  {
    keywords: ["material", "wood", "finish", "oak", "pine", "walnut", "colour", "color", "paint"],
    answer:
      "We work with a range of finishes (oak, pine, walnut and painted options). You can pick a finish on each product page, or describe what you'd like for a bespoke piece.",
  },
  {
    keywords: ["order", "buy", "purchase", "checkout", "how do i"],
    answer:
      "Browse Products, pick an item (or request a bespoke version), and fill in the order form with your delivery address and payment method. You'll get an order number as soon as it's placed.",
  },
  {
    keywords: ["pay", "payment", "card", "cash", "bank transfer"],
    answer: "At checkout you can choose to pay by card, cash on delivery, or bank transfer.",
  },
  {
    keywords: ["status", "track", "where is my order", "my order"],
    answer:
      "Sign in and check the \"My Orders\" page to see the status of everything you've ordered. If you checked out as a guest, register using the same email and your past orders will appear there automatically.",
  },
  {
    keywords: ["contact", "phone", "email", "human", "agent", "help", "support"],
    answer: "For anything I can't help with, our team is happy to help — reach out via the contact details on your order confirmation.",
  },
  {
    keywords: ["hello", "hi", "hey"],
    answer: "Hello! I'm the Bespoke Furniture Creations assistant. Ask me about delivery, bespoke orders, materials, payment, or your order status.",
  },
];

const FALLBACK =
  "I'm not sure about that one — try asking about delivery, bespoke orders, materials, payment methods, or order status. You can also use one of the quick topics below.";

const QUICK_TOPICS = ["Delivery times", "Bespoke orders", "Materials & finishes", "Payment methods", "Order status"];

function answerFor(question: string): string {
  const lower = question.toLowerCase();
  const match = RULES.find((rule) => rule.keywords.some((keyword) => lower.includes(keyword)));
  return match?.answer ?? FALLBACK;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "Hi! Ask me about delivery, bespoke orders, materials, payment, or your order status." },
  ]);

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text }, { from: "bot", text: answerFor(text) }]);
    setInput("");
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>Bespoke Furniture Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message, i) => (
              <div key={i} className={`chat-bubble chat-bubble-${message.from}`}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="chat-quick-topics">
            {QUICK_TOPICS.map((topic) => (
              <button key={topic} onClick={() => send(topic)}>
                {topic}
              </button>
            ))}
          </div>
          <form
            className="chat-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              aria-label="Chat message"
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
      <button className="chat-toggle" onClick={() => setOpen((prev) => !prev)} aria-label={open ? "Close chat" : "Open chat"}>
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
