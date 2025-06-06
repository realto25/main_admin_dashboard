import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StagewiseToolbar } from "@stagewise/toolbar-next";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <html lang="en">
      <body className={`${dmSans.variable} antialiased`}>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <main>
            <SidebarTrigger />
            {children}
          </main>
          {process.env.NODE_ENV === "development" && (
            <StagewiseToolbar config={{ plugins: [] }} />
          )}
        </SidebarProvider>
      </body>
    </html>
  );
}
