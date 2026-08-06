"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { api } from "@/lib/apiClient";

export function SignOutButton() {
  const { t } = useLocale();
  const router = useRouter();
  return (
    <button
      className="pp-btn pp-btn-danger"
      onClick={async () => {
        await api.post("/api/auth/signout");
        router.push("/");
        router.refresh();
      }}
    >
      <i className="ph ph-sign-out" style={{ fontSize: 18 }} />{t("signOut")}
    </button>
  );
}
