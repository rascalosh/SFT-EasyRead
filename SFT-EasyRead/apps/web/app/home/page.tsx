import { Dashboard } from "../../components/dashboard/Dashboard";
import { Sidebar } from "../../components/layout/Sidebar";

export default function HomePage() {
  return (
    <main className="h-screen overflow-hidden bg-[#f8faff] text-slate-800">
      <div className="flex h-full">
        <Sidebar />

        <section className="min-w-0 flex-1 overflow-y-auto">
          {/* Header */}
          <Dashboard />
        </section>
      </div>
    </main>
  );
}