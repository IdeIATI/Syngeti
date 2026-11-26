"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Server, HeadphonesIcon, 
  AlertTriangle, ArrowRightLeft, CalendarClock, 
  Briefcase, MessageSquare, BookOpen, Settings, 
  Users, ChevronDown, ChevronRight, FileText, Database, Shield, X, Monitor, Sparkles
} from "lucide-react";
import { useMobileMenu } from "./AuthenticatedShell";
import { useAuthUser } from "@/contexts/AuthUserContext";
import { canRead, isAdminRole } from "@/lib/permissions";
import { SyngetiIcon, SyngetiWordmark } from "@/components/branding/SyngetiBrand";

// Cache em memória do branding para evitar fetch repetido a cada troca de aba
let brandingMemoryCache: any = null;
let brandingCacheFetching = false;

export function Sidebar({ initialBranding }: { initialBranding?: any } = {}) {
  const router = useRouter();
  const { user } = useAuthUser();
  const { isMobileOpen, closeMobileMenu, navigatingTo, startNavigation, chatUnreadCount } = useMobileMenu();
  const pathname = usePathname();

  // Prefetch inteligente sob demanda ao aproximar o mouse (elimina a latência de clique sem causar prefetch storm inicial)
  const prefetchRoute = useCallback((href?: string) => {
    if (href && href !== "#" && !href.startsWith("http")) {
      try {
        router.prefetch(href);
      } catch {}
    }
  }, [router]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => ({
    'Gestão de Acessos': pathname?.startsWith('/pc-access') || false,
    'Configurações': pathname?.startsWith('/settings') || false,
  }));
  if (initialBranding && !brandingMemoryCache) {
    brandingMemoryCache = initialBranding;
  }
  const [branding, setBranding] = useState<any>(initialBranding || brandingMemoryCache);
  const [logoError, setLogoError] = useState(false);
  const [iconError, setIconError] = useState(false);
  const hasFetched = useRef(!!initialBranding || !!brandingMemoryCache);

  useEffect(() => {
    const fetchBrandingData = (force = false) => {
      // Usa cache em memória — evita request HTTP a cada troca de aba
      if (!force && brandingMemoryCache) {
        setBranding(brandingMemoryCache);
        return;
      }
      // Evita requests duplicadas simultâneas
      if (brandingCacheFetching && !force) return;

      brandingCacheFetching = true;
      fetch("/api/branding")
        .then(res => res.json())
        .then(data => {
          brandingMemoryCache = data;
          brandingCacheFetching = false;
          setBranding(data);
          setLogoError(false);
          setIconError(false);
        })
        .catch(err => {
          brandingCacheFetching = false;
          console.error(err);
        });
    };

    // Só faz fetch na primeira montagem real se não veio pelo SSR
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchBrandingData();
    }

    // Quando o usuário atualiza o branding, força re-fetch
    const handleBrandingUpdated = () => {
      brandingMemoryCache = null;
      fetchBrandingData(true);
    };

    window.addEventListener("branding-updated", handleBrandingUpdated);
    return () => window.removeEventListener("branding-updated", handleBrandingUpdated);
  }, []);

  // Aquecimento inteligente do router cache para transição instantânea (< 50ms) entre todos os módulos principais
  useEffect(() => {
    const warmUpTimer = setTimeout(() => {
      const allRoutes = [
        '/dashboard',
        '/service-desk',
        '/cmdb',
        '/cmdb/stock',
        '/pc-access',
        '/projects',
        '/contracts',
        '/users',
        '/connect',
        '/knowledge',
        '/sentinela',
        '/settings',
      ];
      allRoutes.forEach((route, idx) => {
        setTimeout(() => {
          try {
            router.prefetch(route);
          } catch {}
        }, idx * 100);
      });
    }, 1200);

    return () => clearTimeout(warmUpTimer);
  }, [router]);

  // Expande automaticamente apenas o menu da rota ativa, mantendo os demais recolhidos
  useEffect(() => {
    if (pathname?.startsWith("/cmdb")) {
      setExpandedMenus(prev => ({ ...prev, "CMDB / ESTOQUE": true }));
    } else if (pathname?.startsWith("/pc-access")) {
      setExpandedMenus(prev => ({ ...prev, "Gestão de Acessos": true }));
    } else if (pathname?.startsWith("/settings")) {
      setExpandedMenus(prev => ({ ...prev, "Configurações": true }));
    }
  }, [pathname]);

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const isNavActive = (path: string) => {
    const current = navigatingTo || pathname || "";
    if (path === "/cmdb") {
      return current === "/cmdb" || (current.startsWith("/cmdb") && !current.startsWith("/cmdb/stock"));
    }
    if (path === "/cmdb/stock") {
      return current.startsWith("/cmdb/stock");
    }
    if (path.includes("?")) {
      const [base, query] = path.split("?");
      if (typeof window !== "undefined") {
        return window.location.pathname === base && window.location.search.includes(query);
      }
      return current === base;
    }
    return current === path || current.startsWith(path + "/");
  };

  const navItems = [
    { 
      name: "Dashboard", 
      subtitle: "Visão geral logística",
      href: "/dashboard", 
      icon: LayoutDashboard,
      moduleId: "dashboard",
    },
    { 
      name: "CMDB / ESTOQUE", 
      subtitle: "Ativos & Peças de TI",
      icon: Server,
      moduleId: "cmdb",
      subItems: [
        { name: "Ativos & Equipamentos", href: "/cmdb", moduleId: "cmdb" },
        { name: "Peças & Estoque de TI", href: "/cmdb/stock", moduleId: "cmdb" },
      ]
    },
    { 
      name: "Service Desk", 
      subtitle: "Chamados e suporte",
      href: "/service-desk", 
      icon: HeadphonesIcon,
      moduleId: "service_desk",
    },
    { 
      name: "Gestão de Acessos", 
      subtitle: "E-mails, PCs e senhas",
      icon: Shield,
      moduleId: "pc_access",
      subItems: [
        { name: "Computadores (PCs)", href: "/pc-access", moduleId: "pc_access" },
        { name: "Contas de E-mail dos Domínios", href: "/pc-access?tab=emails", moduleId: "pc_access" },
        { name: "Colaboradores & Vínculos", href: "/pc-access?tab=collaborators", moduleId: "pc_access" },
        { name: "Trilha de Auditoria & Cofre", href: "/pc-access?tab=audit", moduleId: "pc_access" },
      ]
    },
    { 
      name: "Projetos", 
      subtitle: "Gestão e tarefas",
      href: "/projects", 
      icon: Briefcase,
      moduleId: "projects",
    },
    { 
      name: "Contratos", 
      subtitle: "Financeiro e parceiros",
      href: "/contracts", 
      icon: FileText,
      moduleId: "contracts",
    },
    { 
      name: "Usuários", 
      subtitle: "Gestão de colaboradores",
      href: "/users", 
      icon: Users,
      moduleId: "users",
    },
    { 
      name: "CONNECT CHAT", 
      subtitle: "Comunicação integrada",
      href: "/connect", 
      icon: MessageSquare,
      moduleId: "connect",
    },
    { 
      name: "Wiki TI", 
      subtitle: "Base de conhecimento",
      href: "/knowledge", 
      icon: BookOpen,
      moduleId: "knowledge",
    },
    { 
      name: "SENTINELA IA", 
      subtitle: "Auditoria & SRE contínuo",
      href: "/sentinela", 
      icon: Sparkles,
      badge: "SRE IA",
      moduleId: "sentinela",
    },
    { 
      name: "Configurações", 
      subtitle: "Sistema e segurança",
      icon: Settings,
      subItems: [
        { name: "Visão Geral", href: "/settings", moduleId: "_settings_overview" },
        { name: "Identidade Visual", href: "/settings/branding", moduleId: "branding" },
        { name: "Departamentos", href: "/settings/departments", moduleId: "users" },
        { name: "Perfis e Permissões", href: "/settings/roles", moduleId: "roles" },
        { name: "Recuperação de Senha", href: "/settings/password-resets", moduleId: "users_or_roles" },
      ]
    },
  ];

  // Filtra abas e subitens da Sidebar de acordo com o perfil/permissões do usuário logado
  const hasUnrestrictedAdmin = isAdminRole(user?.role) || !user?.permissions;
  const canViewModule = (moduleId?: string): boolean => {
    if (hasUnrestrictedAdmin || !moduleId) return true;
    if (moduleId === "users_or_roles") {
      return canRead(user.permissions, "users") || canRead(user.permissions, "roles");
    }
    return canRead(user.permissions, moduleId);
  };

  const visibleNavItems = navItems
    .map((item) => {
      if (item.subItems) {
        const concreteSubs = item.subItems.filter(
          (sub) => sub.moduleId !== "_settings_overview" && canViewModule(sub.moduleId)
        );
        if (concreteSubs.length === 0) return null;
        const filteredSubs = item.subItems.filter((sub) =>
          sub.moduleId === "_settings_overview" ? concreteSubs.length > 0 : canViewModule(sub.moduleId)
        );
        return { ...item, subItems: filteredSubs };
      }
      return canViewModule(item.moduleId) ? item : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-border h-full flex flex-col transition-transform duration-300 select-none
        ${isMobileOpen ? "translate-x-0 w-[256px] shadow-2xl" : "-translate-x-full"}
        md:relative md:z-20 md:translate-x-0
        ${isCollapsed ? "md:w-[76px]" : "md:w-[256px]"}
      `}
    >
      {/* Brand Header */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'md:justify-center md:px-2' : ''} justify-between px-3.5 border-b border-border`}>
        {/* Expanded mode or Mobile drawer (always expanded on mobile) */}
        <div className={`items-center gap-3 flex-1 h-full min-w-0 mr-1.5 ${isCollapsed ? 'hidden md:hidden' : 'flex'}`}>
          {/* CAMPO SEPARADO SOMENTE PARA O ÍCONE */}
          <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
            {branding?.appIcon && !iconError ? (
              <img 
                src={branding.appIcon} 
                alt="Ícone SyngeTI" 
                onError={() => setIconError(true)}
                className="w-full h-full object-contain" 
              />
            ) : (
              <SyngetiIcon size={32} className="shrink-0" />
            )}
          </div>

          {/* ÁREA DO LOGOTIPO */}
          <div className="flex-1 h-full flex items-center overflow-hidden min-w-0">
            {branding?.appLogo && !logoError ? (
              <img 
                src={branding.appLogo} 
                alt="Logotipo SyngeTI" 
                onError={() => setLogoError(true)}
                className="max-h-[42px] w-auto max-w-full object-contain object-left transition-all" 
              />
            ) : (
              <SyngetiWordmark variant="sidebar" />
            )}
          </div>
        </div>

        {/* Collapsed Mode (Desktop only) */}
        {isCollapsed && (
          <div className="hidden md:flex items-center justify-center w-full">
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
              {branding?.appIcon && !iconError ? (
                <img 
                  src={branding.appIcon} 
                  alt="Ícone SyngeTI" 
                  onError={() => setIconError(true)}
                  className="w-full h-full object-contain" 
                />
              ) : (
                <SyngetiIcon size={32} className="shrink-0" />
              )}
            </div>
          </div>
        )}

        {/* Mobile close drawer button */}
        <button
          type="button"
          onClick={closeMobileMenu}
          className="md:hidden w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ml-auto shrink-0"
          title="Fechar menu"
          aria-label="Fechar menu lateral"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Desktop collapse/expand button */}
        <button 
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-7 h-7 rounded bg-surface border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors shrink-0"
          title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-5 ${isCollapsed ? 'md:px-2 px-3' : 'px-3'} space-y-1.5 custom-scrollbar`}>
        {visibleNavItems.map((item) => {
          const hasSubItems = !!item.subItems;
          const active = hasSubItems 
            ? item.subItems!.some(sub => isNavActive(sub.href))
            : item.href && isNavActive(item.href);
            
          const isExpanded = expandedMenus[item.name];

          if (isCollapsed) {
            // Renderização no modo recolhido (desktop apenas)
            const targetHref = item.href || item.subItems?.[0]?.href || '#';
            const isConnectItem = item.href === "/connect";
            return (
              <Link
                key={item.name}
                href={targetHref}
                prefetch={true}
                onMouseEnter={() => prefetchRoute(targetHref)}
                onFocus={() => prefetchRoute(targetHref)}
                onClick={() => {
                  startNavigation(targetHref);
                  closeMobileMenu();
                }}
                title={item.name}
                className={`relative flex items-center justify-center w-full h-11 rounded-xl transition-colors duration-200 ${
                  active 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {isConnectItem && chatUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-danger text-white text-[11px] font-bold leading-none shadow-sm">
                    {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                  </span>
                )}
              </Link>
            );
          }

          const isConnectItem = item.href === "/connect";
          const isPillActive = !hasSubItems && active;
          const ItemContent = (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 min-w-0">
                <item.icon className={`w-5 h-5 shrink-0 ${isPillActive ? 'text-primary-foreground' : active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <div className="flex flex-col text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold truncate ${isPillActive ? 'text-primary-foreground' : active ? 'text-primary' : 'text-foreground'}`}>
                      {item.name}
                    </span>
                    {(item as any).badge && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide shrink-0 ${
                        isPillActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-primary-soft text-primary'
                      }`}>
                        {(item as any).badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-normal leading-tight truncate ${isPillActive ? 'text-primary-foreground/85' : 'text-muted-foreground'}`}>
                    {item.subtitle}
                  </span>
                </div>
              </div>
              {isConnectItem && chatUnreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-danger text-white text-xs font-bold leading-none shrink-0">
                  {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                </span>
              )}
              {hasSubItems && (
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
              )}
            </div>
          );

          return (
            <div key={item.name} className="flex flex-col">
              {hasSubItems ? (
                <button
                  type="button"
                  onMouseEnter={() => {
                    item.subItems?.forEach(sub => prefetchRoute(sub.href));
                  }}
                  onFocus={() => {
                    item.subItems?.forEach(sub => prefetchRoute(sub.href));
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleMenu(item.name);
                  }}
                  className={`w-full text-left flex items-center px-3 py-2.5 rounded-xl transition-colors duration-200 group cursor-pointer
                    ${active ? 'bg-primary-soft text-primary' : 'hover:bg-surface-hover'}`}
                >
                  {ItemContent}
                </button>
              ) : (
                <Link
                  href={item.href!}
                  prefetch={true}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
                  onClick={() => {
                    startNavigation(item.href!);
                    closeMobileMenu();
                  }}
                  className={`flex items-center px-3 py-2.5 rounded-xl transition-colors duration-200 group
                    ${active 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-surface-hover'
                    }`}
                >
                  {ItemContent}
                </Link>
              )}

              {/* SubItems rendering */}
              {hasSubItems && isExpanded && (
                <div className="mt-1 flex flex-col space-y-1 relative">
                  <div className="absolute left-[21px] top-0 bottom-2 w-px bg-border/60"></div>
                  
                  {item.subItems!.map((subItem) => {
                    const subActive = isNavActive(subItem.href);
                    return (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        prefetch={true}
                        onMouseEnter={() => prefetchRoute(subItem.href)}
                        onFocus={() => prefetchRoute(subItem.href)}
                        onClick={() => {
                          startNavigation(subItem.href);
                          closeMobileMenu();
                        }}
                        className={`pl-11 pr-3 py-2 text-xs font-medium rounded-lg transition-colors duration-200
                          ${subActive 
                            ? 'bg-primary-soft text-primary font-semibold' 
                            : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
                          }`}
                      >
                        {subItem.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
