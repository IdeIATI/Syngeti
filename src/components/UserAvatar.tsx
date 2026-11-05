"use client";

import React, { useState, useEffect } from "react";

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  userId?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  shape?: "circle" | "rounded";
  priority?: boolean;
}

const SIZE_MAP = {
  xs: "w-7 h-7 text-xs",
  sm: "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm",
  md: "w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm",
  lg: "w-12 h-12 sm:w-14 sm:h-14 text-base sm:text-lg",
  xl: "w-20 h-20 text-2xl font-bold",
};

export function UserAvatar({
  src,
  name = "Usuário",
  userId,
  size = "md",
  className = "",
  shape = "circle",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null);

  // Sincroniza estado quando a prop src muda
  useEffect(() => {
    setCurrentSrc(src || null);
    setImgError(false);
  }, [src]);

  // Escuta evento global de atualização de foto para sincronização em tempo real
  useEffect(() => {
    const handleAvatarUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId?: string; avatarUrl?: string }>;
      if (customEvent.detail) {
        // Se o evento é para este usuário ou se não tem userId especificado (atualização do usuário logado)
        if (!userId || !customEvent.detail.userId || customEvent.detail.userId === userId) {
          if (customEvent.detail.avatarUrl) {
            setCurrentSrc(customEvent.detail.avatarUrl);
            setImgError(false);
          } else {
            // Se limpou a foto
            setCurrentSrc(null);
          }
        }
      }
    };

    window.addEventListener("user-avatar-updated", handleAvatarUpdate);
    return () => window.removeEventListener("user-avatar-updated", handleAvatarUpdate);
  }, [userId]);

  // Inicial do nome para fallback
  const initial = (name && name.trim().length > 0)
    ? name.trim().charAt(0).toUpperCase()
    : "U";

  // Dimensões
  const sizeClasses = typeof size === "string" ? SIZE_MAP[size] : "";
  const customStyle = typeof size === "number" ? { width: `${size}px`, height: `${size}px` } : undefined;
  const roundedClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  const hasValidImage = !!currentSrc && !imgError;

  return (
    <div
      style={customStyle}
      className={`
        relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none
        border border-border/80 shadow-2xs transition-transform duration-150
        ${sizeClasses}
        ${roundedClass}
        ${hasValidImage ? "bg-surface" : "bg-primary/10 border-primary/20"}
        ${className}
      `}
    >
      {hasValidImage ? (
        <img
          src={currentSrc!}
          alt={name ? `Foto de perfil de ${name}` : "Foto de perfil"}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center aspect-square"
          loading="eager"
        />
      ) : (
        <span className="font-extrabold text-primary leading-none uppercase">
          {initial}
        </span>
      )}
    </div>
  );
}
