import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg-light">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
