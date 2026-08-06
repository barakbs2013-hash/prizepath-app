"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";

export function MarkAllReadButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      style={{ border: "none", background: "none", color: "var(--pp-blue)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
      onClick={async () => {
        await api.patch("/api/notifications");
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
