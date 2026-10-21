import { Outlet } from "react-router-dom";
import AgentSidebar from "./AgentSidebar";
import { useAuth } from "../../context/useAuth";

export default function AgentLayout() {
  const { user } = useAuth();
  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      <AgentSidebar />

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 flex flex-col h-full relative overflow-hidden pt-[60px] md:pt-0">
        <div key={`${user?.citizenId}:${user?.role}:${user?.areaId}`} className="contents"><Outlet /></div>
      </main>
    </div>
  );
}
