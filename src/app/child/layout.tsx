import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/server/currentProfile";
import { ChildTabBar } from "@/components/ChildTabBar";

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/child-signin");
  if (profile.role !== "child") redirect("/parent/home");

  return (
    <div className="pp-shell">
      <div className="pp-container">
        {children}
        <ChildTabBar />
      </div>
    </div>
  );
}
