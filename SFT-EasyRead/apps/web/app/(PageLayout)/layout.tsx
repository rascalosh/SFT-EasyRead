import { Sidebar } from "../../components/layout/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-screen overflow-hidden bg-[#f8faff] text-slate-800">
      <div className="flex h-full">
        <Sidebar />

        <section className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </section>
      </div>
    </main>
  );
}