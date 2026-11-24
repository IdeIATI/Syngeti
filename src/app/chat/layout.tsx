import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionGuard } from "@/components/SessionGuard";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "CONNECT CHAT • Syngeti",
  description: "Comunicação corporativa e mensageria em tempo real do Syngeti",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Connect Chat",
  },
  icons: {
    icon: "/branding/connect-chat-192.png",
    shortcut: "/branding/connect-chat-192.png",
    apple: "/branding/connect-chat-192.png",
  },
};

export default async function StandaloneChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/chat");
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground select-none">
      <SessionGuard />
      {children}
    </div>
  );
}
