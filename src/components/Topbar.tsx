"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { HelpButton } from "./help/HelpButton";
import { UserAvatar } from "./UserAvatar";
import { useAuthUser } from "@/contexts/AuthUserContext";
import { Menu } from "lucide-react";

const MODULE_DATA: Record<string, { title: string, subtitle: string }> = {
  'dashboard': { title: 'Módulo de Gestão', subtitle: 'SyngeTI • Visão Geral e Indicadores' },
  'cmdb': { title: 'Módulo de Inventário', subtitle: 'SyngeTI • Gestão de Ativos e Licenças' },
  'service-desk': { title: 'Módulo de Atendimento', subtitle: 'SyngeTI • Service Desk e Chamados' },
  'problems': { title: 'Módulo de Problemas', subtitle: 'SyngeTI • Gestão de Incidentes Maiores' },
  'changes': { title: 'Módulo de Mudanças', subtitle: 'SyngeTI • Planejamento e Risco' },
  'projects': { title: 'Módulo de Projetos', subtitle: 'SyngeTI • Planejamento e Tarefas' },
  'bookings': { title: 'Módulo de Reservas', subtitle: 'SyngeTI • Alocação de Recursos' },
  'contracts': { title: 'Módulo de Contratos', subtitle: 'SyngeTI • Parceiros e Fornecedores' },
  'knowledge': { title: 'Módulo de Conhecimento', subtitle: 'SyngeTI • Wiki e Procedimentos' },
  'connect': { title: 'CONNECT CHAT', subtitle: 'SyngeTI • Comunicação Corporativa' },
  'users': { title: 'Gestão de Usuários', subtitle: 'SyngeTI • Colaboradores e Acessos' },
  'pc-access': { title: 'Gestão de Acessos', subtitle: 'SyngeTI • E-mails, PCs e Senhas' },
  'sentinela': { title: 'SyngeTI SENTINELA IA', subtitle: 'SyngeTI • Auditoria & SRE Contínuo' },
  'settings': { title: 'Módulo de Configurações', subtitle: 'SyngeTI • Sistema e Parâmetros' },
};

import { useMobileMenu } from "./AuthenticatedShell";

export function Topbar({
  userId: propUserId,
  userName: propUserName,
  avatar: propAvatar,
}: {
  userId?: string;
  userName?: string;
  avatar?: string | null;
} = {}) {
  const { user } = useAuthUser();
  const activeUserId = propUserId || user?.id;
  const activeUserName = propUserName || user?.name || "Administrador";
  const activeAvatar = propAvatar !== undefined ? propAvatar : user?.avatar;
  const activeRole = user?.role || "Admin";

  const pathname = usePathname();
  const { toggleMobileMenu } = useMobileMenu();
  const [signingOut, setSigningOut] = useState(false);
  const heartbeatStarted = useRef(false);

  useEffect(() => {
    // Inicia heartbeat uma única vez por sessão — não a cada troca de aba
    if (heartbeatStarted.current) return;
    heartbeatStarted.current = true;

    const sendHeartbeat = () => {
      // Pausa heartbeat se a aba estiver em segundo plano para economizar banda/transferência
      if (typeof document !== "undefined" && document.hidden) return;
      fetch("/api/chat/presence", { method: "POST" }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 45000);

    const handleVis = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVis);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVis);
    };
  }, []);
  
  // Format pathname into module mapping
  const pathSegments = pathname?.split('/').filter(Boolean) || [];
  const rootPath = pathSegments.length > 0 ? pathSegments[0] : 'dashboard';
  
  const moduleInfo = MODULE_DATA[rootPath] || { 
    title: 'Módulo do Sistema', 
    subtitle: 'SyngeTI • Plataforma de Gestão de TI' 
  };

  return (
    <header className="h-16 bg-bg-header border-b border-border flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 transition-colors duration-200">
      
      {/* Title area (Hamburger + Titles) */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 mr-2">
        <button 
          type="button"
          onClick={toggleMobileMenu}
          className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-foreground hover:bg-surface-3 transition-colors shrink-0 cursor-pointer"
          title="Abrir menu de navegação"
          aria-label="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col min-w-0">
          <h1 className="font-display text-base sm:text-lg font-bold text-foreground leading-tight truncate">
            {moduleInfo.title}
          </h1>
          <p className="text-xs font-medium text-muted-foreground truncate hidden sm:block">
            {moduleInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <HelpButton />
        <ThemeSwitcher />
        
        <div className="flex items-center space-x-2 sm:space-x-3 border-l border-border pl-2 sm:pl-4">
          <div className="text-sm text-right hidden lg:block">
            <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[140px]">{activeUserName}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase">{activeRole}</p>
          </div>
          
          <UserAvatar
            src={activeAvatar}
            name={activeUserName}
            userId={activeUserId}
            size="md"
            shape="circle"
          />

          <button 
            type="button"
            disabled={signingOut}
            onClick={async () => {
              if (signingOut) return;
              setSigningOut(true);
              if (typeof window !== "undefined") {
                try {
                  sessionStorage.removeItem("syngeti_session_active");
                  sessionStorage.removeItem("syngeti_login_time");
                  sessionStorage.removeItem("syngeti_login_entry_consumed");
                } catch {}
              }
              try {
                await Promise.race([
                  signOut({ redirect: false }),
                  new Promise((resolve) => setTimeout(resolve, 2500)),
                ]);
              } catch {} finally {
                if (typeof window !== "undefined") {
                  window.location.replace("/login");
                }
              }
            }}
            className="px-2 py-1 rounded text-xs font-bold text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0 disabled:opacity-60"
          >
            {signingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    </header>
  );
}
