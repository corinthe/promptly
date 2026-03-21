import type { Metadata } from "next";
import { RoleProvider } from "@/components/role-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Promptly — Librairie de prompts IA",
  description: "Découvrez, créez et partagez des prompts IA au sein de votre organisation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="h-full">
        <RoleProvider>
          <div className="flex h-full">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              <Topbar />
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
