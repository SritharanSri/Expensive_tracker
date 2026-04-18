import { AppShell } from "@/components/AppShell";

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(16,185,129,0.06) 0%, transparent 60%), #F1F5F9",
      }}
    >
      <AppShell />
    </main>
  );
}
