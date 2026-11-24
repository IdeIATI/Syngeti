"use client";

import { useEffect, useState } from "react";
import ChatInterface from "@/app/(authenticated)/connect/ChatInterface";
import { StandaloneChatHeader } from "@/components/chat/StandaloneChatHeader";
import { registerChatServiceWorker, setActiveChannelFocus } from "@/lib/chatNotificationCoordination";

interface StandaloneChatWrapperProps {
  currentUser: { id: string; name: string; avatar: string | null };
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    job_title: string | null;
    status?: string;
    last_seen_at?: Date | null;
    isOnline?: boolean;
    lastSeen?: number | null;
  }>;
  channels: any[];
  mainChannelId: string;
  departments?: Array<{ id: string; name: string }>;
}

export function StandaloneChatWrapper({
  currentUser,
  users,
  channels,
  mainChannelId,
  departments = [],
}: StandaloneChatWrapperProps) {
  const [connectionState, setConnectionState] = useState<"realtime" | "polling" | "connecting" | "offline">("realtime");

  // Registro do Service Worker do PWA ao inicializar a tela do app
  useEffect(() => {
    registerChatServiceWorker();

    const handleFocus = () => {
      setActiveChannelFocus(mainChannelId);
    };

    const handleBlur = () => {
      setActiveChannelFocus(null);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [mainChannelId]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground">
      {/* Barra superior limpa e exclusiva do App Independente (sem menus do ERP) */}
      <StandaloneChatHeader 
        currentUser={currentUser} 
        connectionState={connectionState}
      />

      {/* Interface central do Connect Chat em tela cheia (100% responsiva) */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <ChatInterface
          currentUser={currentUser}
          users={users}
          channels={channels}
          mainChannelId={mainChannelId}
          departments={departments}
        />
      </main>
    </div>
  );
}
