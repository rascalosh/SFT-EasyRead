import DashboardShell from "@/components/global/DashboardShell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
