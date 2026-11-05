"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string | null;
  company_id?: string;
}

interface AuthUserContextType {
  user: AuthUser;
  updateUser: (partial: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
}

const AuthUserContext = createContext<AuthUserContextType | null>(null);

export function AuthUserProvider({
  initialUser,
  children,
}: {
  initialUser: AuthUser;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser>(initialUser);

  // Mantém sincronizado se o servidor enviar dados atualizados
  useEffect(() => {
    setUser((prev) => ({
      ...prev,
      ...initialUser,
      // Preserva avatar mais atualizado caso o cliente já tenha trocado
      avatar: initialUser.avatar || prev.avatar,
    }));
  }, [initialUser]);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => ({ ...prev, ...partial }));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${user.id || "me"}`);
      if (res.ok) {
        const data = await res.json();
        setUser((prev) => ({
          ...prev,
          name: data.name || prev.name,
          email: data.email || prev.email,
          avatar: data.avatar
            ? (data.avatar.startsWith("http") && data.avatar.length < 300)
              ? data.avatar
              : `/api/users/${data.id}/avatar?v=${Date.now()}`
            : null,
          role: data.role?.name || prev.role,
        }));
      }
    } catch (e) {
      console.warn("Falha ao recarregar usuário autenticado:", e);
    }
  }, [user.id]);

  // Escuta o evento global 'user-avatar-updated' para sincronização reativa imediata
  useEffect(() => {
    const handleAvatarUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId?: string; avatarUrl?: string }>;
      if (customEvent.detail) {
        if (!customEvent.detail.userId || customEvent.detail.userId === user.id) {
          updateUser({ avatar: customEvent.detail.avatarUrl || null });
        }
      }
    };

    window.addEventListener("user-avatar-updated", handleAvatarUpdate);
    return () => window.removeEventListener("user-avatar-updated", handleAvatarUpdate);
  }, [user.id, updateUser]);

  return (
    <AuthUserContext.Provider value={{ user, updateUser, refreshUser }}>
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuthUser(): AuthUserContextType {
  const context = useContext(AuthUserContext);
  if (!context) {
    throw new Error("useAuthUser deve ser utilizado dentro de um AuthUserProvider");
  }
  return context;
}
