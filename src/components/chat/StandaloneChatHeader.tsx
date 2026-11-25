"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { 
  Download, 
  ExternalLink, 
  Bell, 
  BellOff, 
  LogOut, 
  Sparkles,
  ShieldCheck,
  Check,
  MonitorDown,
  X
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { UserAvatar } from "@/components/UserAvatar";
import { 
  promptPWAInstall, 
  subscribeToInstallPrompt, 
  isRunningStandalone,
  requestNotificationPermission 
} from "@/lib/chatNotificationCoordination";

interface StandaloneChatHeaderProps {
  currentUser: {
    id: string;
    name: string;
    avatar: string | null;
  };
  connectionState?: "realtime" | "polling" | "connecting" | "offline";
}

export function StandaloneChatHeader({
  currentUser,
  connectionState = "realtime",
}: StandaloneChatHeaderProps) {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  useEffect(() => {
    setIsStandalone(isRunningStandalone());

    const unsubscribe = subscribeToInstallPrompt((available) => {
      setCanInstall(available);
    });

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsGranted(Notification.permission === "granted");
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleInstallClick = async () => {
    const success = await promptPWAInstall();
    if (success) {
      setInstallSuccess(true);
      setCanInstall(false);
      setTimeout(() => setInstallSuccess(false), 4000);
    }
  };

  const handleToggleNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationsGranted(perm === "granted");
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("syngeti_session_active");
      sessionStorage.removeItem("syngeti_login_time");
      sessionStorage.removeItem("syngeti_login_entry_consumed");
    }
    signOut({ callbackUrl: "/login?callbackUrl=/chat" });
  };

  const statusConfig = {
    realtime: { dot: "bg-emerald-500", text: "Sincronizado em Tempo Real", textColor: "text-muted-foreground" },
    connecting: { dot: "bg-amber-500 animate-pulse", text: "Conectando ao canal seguro...", textColor: "text-amber-500" },
    polling: { dot: "bg-amber-500", text: "Sincronização de contingência", textColor: "text-amber-500" },
    offline: { dot: "bg-red-500", text: "Sem conexão (aguardando rede)", textColor: "text-red-500" },
  }[connectionState];

  return (
    <>
      <header className="h-[56px] sm:h-[62px] bg-background border-b border-border flex items-center justify-between px-3 sm:px-5 select-none shrink-0 z-30 transition-colors duration-200">
        
        {/* Lado Esquerdo: Identidade do Aplicativo Independente */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-xs border border-border/80 bg-surface shrink-0 flex items-center justify-center">
            <Image
              src="/branding/connect-chat-192.png"
              alt="CONNECT CHAT — SYNGETI"
              width={36}
              height={36}
              className="w-full h-full object-cover"
              priority
            />
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${statusConfig.dot} ring-2 ring-background`} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black tracking-wider text-foreground uppercase truncate">
                CONNECT CHAT — SYNGETI
              </h1>
              {isStandalone ? (
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  App Instalado
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  Independente
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] truncate ${statusConfig.textColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} shrink-0`} />
              <span className="truncate">{statusConfig.text}</span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Ações, Instalação, Notificações, Tema e Perfil */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Botão Instalar CONNECT CHAT quando suportado pelo Chrome/Edge */}
          {canInstall && !isStandalone && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer animate-in fade-in"
              title="Instalar CONNECT CHAT no Windows como aplicativo independente"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Instalar CONNECT CHAT</span>
            </button>
          )}

          {/* Fallback de instrução para criar atalho quando o navegador não disparar prompt */}
          {!canInstall && !isStandalone && !installSuccess && (
            <button
              type="button"
              onClick={() => setShowShortcutHelp(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover text-xs font-semibold transition-colors cursor-pointer"
              title="Como criar atalho na Área de Trabalho e Barra de Tarefas"
            >
              <MonitorDown className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Criar Atalho</span>
            </button>
          )}

          {/* Feedback de sucesso pós-instalação */}
          {installSuccess && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-bold animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Instalado!</span>
            </div>
          )}

          {/* Notificações Desktop */}
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors ${
              notificationsGranted
                ? "bg-surface text-emerald-500 border-border hover:bg-surface-hover"
                : "bg-surface text-muted-foreground border-border hover:text-foreground hover:bg-surface-hover"
            }`}
            title={notificationsGranted ? "Notificações Desktop ativadas" : "Ativar Notificações Desktop"}
            aria-label="Alternar Notificações"
          >
            {notificationsGranted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* Seletor de Tema Visual (Dark, Dlamb, Light, Tokyo Night) */}
          <ThemeSwitcher />

          {/* Atalho para abrir o ERP completo em janela/aba do navegador */}
          <a
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:p-2 rounded-xl bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors flex items-center justify-center shrink-0"
            title="Ir para o painel principal do Syngeti ERP"
            aria-label="Abrir ERP"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Separador */}
          <div className="h-5 w-[1px] bg-border mx-0.5 sm:mx-1" />

          {/* Perfil do Usuário Logado */}
          <div className="flex items-center gap-2">
            <UserAvatar
              src={currentUser.avatar}
              name={currentUser.name}
              userId={currentUser.id}
              size="sm"
              shape="circle"
            />
            <div className="text-left hidden lg:block max-w-[110px]">
              <p className="text-xs font-bold text-foreground leading-tight truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                Online
              </p>
            </div>
          </div>

          {/* Botão Sair */}
          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 sm:p-2 rounded-xl text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
            title="Encerrar sessão"
            aria-label="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Modal de Instrução de Atalho / Instalação Manual */}
      {showShortcutHelp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MonitorDown className="w-4 h-4 text-primary" />
                Instalar ou Criar Atalho no Windows
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutHelp(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-muted-foreground space-y-2.5 leading-relaxed">
              <p>Se o botão automático de instalação não aparecer (ex.: se o app já estiver instalado ou o navegador exigir instalação manual):</p>
              <ul className="list-disc pl-4 space-y-1.5 text-foreground/90">
                <li><strong>Google Chrome:</strong> Clique no ícone de instalação na barra de endereços ou em <code className="px-1 py-0.5 bg-muted rounded">⋮ &gt; Transmitir, salvar e compartilhar &gt; Instalar página como app...</code></li>
                <li><strong>Microsoft Edge:</strong> Clique em <code className="px-1 py-0.5 bg-muted rounded">⋯ &gt; Aplicativos &gt; Instalar este site como um aplicativo</code>.</li>
                <li><strong>Fixar no Windows:</strong> Após instalar, clique com o botão direito no ícone aberto na barra de tarefas e escolha <strong>Fixar na barra de tarefas</strong>.</li>
              </ul>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowShortcutHelp(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
