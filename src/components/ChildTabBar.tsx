"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

const TABS = [
  { href: "/child/home", icon: "ph-house", labelKey: "today" as const, match: "/child/home" },
  { href: "/child/day", icon: "ph-calendar-check", labelKey: "myDay" as const, match: "/child/day" },
  { href: "/child/store", icon: "ph-gift", labelKey: "store" as const, match: "/child/store" },
  { href: "/child/wallet", icon: "ph-wallet", labelKey: "myPoints" as const, match: "/child/wallet" },
  { href: "/child/profile", icon: "ph-user-circle", labelKey: "childProfile" as const, match: "/child/profile" },
];

export function ChildTabBar() {
  const { t } = useLocale();
  const pathname = usePathname();
  return (
    <nav className="pp-tabbar">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className={`pp-tab ${pathname === tab.match ? "active" : ""}`}>
          <i className={`ph ${tab.icon}`} style={{ fontSize: 22 }} />
          <span>{t(tab.labelKey)}</span>
        </Link>
      ))}
    </nav>
  );
}
