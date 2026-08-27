import { Outlet } from "react-router-dom";
import AgentSidebar from "./AgentSidebar";

export default function AgentLayout() {
  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      <AgentSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden pt-[60px] md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
