import { Dashboard } from "../../components/dashboard/Dashboard";
import { Sidebar } from "../../components/layout/Sidebar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f8faff] text-slate-800">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <Dashboard />
        </section>
      </div>
    </main>
  );
}