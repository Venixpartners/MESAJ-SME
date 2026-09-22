import { AppShell } from "@/components/AppShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell variant="client">
      {children}
    </AppShell>
  );
}
