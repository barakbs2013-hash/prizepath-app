"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

const TABS = [
  { href: "/parent/home", icon: "ph-house", labelKey: "hiParent" as const },
  { href: "/parent/tasks", icon: "ph-list-checks", labelKey: "allTasks" as const },
  { href: "/parent/approvals", icon: "ph-hourglass-high", labelKey: "approvals" as const },
  { href: "/parent/rewards", icon: "ph-gift", labelKey: "rewardsMgmt" as const },
  { href: "/parent/settings", icon: "ph-gear", labelKey: "settings" as const },
];

export function ParentTabBar() {
  const { t } = useLocale();
  const pathname = usePathname();
  return (
    <nav className="pp-tabbar">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className={`pp-tab ${pathname === tab.href ? "active" : ""}`}>
          <i className={`ph ${tab.icon}`} style={{ fontSize: 22 }} />
          <span>{t(tab.labelKey)}</span>
        </Link>
      ))}
    </nav>
  );
}
