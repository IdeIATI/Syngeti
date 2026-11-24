"use client";

import { soundManager } from "@/lib/sound";

// Canal de comunicação inter-janelas (BroadcastChannel) para sincronização perfeita entre ERP e App PWA
const COORDINATION_CHANNEL = "connect_chat_coordination_v1";

interface NotificationPayload {
  title: string;
  body: string;
  channelId: string;
  messageId: string;
  senderId?: string;
  currentUserId: string;
  icon?: string;
}

// Armazena temporariamente o evento de instalação do PWA
let deferredInstallPrompt: any = null;
const installListeners = new Set<(canInstall: boolean) => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: any) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installListeners.forEach((fn) => fn(true));
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installListeners.forEach((fn) => fn(false));
  });
}

/**
 * Registra o Service Worker do PWA
 */
export function registerChatServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Verifica se há novas versões do service worker
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                // Novo SW instalado
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn("[PWA] Falha ao registrar Service Worker:", err);
      });
  });
}

/**
 * Hook/Listener para estado de instalação do PWA
 */
export function subscribeToInstallPrompt(callback: (canInstall: boolean) => void): () => void {
  installListeners.add(callback);
  callback(!!deferredInstallPrompt);
  return () => {
    installListeners.delete(callback);
  };
}

/**
 * Aciona o prompt nativo de instalação do PWA no Chrome / Edge
 */
export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  try {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installListeners.forEach((fn) => fn(false));
    return outcome === "accepted";
  } catch (err) {
    console.warn("[PWA] Erro ao acionar prompt de instalação:", err);
    return false;
  }
}

/**
 * Verifica se a aplicação está rodando em modo independente (PWA instalado / standalone)
 */
export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

/**
 * Solicita permissão para Notificações Desktop
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  return await Notification.requestPermission();
}

// Controle local de janelas ativas
let activeChannelInThisWindow: string | null = null;
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(COORDINATION_CHANNEL);
  } catch {}
}

/**
 * Atualiza qual canal está ativo/focado nesta janela específica
 */
export function setActiveChannelFocus(channelId: string | null): void {
  activeChannelInThisWindow = channelId;
  if (broadcastChannel && channelId) {
    try {
      broadcastChannel.postMessage({
        type: "CHANNEL_FOCUSED",
        channelId,
        isWindowFocused: document.hasFocus() && !document.hidden,
      });
    } catch {}
  }
}

/**
 * Despacha notificação inteligente sem duplicidades entre abas/janelas
 */
export function dispatchSmartNotification(payload: NotificationPayload): void {
  if (typeof window === "undefined") return;

  // 1. Não notifica mensagens do próprio usuário logado
  if (payload.senderId && payload.senderId === payload.currentUserId) {
    return;
  }

  // 2. Respeita canais silenciados no localStorage
  try {
    const rawMuted = localStorage.getItem("connect_chat_muted");
    if (rawMuted) {
      const mutedList: string[] = JSON.parse(rawMuted);
      if (Array.isArray(mutedList) && mutedList.includes(payload.channelId)) {
        return;
      }
    }
  } catch {}

  // 3. Se a janela atual está visível, com foco e na conversa da mensagem:
  // Toca o som (se ativado), mas NÃO dispara notificação de sistema pop-up
  const isCurrentlyReadingHere =
    document.hasFocus() && !document.hidden && activeChannelInThisWindow === payload.channelId;

  if (isCurrentlyReadingHere) {
    const soundOn = localStorage.getItem("connect_chat_sound") !== "false";
    if (soundOn) {
      soundManager.playMessageReceived();
    }
    // Avisa as outras janelas que a mensagem já foi visualizada
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({
          type: "MESSAGE_ALREADY_VIEWED",
          messageId: payload.messageId,
        });
      } catch {}
    }
    return;
  }

  // 4. Bloqueio anti-duplicidade cross-window (se outra janela já notificou nos últimos 5 segundos, ignora)
  const lockKey = `notified_msg_${payload.messageId}`;
  try {
    if (localStorage.getItem(lockKey)) {
      return;
    }
    localStorage.setItem(lockKey, String(Date.now()));
    setTimeout(() => {
      try {
        localStorage.removeItem(lockKey);
      } catch {}
    }, 6000);
  } catch {}

  // 5. Toca som de nova mensagem se habilitado
  const soundOn = localStorage.getItem("connect_chat_sound") !== "false";
  if (soundOn) {
    soundManager.playMessageReceived();
  }

  // 6. Dispara notificação desktop se ativada e permitida
  const desktopOn = localStorage.getItem("connect_chat_desktop") !== "false";
  if (!desktopOn || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const privacy = localStorage.getItem("connect_chat_privacy") === "true";
  const finalTitle = privacy ? "CONNECT CHAT" : payload.title;
  const finalBody = privacy ? "Nova mensagem recebida no CONNECT CHAT" : payload.body;

  try {
    const n = new Notification(finalTitle, {
      body: finalBody,
      tag: `connect-chat-${payload.channelId}`,
      icon: payload.icon || "/branding/connect-chat-192.png",
      badge: "/branding/connect-chat-192.png",
    });

    n.onclick = () => {
      window.focus();
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: "SWITCH_TO_CHANNEL",
          channelId: payload.channelId,
        });
      }
      n.close();
    };
  } catch {
    // Fallback via Service Worker se a API nativa falhar no contexto atual
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(finalTitle, {
          body: finalBody,
          tag: `connect-chat-${payload.channelId}`,
          icon: payload.icon || "/branding/connect-chat-192.png",
          badge: "/branding/connect-chat-192.png",
          data: { channelId: payload.channelId, url: "/chat" },
        });
      });
    }
  }
}
