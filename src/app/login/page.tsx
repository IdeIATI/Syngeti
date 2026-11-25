"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Network, Mail, Lock, Eye, EyeOff, ArrowRight, Check, KeyRound, X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [branding, setBranding] = useState<any>({
    loginLogo: '/api/branding/logo',
    appIcon: '/branding/logo-icon.png',
    appLogo: '/branding/logo-wordmark.png',
  });
  const [imageError, setImageError] = useState(false);

  // Estados da Recuperação de Senha
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("syngeti_session_active");
      sessionStorage.removeItem("syngeti_login_time");
      sessionStorage.removeItem("syngeti_login_entry_consumed");

      // Carrega usuário salvo se a opção Lembrar-me estiver ativa
      const savedUser = localStorage.getItem("syngeti_saved_user");
      const isRemembered = localStorage.getItem("syngeti_remember_me") === "true";
      if (savedUser && isRemembered) {
        setEmail(savedUser);
        setRememberMe(true);
      }
    }

    fetch("/api/branding")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setBranding(data);
          setImageError(false);
        }
      })
      .catch(console.error);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError) {
        if (urlError === "Configuration") {
          setError("Erro de configuração do servidor de autenticação. Por favor, verifique as credenciais ou contate o suporte.");
        } else if (urlError === "CredentialsSignin") {
          setError("Credenciais inválidas. Verifique seu login e senha.");
        } else if (urlError === "SessionRequired") {
          setError("Sessão expirada. Por favor, identifique-se novamente.");
        } else {
          setError("Falha na autenticação. Tente novamente.");
        }
      }
    }
  }, []);

  const handleToggleRememberMe = () => {
    setRememberMe(prev => {
      const next = !prev;
      if (!next && typeof window !== "undefined") {
        localStorage.removeItem("syngeti_saved_user");
        localStorage.removeItem("syngeti_remember_me");
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result) {
        setError("Não foi possível conectar ao servidor de autenticação.");
        setLoading(false);
        return;
      }

      if (result.error) {
        setError("E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }

      // Salva ou remove o usuário no localStorage conforme opção Lembrar-me
      if (typeof window !== "undefined") {
        if (rememberMe && email.trim()) {
          localStorage.setItem("syngeti_saved_user", email.trim());
          localStorage.setItem("syngeti_remember_me", "true");
        } else {
          localStorage.removeItem("syngeti_saved_user");
          localStorage.removeItem("syngeti_remember_me");
        }

        // Ativa flag de sessão para a aba do navegador e libera a primeira transição pós-login
        sessionStorage.setItem("syngeti_session_active", "true");
        sessionStorage.setItem("syngeti_login_time", Date.now().toString());
        sessionStorage.removeItem("syngeti_login_entry_consumed");
      }

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const isStandalonePWA =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as any).standalone === true);
      const callback = params?.get("callbackUrl") || (isStandalonePWA ? "/chat" : "/dashboard");
      
      // Transição instantânea SPA via Next.js router (< 50ms, sem reload branco)
      router.replace(callback);

      // Fallback resiliente caso o navegador demore para processar a rota SPA
      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname === "/login") {
          window.location.href = callback;
        }
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Erro inesperado ao realizar login.");
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");

    if (!forgotIdentifier.trim()) {
      setForgotError("Informe seu e-mail ou nome de usuário.");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao processar solicitação.");
      }

      setForgotMessage(data.message || "Solicitação encaminhada com sucesso.");
    } catch (err: any) {
      setForgotError(err?.message || "Erro ao conectar ao servidor.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background text-foreground font-sans selection:bg-primary-soft">
      {/* Seletor de tema acessível no canto superior direito */}
      <div className="fixed top-4 right-4 z-40">
        <ThemeSwitcher />
      </div>

      {/* Lado Esquerdo - Branding */}
      <div 
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-border bg-surface-2 bg-cover bg-center relative"
        style={{ backgroundImage: branding?.loginBackground ? `url(${branding.loginBackground})` : 'none' }}
      >
        {/* Overlay caso haja imagem de fundo para garantir legibilidade */}
        {branding?.loginBackground && (
          <div className="absolute inset-0 bg-background/85 backdrop-blur-[2px] z-0"></div>
        )}

        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {branding?.loginLogo && !imageError ? (
              <img 
                src={branding.loginLogo} 
                alt="SyngeTI — Sistema de Integração e Gestão de TI" 
                onError={() => setImageError(true)}
                className="w-full max-w-[320px] h-auto max-h-[280px] object-contain object-left" 
              />
            ) : (
              <>
                <svg width="40" height="46" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M50 0L93.3013 25V75L50 100L6.69873 75V25L50 0Z" fill="#081522"/>
                  <path d="M75 37.5L50 25L25 37.5V62.5L50 75L75 62.5V37.5Z" fill="url(#paint0_linear)"/>
                  <path d="M50 25V75" stroke="#22D3EE" strokeWidth="8"/>
                  <path d="M25 37.5L50 50L75 37.5" stroke="#0EA5E9" strokeWidth="8"/>
                  <path d="M25 62.5L50 50L75 62.5" stroke="#0EA5E9" strokeWidth="8"/>
                  <defs>
                    <linearGradient id="paint0_linear" x1="25" y1="25" x2="75" y2="75" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0EA5E9"/>
                      <stop offset="1" stopColor="#22D3EE"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex flex-col">
                  <span className="font-display text-3xl font-bold tracking-wide text-foreground leading-none">
                    Synge<span className="text-primary">TI</span>
                  </span>
                  <span className="text-xs tracking-wide text-text-secondary font-medium mt-1">
                    Sistema de Integração e Gestão de TI
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Copy / Texto Central */}
          <div className="max-w-lg">
            <h1 className="font-display text-4xl lg:text-[42px] font-bold text-foreground leading-tight tracking-tight mb-4">
              GESTÃO INTELIGENTE<br />
              PARA A SUA <span className="text-primary">TI</span>
            </h1>
            <p className="mt-4 text-text-secondary text-base lg:text-lg leading-relaxed">
              Sistema de Integração e Gestão de TI. Centralize chamados, monitore ativos e gerencie toda a operação tecnológica em uma plataforma unificada e de alta legibilidade.
            </p>
          </div>

          {/* Rodapé do lado esquerdo */}
          <div className="text-xs text-muted-foreground font-medium">
            © 2026 SyngeTI — Sistema de Integração e Gestão de TI. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-4 sm:p-6 md:p-8 bg-background">
        <div className="w-full max-w-md bg-surface p-6 sm:p-8 md:p-10 rounded-2xl border border-border shadow-xl">
          
          {/* Logo com ícone visível no Mobile / Smartphone (< lg) */}
          <div className="flex lg:hidden flex-col items-center justify-center mb-6">
            {branding?.loginLogo && !imageError ? (
              <img 
                src={branding.loginLogo} 
                alt="SyngeTI — Sistema de Integração e Gestão de TI" 
                onError={() => setImageError(true)}
                className="h-14 sm:h-16 w-auto max-w-[220px] object-contain mb-1" 
              />
            ) : (
              <div className="flex items-center gap-3 py-1">
                <svg width="36" height="42" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0" aria-hidden="true">
                  <path d="M50 0L93.3013 25V75L50 100L6.69873 75V25L50 0Z" fill="#081522"/>
                  <path d="M75 37.5L50 25L25 37.5V62.5L50 75L75 62.5V37.5Z" fill="url(#paint0_linear_mobile)"/>
                  <path d="M50 25V75" stroke="#22D3EE" strokeWidth="8"/>
                  <path d="M25 37.5L50 50L75 37.5" stroke="#0EA5E9" strokeWidth="8"/>
                  <path d="M25 62.5L50 50L75 62.5" stroke="#0EA5E9" strokeWidth="8"/>
                  <defs>
                    <linearGradient id="paint0_linear_mobile" x1="25" y1="25" x2="75" y2="75" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0EA5E9"/>
                      <stop offset="1" stopColor="#22D3EE"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex flex-col text-left">
                  <span className="font-display text-2xl font-bold tracking-wide text-foreground leading-none">
                    Synge<span className="text-primary">TI</span>
                  </span>
                  <span className="text-xs text-text-secondary font-medium mt-1">
                    Sistema de Integração e Gestão de TI
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6 sm:mb-8 text-center lg:text-left">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-1.5">Bem-vindo de volta</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Insira suas credenciais para acessar a plataforma</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Campo E-mail */}
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-xs font-semibold text-foreground ml-1 block">E-mail ou Usuário</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="login-email"
                  type="text"
                  required
                  value={email}
                  onFocus={() => {
                    try { router.prefetch("/dashboard"); } catch {}
                  }}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value.length > 2) {
                      try { router.prefetch("/dashboard"); } catch {}
                    }
                  }}
                  className="w-full bg-input border border-border text-foreground text-sm rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors placeholder:text-muted-foreground"
                  placeholder="ex: joao.marcos ou compras@dlamb.ind.br"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="login-password" className="text-xs font-semibold text-foreground ml-1 block">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onFocus={() => {
                    try { router.prefetch("/dashboard"); } catch {}
                  }}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input border border-border text-foreground text-sm rounded-xl py-3 pl-11 pr-12 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors placeholder:text-muted-foreground"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Lembrar / Esqueceu a Senha */}
            <div className="flex items-center justify-between pt-1">
              <button 
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={handleToggleRememberMe}
                className="flex items-center gap-2 cursor-pointer group select-none text-left"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary border-primary' : 'border-border-strong bg-input group-hover:border-primary'}`}>
                  {rememberMe && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="text-xs text-text-secondary group-hover:text-foreground transition-colors">Lembrar-me</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsForgotOpen(true);
                  setForgotError("");
                  setForgotMessage("");
                  setForgotIdentifier("");
                }}
                className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>

            {error && (
              <div className="text-danger text-sm text-center font-medium bg-danger/10 py-2.5 px-3 rounded-xl border border-danger/25" role="alert">
                {error}
              </div>
            )}

            {/* Botão de Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-sm mt-4 cursor-pointer"
            >
              {loading ? "Acessando..." : "Acessar Sistema"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

          </form>
        </div>
      </div>

      {/* Modal - Recuperação de Senha */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface p-8 rounded-2xl border border-border-strong shadow-2xl relative">
            
            {/* Fechar Modal */}
            <button
              type="button"
              onClick={() => setIsForgotOpen(false)}
              aria-label="Fechar modal de recuperação de senha"
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-surface-hover cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Recuperação de Acesso
              </span>
            </div>

            <h3 className="font-display text-xl font-bold text-foreground mb-2">Esqueceu sua senha?</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              Informe seu e-mail ou nome de usuário cadastrado. Uma notificação será encaminhada à administração de TI para validação e atendimento seguro.
            </p>

            {forgotMessage ? (
              <div className="space-y-6">
                <div className="p-4 bg-success/10 border border-success/25 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-success font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Solicitação Encaminhada</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {forgotMessage}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Concluir e Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotError && (
                  <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl flex items-center gap-2.5 text-danger text-xs font-medium" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="forgot-identifier" className="text-xs font-semibold text-foreground ml-1 block">E-mail ou Usuário</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      id="forgot-identifier"
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="ex: joao.marcos ou compras@dlamb.ind.br"
                      className="w-full bg-input border border-border text-foreground text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors placeholder:text-muted-foreground"
                      disabled={forgotLoading}
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    disabled={forgotLoading}
                    className="w-1/3 bg-surface-2 hover:bg-surface-3 text-foreground text-xs font-semibold py-3 rounded-xl border border-border transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotIdentifier.trim()}
                    className="w-2/3 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <span>Enviar Solicitação</span>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
