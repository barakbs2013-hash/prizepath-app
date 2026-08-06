"use client";

import { useEffect, useRef, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

type Message = { id: string; role: "user" | "assistant"; content: string };

export default function PipChatPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const { t, locale, dir } = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<{ messages: { id: string; role: string; content: string }[] }>(`/api/ai/task-assistant?taskId=${taskId}`)
      .then((res) => {
        setMessages(
          res.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.role === "assistant" ? formatAssistant(m.content) : m.content,
          }))
        );
      })
      .finally(() => setLoadingHistory(false));
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function formatAssistant(raw: string) {
    try {
      const parsed = JSON.parse(raw);
      let text = parsed.short_message ?? raw;
      if (parsed.suggested_steps?.length) {
        text += "\n" + parsed.suggested_steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n");
      }
      if (parsed.encouragement) text += "\n\n" + parsed.encouragement;
      return text;
    } catch {
      return raw;
    }
  }

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message) return;
    setInput("");
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await api.post<{ response: any }>("/api/ai/task-assistant", { taskId, message, language: locale });
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}-a`, role: "assistant", content: formatAssistant(JSON.stringify(res.response)) },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}-e`, role: "assistant", content: err instanceof Error ? err.message : t("genericError") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "linear-gradient(180deg,#F6F2FF,#EEF3FE 40%)" }}>
      <div style={{ padding: "8px 16px 14px", display: "flex", alignItems: "center", gap: 11, borderBottom: "1px solid #E3EAF7", background: "#FFFFFFCC" }}>
        <Link href={`/child/task/${taskId}`} className="pp-icon-btn">
          <i className={dir === "rtl" ? "ph ph-arrow-right" : "ph ph-arrow-left"} style={{ fontSize: 17 }} />
        </Link>
        <span style={{ width: 38, height: 38, borderRadius: 13, background: "var(--pp-purple)", display: "grid", placeItems: "center" }}>
          <i className="ph-fill ph-sparkle" style={{ fontSize: 19, color: "#fff" }} />
        </span>
        <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{t("pipName")}</span>
          <span style={{ fontSize: 11.5, color: "var(--pp-green)" }}>{t("pipStatus")}</span>
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#7A4E00", background: "linear-gradient(120deg,#FFD873,#FFB020)", padding: "5px 9px", borderRadius: 99 }}>PRO</span>
      </div>

      <div style={{ flex: 1, padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
        {loadingHistory && <p className="pp-empty">{t("loading")}</p>}
        {!loadingHistory && messages.length === 0 && (
          <div style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
            <span style={{ width: 30, height: 30, borderRadius: 11, background: "var(--pp-purple)", display: "grid", placeItems: "center", flex: "none" }}>
              <i className="ph-fill ph-sparkle" style={{ fontSize: 15, color: "#fff" }} />
            </span>
            <div style={{ maxWidth: "78%", background: "#fff", borderRadius: 20, padding: "13px 15px", fontSize: 14.5, boxShadow: "var(--pp-shadow-sm)" }}>
              {t("pipHello")}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 9 }}>
            <div
              style={{
                maxWidth: "78%",
                whiteSpace: "pre-wrap",
                background: m.role === "user" ? "var(--pp-blue)" : "#fff",
                color: m.role === "user" ? "#fff" : "var(--pp-text)",
                borderRadius: 20,
                padding: "13px 15px",
                fontSize: 14.5,
                lineHeight: 1.55,
                boxShadow: m.role === "assistant" ? "var(--pp-shadow-sm)" : "none",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {[t("suggest1"), t("suggest2"), t("suggest3")].map((s) => (
            <button key={s} onClick={() => send(s)} style={{ border: "1.5px solid #D6C9F7", background: "#fff", color: "#5B3FC4", fontSize: 13, fontWeight: 500, padding: "9px 13px", borderRadius: 99, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        style={{ padding: "10px 14px 16px", background: "#FFFFFFE6", borderTop: "1px solid #E3EAF7", display: "flex", gap: 9, alignItems: "center" }}
      >
        <input
          className="pp-input"
          style={{ borderRadius: 99, flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatPlaceholder")}
          disabled={loading}
        />
        <button type="submit" disabled={loading} style={{ width: 46, height: 46, flex: "none", borderRadius: "50%", border: "none", background: "var(--pp-purple)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
          <i className={dir === "rtl" ? "ph-fill ph-paper-plane-tilt" : "ph-fill ph-paper-plane-right"} style={{ fontSize: 19 }} />
        </button>
      </form>
    </div>
  );
}
