"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidthClassName?: string;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Modal padronizado do Design System SyngeTI.
 * Inclui backdrop unificado, focus trap por teclado, fechamento por ESC e cabeçalho acessível.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidthClassName = "max-w-md",
  closeOnEscape = true,
  closeOnBackdrop = true,
  children,
  footer,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      if (!dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        dialogRef.current.focus();
      }
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previousActive?.focus?.();
    };
  }, [open, closeOnEscape, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`w-full ${maxWidthClassName} bg-surface-1 border border-border-strong rounded-2xl shadow-[var(--shadow-modal)] relative overflow-hidden flex flex-col max-h-[90vh] focus:outline-none`}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border">
            <div className="min-w-0">
              {subtitle && (
                <div className="flex items-center gap-2 mb-1.5">
                  {icon && <span className="text-primary shrink-0">{icon}</span>}
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    {subtitle}
                  </span>
                </div>
              )}
              {title && (
                <h3 id={titleId} className="font-display text-xl font-bold text-foreground leading-snug">
                  {title}
                </h3>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela"
              className="p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {!title && !subtitle && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-border bg-surface-2/50 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
