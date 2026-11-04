"use client";

import { X, HeadphonesIcon } from "lucide-react";
import TicketForm from "@/app/(authenticated)/service-desk/new/TicketForm";

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTicket: any) => void;
  categories: any[];
  assets?: any[];
  departments: any[];
  users: any[];
  initialRequesters?: any[];
  initialCatalogItems?: any[];
  currentUserId: string;
}

export default function NewTicketModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  assets = [],
  departments,
  users,
  initialRequesters,
  initialCatalogItems,
  currentUserId,
}: NewTicketModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-[92vw] max-w-[1300px] h-[90dvh] max-h-[90dvh] shadow-2xl flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-elevated/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <HeadphonesIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
                Novo Chamado (Service Desk)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Abertura instantânea em modal leve, com cadastro manual flexível e catálogo de itens.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
            title="Fechar modal (Sair)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background/30">
          <TicketForm
            categories={categories}
            assets={assets}
            departments={departments}
            users={users}
            initialRequesters={initialRequesters}
            initialCatalogItems={initialCatalogItems}
            currentUserId={currentUserId}
            onClose={onClose}
            onSuccess={onSuccess}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
}
