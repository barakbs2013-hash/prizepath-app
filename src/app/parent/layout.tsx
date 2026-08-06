import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { ParentTabBar } from "@/components/ParentTabBar";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/signin");
  if (profile.role !== "parent") redirect("/child/home");

  return (
    <div className="pp-shell">
      <div className="pp-container">
        {children}
        <ParentTabBar />
      </div>
    </div>
  );
}
