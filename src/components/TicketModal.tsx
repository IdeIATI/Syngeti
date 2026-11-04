"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  X, CheckCircle2, Clock, ShieldAlert, User, 
  MessageSquare, Lock, AlertCircle, Laptop, Calendar, 
  Trash2, UserCheck, RefreshCw, Send, Check,
  Printer, Sparkles, Building, Layers, Eye, Box, Plus, Edit2, UserPlus,
  CornerDownRight, RotateCcw, AlertTriangle, FileText, CheckCheck,
  ChevronDown, ExternalLink, HelpCircle
} from "lucide-react";
import SmartSelect, { SmartSelectOption } from "@/components/SmartSelect";
import { calculateDuration, formatDateOnly, formatTimeOnly } from "@/lib/ticketReports";

export interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId?: string;
  initialTicket?: any;
  categories: Array<{ id: string; name: string }>;
  departments: Array<{ id: string; name: string }>;
  assets: Array<{ id: string; name: string; internal_id: string; asset_tag?: string | null; type?: string }>;
  users: Array<{ id: string; name: string; email: string; job_title?: string | null }>;
  currentUser: { id: string; name: string; email: string; role?: string } | null;
  initialRequesters?: any[];
  initialCatalogItems?: any[];
  onTicketUpdated?: (updatedTicket: any) => void;
  onTicketDeleted?: (deletedTicketId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; desc: string }> = {
  NEW: { label: "Novo", badge: "bg-blue-500/10 text-blue-500 border-blue-500/30", desc: "Aberto recentemente" },
  TRIAGE: { label: "Em Triagem", badge: "bg-purple-500/10 text-purple-500 border-purple-500/30", desc: "Classificação técnica" },
  IN_PROGRESS: { label: "Em Atendimento", badge: "bg-amber-500/10 text-amber-500 border-amber-500/30", desc: "Técnico atuando" },
  WAITING_USER: { label: "Aguardando Usuário", badge: "bg-orange-500/10 text-orange-500 border-orange-500/30", desc: "Pendente resposta" },
  WAITING_VENDOR: { label: "Aguardando Terceiro", badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", desc: "Fornecedor ou peça" },
  RESOLVED: { label: "Resolvido", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30", desc: "Solução técnica aplicada" },
  CLOSED: { label: "Encerrado", badge: "bg-slate-500/10 text-slate-400 border-slate-500/30", desc: "Finalizado formalmente" },
  CANCELED: { label: "Cancelado", badge: "bg-red-500/10 text-red-500 border-red-500/30", desc: "Cancelado pelo solicitante" },
};

const PRIORITY_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  LOW: { label: "Baixa", badge: "bg-blue-500/10 text-blue-400 border-blue-500/30", dot: "bg-blue-500" },
  MEDIUM: { label: "Média", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30", dot: "bg-amber-500" },
  HIGH: { label: "Alta", badge: "bg-orange-500/10 text-orange-400 border-orange-500/30", dot: "bg-orange-500" },
  CRITICAL: { label: "Crítica", badge: "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse", dot: "bg-red-500" },
};

const CANNED_RESPONSES = [
  {
    title: "Em Análise Técnica",
    text: "Olá! Seu chamado foi recebido pela equipe de TI e já está sob análise técnica. Retornaremos com atualizações em breve.",
    status: "IN_PROGRESS",
  },
  {
    title: "Aguardando Confirmação do Usuário",
    text: "Olá! Realizamos os procedimentos necessários. Poderia testar novamente e confirmar se o problema foi solucionado?",
    status: "WAITING_USER",
  },
  {
    title: "Aguardando Peça / Fornecedor",
    text: "Identificamos a necessidade de substituição de componente/atendimento externo. O chamado está aguardando retorno do fornecedor.",
    status: "WAITING_VENDOR",
  },
  {
    title: "Chamado Concluído / Resolvido",
    text: "Procedimento concluído e validado com sucesso pela equipe de suporte de TI. Caso precise de algo adicional, estamos à disposição!",
    status: "RESOLVED",
  },
];

export function TicketModal({
  isOpen,
  onClose,
  ticketId,
  initialTicket,
  categories,
  departments,
  assets,
  users,
  currentUser,
  initialRequesters = [],
  initialCatalogItems = [],
  onTicketUpdated,
  onTicketDeleted,
}: TicketModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "items" | "history">("details");
  const [ticket, setTicket] = useState<any>(initialTicket || null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editable fields state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [status, setStatus] = useState("NEW");
  const [priority, setPriority] = useState("MEDIUM");
  const [urgency, setUrgency] = useState("MEDIUM");
  const [impact, setImpact] = useState("MEDIUM");
  const [categoryId, setCategoryId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [assignedToName, setAssignedToName] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [responsibleMode, setResponsibleMode] = useState<"SELECT" | "MANUAL">("SELECT");

  // Dynamic Lists for SmartSelect
  const [categoriesList, setCategoriesList] = useState(categories);
  const [departmentsList, setDepartmentsList] = useState(departments);
  const [assetsList, setAssetsList] = useState(assets);
  const [usersList, setUsersList] = useState(users);
  const [requestersList, setRequestersList] = useState<any[]>(initialRequesters);
  const [catalogItems, setCatalogItems] = useState<any[]>(initialCatalogItems);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commentStatusTarget, setCommentStatusTarget] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [commentsFilter, setCommentsFilter] = useState<"ALL" | "PUBLIC" | "INTERNAL">("ALL");

  // Items state
  const [items, setItems] = useState<any[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("UN");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  // Confirmação de Encerramento Modal State
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [closingResolutionNotes, setClosingResolutionNotes] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Carrega ou sincroniza dados do chamado quando abre
  useEffect(() => {
    if (!isOpen) return;

    if (initialTicket) {
      applyTicketData(initialTicket);
    } else if (ticketId) {
      fetchTicketData(ticketId);
    }
  }, [isOpen, ticketId, initialTicket]);

  const applyTicketData = (t: any) => {
    setTicket(t);
    setTitle(t.title || "");
    setDescription(t.description || "");
    setStatus(t.status || "NEW");
    setPriority(t.priority || "MEDIUM");
    setUrgency(t.urgency || "MEDIUM");
    setImpact(t.impact || "MEDIUM");
    setCategoryId(t.category_id || "");
    setGroupId(t.group_id || "");
    setAssetId(t.asset_id || "");
    setAssignedToId(t.assigned_to_id || "");
    setAssignedToName(t.assigned_to_name || "");
    setRequesterName(t.requester_name || t.requester?.name || "");
    setResponsibleMode(t.assigned_to_id ? "SELECT" : (t.assigned_to_name ? "MANUAL" : "SELECT"));
    setComments(t.comments || []);
    setItems(t.items || []);
    setCommentStatusTarget(t.status || "NEW");
  };

  const fetchTicketData = async (id: string) => {
    setLoadingTicket(true);
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        applyTicketData(data);
      }
    } catch (e) {
      console.error("Erro ao carregar chamado:", e);
    } finally {
      setLoadingTicket(false);
    }
  };

  // Atualização atômica de propriedades do chamado
  const updateTicketProperty = async (patch: Record<string, any>, successToast?: string) => {
    if (!ticket?.id) return;
    setSavingProperty(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao salvar alteração");
      }

      const updated = await res.json();
      const merged = { ...ticket, ...updated };
      setTicket(merged);
      applyTicketData(merged);
      if (onTicketUpdated) onTicketUpdated(merged);
      showToast(successToast || "Alterações salvas com sucesso!");
      return merged;
    } catch (err: any) {
      alert(err.message || "Erro ao salvar chamado.");
    } finally {
      setSavingProperty(false);
    }
  };

  // Salvar edições do formulário geral
  const handleSaveGeneralDetails = async () => {
    await updateTicketProperty({
      title: title.trim(),
      description: description.trim(),
      category_id: categoryId || null,
      group_id: groupId || null,
      asset_id: assetId || null,
      assigned_to_id: responsibleMode === "SELECT" ? (assignedToId || null) : null,
      assigned_to_name: responsibleMode === "MANUAL" ? (assignedToName.trim() || null) : null,
      requester_name: requesterName.trim() || null,
      urgency,
      impact,
      priority,
    }, "Chamado atualizado com sucesso!");
    setIsEditingTitle(false);
    setIsEditingDescription(false);
  };

  // Adicionar comentário (público ou nota interna)
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || !ticket?.id) return;

    setSendingComment(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText.trim(),
          is_internal: isInternalComment,
          status: commentStatusTarget !== status ? commentStatusTarget : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao adicionar comentário");
      }

      setCommentText("");
      // Recarrega o chamado atualizado
      const updatedRes = await fetch(`/api/tickets/${ticket.id}`);
      if (updatedRes.ok) {
        const updated = await updatedRes.json();
        applyTicketData(updated);
        if (onTicketUpdated) onTicketUpdated(updated);
      }
      showToast("Comentário registrado com sucesso!");
    } catch (err: any) {
      alert(err.message || "Falha ao enviar comentário.");
    } finally {
      setSendingComment(false);
    }
  };

  // Encerrar Chamado (Regra Mandatória: registra encerramento formal com histórico e timestamp)
  const handleConfirmCloseTicket = async () => {
    if (!ticket?.id) return;
    setSavingProperty(true);
    try {
      // 1. Grava comentário de encerramento se fornecido
      if (closingResolutionNotes.trim()) {
        await fetch(`/api/tickets/${ticket.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `[ENCERRAMENTO FORMAL]: ${closingResolutionNotes.trim()}`,
            is_internal: false,
          }),
        }).catch(() => {});
      }

      // 2. Atualiza o status para RESOLVED / CLOSED
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao encerrar chamado");
      }

      const updated = await res.json();
      const merged = { ...ticket, ...updated, status: "RESOLVED" };
      setTicket(merged);
      applyTicketData(merged);
      if (onTicketUpdated) onTicketUpdated(merged);
      setShowCloseConfirmation(false);
      setClosingResolutionNotes("");
      showToast("Chamado encerrado/resolvido com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao encerrar chamado.");
    } finally {
      setSavingProperty(false);
    }
  };

  // Reabrir Chamado
  const handleReopenTicket = async () => {
    if (!window.confirm("Deseja reabrir este chamado para continuidade do atendimento técnico?")) return;
    await updateTicketProperty({ status: "IN_PROGRESS" }, "Chamado reaberto com sucesso!");
  };

  // Sair do Chamado (Regra Mandatória: fecha o modal sem alterar status ou SLA)
  const handleExitTicket = () => {
    if (commentText.trim()) {
      if (!window.confirm("Você possui uma resposta digitada que ainda não foi enviada. Deseja sair do chamado e descartar o rascunho?")) {
        return;
      }
    }
    onClose();
  };

  // Adicionar item / peça
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim() || !ticket?.id) return;

    setSavingItem(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newItemDesc.trim(),
          quantity: Math.max(1, newItemQty || 1),
          unit: newItemUnit.trim() || "UN",
          notes: newItemNotes.trim() || undefined,
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao adicionar item");
      }

      const added = await res.json();
      const newItems = [...items, added];
      setItems(newItems);
      setTicket((prev: any) => ({ ...prev, items: newItems }));
      setNewItemDesc("");
      setNewItemQty(1);
      setNewItemUnit("UN");
      setNewItemNotes("");
      setShowAddItem(false);
      showToast("Item adicionado ao chamado!");
    } catch (err: any) {
      alert(err.message || "Falha ao adicionar item");
    } finally {
      setSavingItem(false);
    }
  };

  // Remover item
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Deseja remover este item do chamado?")) return;
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/items/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        const filtered = items.filter(i => i.id !== itemId);
        setItems(filtered);
        setTicket((prev: any) => ({ ...prev, items: filtered }));
        showToast("Item removido.");
      }
    } catch (e) {
      alert("Erro ao excluir item.");
    }
  };

  if (!isOpen) return null;

  const currentStatusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
  const currentPriorityInfo = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  const isTicketClosed = status === "RESOLVED" || status === "CLOSED";

  const filteredComments = comments.filter((c) => {
    if (commentsFilter === "PUBLIC") return !c.is_internal;
    if (commentsFilter === "INTERNAL") return c.is_internal;
    return true;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={handleExitTicket}
    >
      <div 
        className="bg-surface border border-border rounded-2xl w-[92vw] max-w-[1300px] h-[90dvh] max-h-[90dvh] shadow-2xl flex flex-col overflow-hidden my-auto select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* A — CABEÇALHO FIXO                                                        */}
        {/* ========================================================================= */}
        <div className="h-[68px] sm:h-[72px] border-b border-border bg-surface-elevated/70 px-4 sm:px-6 flex items-center justify-between shrink-0 gap-3">
          {/* Identificação e Badges do Chamado */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-w-0">
            <span className="font-mono text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/25 shrink-0">
              {ticket?.code || "CH-..."}
            </span>

            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 hidden sm:inline-block">
              {ticket?.type === "INCIDENT" ? "Incidente" : "Requisição"}
            </span>

            {/* Seletor Rápido de Status */}
            <div className="relative inline-flex items-center">
              <select
                value={status}
                disabled={savingProperty}
                onChange={(e) => updateTicketProperty({ status: e.target.value }, `Status alterado para ${STATUS_CONFIG[e.target.value]?.label}`)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border appearance-none pr-7 cursor-pointer focus:outline-none transition-all ${currentStatusInfo.badge}`}
                title="Alterar status do chamado"
              >
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key} className="bg-surface text-foreground font-semibold">
                    {cfg.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none opacity-70" />
            </div>

            {/* Badge de Prioridade */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${currentPriorityInfo.badge}`}>
              <span className={`w-2 h-2 rounded-full ${currentPriorityInfo.dot}`} />
              <span>{currentPriorityInfo.label}</span>
            </div>

            {/* Atendente / Responsável Atual */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border text-xs text-muted-foreground shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-foreground truncate max-w-[150px]">
                {assignedToName || usersList.find(u => u.id === assignedToId)?.name || "Não atribuído"}
              </span>
            </div>
          </div>

          {/* Ações Rápidas do Cabeçalho */}
          <div className="flex items-center gap-2 shrink-0">
            {toastMessage && (
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg animate-in fade-in hidden sm:inline-block">
                {toastMessage}
              </span>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface border border-border transition-colors hidden sm:flex items-center justify-center"
              title="Imprimir chamado"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleExitTicket}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border transition-colors"
              title="Sair do Chamado (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Título do Chamado com Edição Inline */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-surface/40 flex items-center justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 bg-background border border-primary px-3 py-1 text-sm font-bold text-foreground rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveGeneralDetails}
                  className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-bold"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => { setTitle(ticket?.title || ""); setIsEditingTitle(false); }}
                  className="px-2 py-1 rounded-lg bg-surface border border-border text-xs text-muted-foreground"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
                  {title || "Sem título"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity"
                  title="Editar título"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground whitespace-nowrap hidden md:inline-block">
            Aberto por <span className="font-semibold text-foreground">{requesterName || "Solicitante"}</span> em {ticket?.created_at ? formatDateOnly(ticket.created_at) : "-"}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NAVEGAÇÃO EM ABAS INTERNAS LEVES                                          */}
        {/* ========================================================================= */}
        <div className="flex items-center border-b border-border bg-surface px-4 sm:px-6 shrink-0 gap-1 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "details"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Detalhes & Informações Gerais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "comments"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Acompanhamento & Respostas</span>
            {comments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/15 text-primary font-bold">
                {comments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "items"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Itens & Peças</span>
            {items.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/15 text-primary font-bold">
                {items.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Histórico & Auditoria</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* B — CONTEÚDO DAS ABAS                                                     */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 bg-background/50">
          
          {/* ABA 1: DETALHES & INFORMAÇÕES GERAIS */}
          {activeTab === "details" && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
              
              {/* Grid de Classificação & Responsáveis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Coluna 1: Solicitante e Setor */}
                <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>Solicitante & Localização</span>
                  </h3>

                  {/* Solicitante (Suporte a Digitação Livre / Manual) */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Solicitante do Chamado
                    </label>
                    <input
                      type="text"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="Nome do solicitante (digitação livre ou cadastrado)"
                      className="w-full bg-background border border-border px-3.5 py-2.5 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Permite colaboradores cadastrados ou inserção manual sem restrição.
                    </span>
                  </div>

                  {/* Setor / Departamento */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Setor / Departamento
                    </label>
                    <select
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Selecione o setor...</option>
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Categoria do Chamado */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Categoria do Atendimento
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Selecione a categoria...</option>
                      {categoriesList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Computador / Ativo Vinculado */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Computador ou Ativo Vinculado (CMDB)
                    </label>
                    <select
                      value={assetId}
                      onChange={(e) => setAssetId(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Nenhum ativo específico...</option>
                      {assetsList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.asset_tag || a.internal_id || a.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Coluna 2: Atendente e Prioridade */}
                <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span>Técnico Responsável & Prioridade ITIL</span>
                  </h3>

                  {/* Modo de Atribuição de Responsável */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Responsável pelo Atendimento
                      </label>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setResponsibleMode("SELECT")}
                          className={`font-semibold transition-colors ${responsibleMode === "SELECT" ? "text-primary underline" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Técnico TI
                        </button>
                        <span className="text-muted-foreground/40">•</span>
                        <button
                          type="button"
                          onClick={() => setResponsibleMode("MANUAL")}
                          className={`font-semibold transition-colors ${responsibleMode === "MANUAL" ? "text-primary underline" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Manual / Externo
                        </button>
                      </div>
                    </div>

                    {responsibleMode === "SELECT" ? (
                      <select
                        value={assignedToId}
                        onChange={(e) => setAssignedToId(e.target.value)}
                        className="w-full bg-background border border-border px-3 py-2.5 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="">Não atribuído (Fila de Triagem)</option>
                        {usersList.map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.job_title || u.email})</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={assignedToName}
                        onChange={(e) => setAssignedToName(e.target.value)}
                        placeholder="Nome do técnico ou terceiro responsável"
                        className="w-full bg-background border border-border px-3.5 py-2.5 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    )}
                  </div>

                  {/* Matriz de Prioridade: Urgência x Impacto */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Urgência
                      </label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value)}
                        className="w-full bg-background border border-border px-2.5 py-2 rounded-xl text-xs font-semibold text-foreground focus:outline-none"
                      >
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta</option>
                        <option value="CRITICAL">Crítica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Impacto
                      </label>
                      <select
                        value={impact}
                        onChange={(e) => setImpact(e.target.value)}
                        className="w-full bg-background border border-border px-2.5 py-2 rounded-xl text-xs font-semibold text-foreground focus:outline-none"
                      >
                        <option value="LOW">Baixo</option>
                        <option value="MEDIUM">Médio</option>
                        <option value="HIGH">Alto</option>
                        <option value="CRITICAL">Crítico</option>
                      </select>
                    </div>
                  </div>

                  {/* Prioridade Resultante */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Prioridade Calculada (SLA)
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs font-bold text-foreground focus:outline-none"
                    >
                      <option value="LOW">Baixa (Até 48h)</option>
                      <option value="MEDIUM">Média (Até 24h)</option>
                      <option value="HIGH">Alta (Até 8h)</option>
                      <option value="CRITICAL">Crítica (Até 2h)</option>
                    </select>
                  </div>

                  {/* Botão de Salvar Alterações desta Aba */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={savingProperty}
                      onClick={handleSaveGeneralDetails}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>{savingProperty ? "Salvando alterações..." : "Salvar Dados Cadastrais"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Descrição Detalhada do Chamado */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Descrição da Solicitação / Problema</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingDescription(!isEditingDescription)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {isEditingDescription ? "Visualizar" : "Editar Descrição"}
                  </button>
                </div>

                {isEditingDescription ? (
                  <div className="space-y-3">
                    <textarea
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-background border border-primary p-3.5 rounded-xl text-xs text-foreground focus:outline-none leading-relaxed"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setDescription(ticket?.description || ""); setIsEditingDescription(false); }}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveGeneralDetails}
                        className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold"
                      >
                        Salvar Descrição
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-background/80 border border-border/60 p-4 rounded-xl text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap min-h-[100px]">
                    {description || "Nenhuma descrição fornecida."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 2: ACOMPANHAMENTO & RESPOSTAS */}
          {activeTab === "comments" && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
              
              {/* Filtro de Comentários */}
              <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCommentsFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${commentsFilter === "ALL" ? "bg-primary text-white font-bold" : "text-muted-foreground hover:bg-surface"}`}
                  >
                    Todos ({comments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentsFilter("PUBLIC")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${commentsFilter === "PUBLIC" ? "bg-primary text-white font-bold" : "text-muted-foreground hover:bg-surface"}`}
                  >
                    Públicos ({comments.filter(c => !c.is_internal).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentsFilter("INTERNAL")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${commentsFilter === "INTERNAL" ? "bg-amber-500 text-white font-bold" : "text-muted-foreground hover:bg-surface"}`}
                  >
                    Notas Internas ({comments.filter(c => c.is_internal).length})
                  </button>
                </div>

                <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
                  Comentários públicos são visíveis pelo solicitante.
                </span>
              </div>

              {/* Feed de Comentários */}
              <div className="space-y-3.5">
                {filteredComments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-surface/30 rounded-2xl border border-dashed border-border/80">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                    <p className="text-xs font-semibold text-foreground">Nenhuma interação registrada ainda.</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Utilize o campo abaixo para responder ao solicitante ou adicionar notas da equipe.</p>
                  </div>
                ) : (
                  filteredComments.map((comm) => (
                    <div 
                      key={comm.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        comm.is_internal
                          ? "bg-amber-500/5 border-amber-500/25"
                          : "bg-surface border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                            {comm.author?.name ? comm.author.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            {comm.author?.name || "Colaborador"}
                          </span>
                          {comm.is_internal && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.2 rounded-full border border-amber-500/20">
                              <Lock className="w-2.5 h-2.5" />
                              Nota Interna
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comm.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-8">
                        {comm.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Caixa de Nova Interação */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-3.5">
                {/* Respostas Prontas Corporativas */}
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                    Respostas Rápidas:
                  </span>
                  {CANNED_RESPONSES.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => {
                        setCommentText(tmpl.text);
                        setCommentStatusTarget(tmpl.status);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-[11px] font-semibold text-foreground whitespace-nowrap transition-colors"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Digite sua resposta técnica ou nota interna..."
                  className="w-full bg-background border border-border p-3.5 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary transition-colors leading-relaxed"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  {/* Alternador de Nota Interna vs Público */}
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                    />
                    <span className={isInternalComment ? "text-amber-500 font-bold flex items-center gap-1" : "text-muted-foreground"}>
                      <Lock className="w-3.5 h-3.5" />
                      Marcar como Nota Interna Confidencial (invisível para solicitante)
                    </span>
                  </label>

                  {/* Botão de Envio com Opção de Status */}
                  <div className="flex items-center gap-2">
                    <select
                      value={commentStatusTarget}
                      onChange={(e) => setCommentStatusTarget(e.target.value)}
                      className="bg-background border border-border text-xs px-2.5 py-2 rounded-xl font-semibold text-foreground focus:outline-none"
                      title="Alterar status ao responder"
                    >
                      <option value={status}>Manter status ({STATUS_CONFIG[status]?.label})</option>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>Mudar para {cfg.label}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={sendingComment || !commentText.trim()}
                      onClick={handleAddComment}
                      className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingComment ? "Enviando..." : "Responder"}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ABA 3: ITENS & PEÇAS */}
          {activeTab === "items" && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Itens e Peças Solicitadas
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Controle de componentes, periféricos e peças alocadas para a resolução deste chamado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddItem(!showAddItem)}
                  className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Item</span>
                </button>
              </div>

              {/* Formulário de Adicionar Item */}
              {showAddItem && (
                <form onSubmit={handleAddItem} className="p-4 sm:p-5 rounded-2xl bg-surface border border-primary/30 space-y-3.5 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Descrição do Item / Peça *
                      </label>
                      <input
                        type="text"
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        placeholder="Ex: Teclado USB, Memória RAM 8GB, Cabo HDMI..."
                        className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Quantidade *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                        className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs font-semibold text-foreground focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Unidade
                      </label>
                      <input
                        type="text"
                        value={newItemUnit}
                        onChange={(e) => setNewItemUnit(e.target.value)}
                        placeholder="UN, CX, M..."
                        className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs font-semibold text-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Observações Técnicas do Item
                    </label>
                    <input
                      type="text"
                      value={newItemNotes}
                      onChange={(e) => setNewItemNotes(e.target.value)}
                      placeholder="Ex: Alocado para o setor financeiro..."
                      className="w-full bg-background border border-border px-3 py-2 rounded-xl text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddItem(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-border text-xs text-muted-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingItem}
                      className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover"
                    >
                      {savingItem ? "Salvando..." : "Salvar Item"}
                    </button>
                  </div>
                </form>
              )}

              {/* Tabela de Itens */}
              <div className="border border-border rounded-2xl overflow-hidden bg-surface">
                {items.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    Nenhum item ou peça vinculada a este chamado.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-elevated/80 border-b border-border text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Item / Descrição</th>
                        <th className="py-3 px-4 text-center">Quantidade</th>
                        <th className="py-3 px-4">Unidade</th>
                        <th className="py-3 px-4">Observações</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((it) => (
                        <tr key={it.id} className="hover:bg-surface-hover/50">
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {it.description}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-primary">
                            {it.quantity}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {it.unit || "UN"}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {it.notes || "-"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(it.id)}
                              className="p-1 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ABA 4: HISTÓRICO & AUDITORIA */}
          {activeTab === "history" && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
              {/* Indicadores de SLA e Marcos Temporais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-surface border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Aberto Em
                  </span>
                  <span className="text-sm font-bold text-foreground block">
                    {ticket?.created_at ? formatDateOnly(ticket.created_at) : "-"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {ticket?.created_at ? formatTimeOnly(ticket.created_at) : ""}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Status da Resolução
                  </span>
                  <span className={`text-sm font-bold block ${isTicketClosed ? "text-emerald-500" : "text-amber-500"}`}>
                    {isTicketClosed ? "Resolvido Formalmente" : "Em Aberto / Atendimento"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {ticket?.resolved_at ? `Em ${formatDateOnly(ticket.resolved_at)} às ${formatTimeOnly(ticket.resolved_at)}` : "Ainda não concluído"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Tempo de Atendimento
                  </span>
                  <span className="text-sm font-bold text-primary block">
                    {ticket?.created_at ? calculateDuration(ticket.created_at, ticket.resolved_at, ticket.closed_at, ticket.status) : "-"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Prioridade: {currentPriorityInfo.label}
                  </span>
                </div>
              </div>

              {/* Linha do Tempo de Auditoria */}
              <div className="p-5 rounded-2xl bg-surface border border-border space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Trilha de Eventos e Auditoria</span>
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {/* Evento: Criação */}
                  <div className="relative">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border-2 border-blue-500 absolute -left-6 top-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">Chamado Aberto</span>
                      <span className="text-[11px] text-muted-foreground">
                        Registrado por {requesterName || "Solicitante"} em {ticket?.created_at ? formatDateOnly(ticket.created_at) : "-"} às {ticket?.created_at ? formatTimeOnly(ticket.created_at) : ""}
                      </span>
                    </div>
                  </div>

                  {/* Evento: Técnico Atribuído */}
                  {(assignedToId || assignedToName) && (
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full bg-purple-500/20 border-2 border-purple-500 absolute -left-6 top-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground block">Técnico Designado</span>
                        <span className="text-[11px] text-muted-foreground">
                          Responsável atribuído: {assignedToName || usersList.find(u => u.id === assignedToId)?.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Evento: Resolução */}
                  {ticket?.resolved_at && (
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-500 absolute -left-6 top-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-500 block">Chamado Resolvido</span>
                        <span className="text-[11px] text-muted-foreground">
                          Resolução confirmada em {formatDateOnly(ticket.resolved_at)} às {formatTimeOnly(ticket.resolved_at)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* C — RODAPÉ FIXO (Permanentemente Visível Durante a Rolagem)                */}
        {/* ========================================================================= */}
        <div className="h-[64px] sm:h-[68px] border-t border-border bg-surface-elevated/90 px-4 sm:px-6 flex items-center justify-between shrink-0 gap-3">
          {/* Lado Esquerdo: Metadados */}
          <div className="text-xs text-muted-foreground truncate hidden md:block">
            <span>SLA: Prioridade </span>
            <span className="font-bold text-foreground">{currentPriorityInfo.label}</span>
            <span> • Status atual: </span>
            <span className="font-bold text-foreground">{currentStatusInfo.label}</span>
          </div>

          {/* Lado Direito: Ações Principais Distintas */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* BOTÃO OBRIGATÓRIO: Sair do Chamado (apenas fecha o modal) */}
            <button
              type="button"
              onClick={handleExitTicket}
              className="px-4 sm:px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-surface transition-colors flex items-center gap-1.5 shadow-xs"
              title="Fechar modal e retornar para a lista (preserva status e chamado)"
            >
              <X className="w-4 h-4" />
              <span>Sair do Chamado</span>
            </button>

            {/* BOTÃO OBRIGATÓRIO: Salvar Alterações */}
            <button
              type="button"
              disabled={savingProperty}
              onClick={handleSaveGeneralDetails}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              title="Salvar alterações realizadas no chamado"
            >
              <Check className="w-4 h-4" />
              <span>{savingProperty ? "Salvando..." : "Salvar Alterações"}</span>
            </button>

            {/* BOTÃO OBRIGATÓRIO: Encerrar Chamado vs Reabrir Chamado */}
            {!isTicketClosed ? (
              <button
                type="button"
                onClick={() => setShowCloseConfirmation(true)}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                title="Formalizar encerramento/resolução do chamado"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Encerrar Chamado</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReopenTicket}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                title="Reabrir chamado para atendimento"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reabrir Chamado</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal de Confirmação Formal de Encerramento */}
        {showCloseConfirmation && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="text-base font-bold text-foreground">Encerrar Chamado</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Você está formalizando a resolução do chamado <strong className="text-foreground">{ticket?.code}</strong>. O horário de encerramento será registrado permanentemente para cálculo de SLA.
              </p>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Nota de Resolução (opcional)
                </label>
                <textarea
                  rows={3}
                  value={closingResolutionNotes}
                  onChange={(e) => setClosingResolutionNotes(e.target.value)}
                  placeholder="Descreva brevemente a solução aplicada para fins de histórico..."
                  className="w-full bg-background border border-border p-2.5 rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseConfirmation(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCloseTicket}
                  disabled={savingProperty}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  {savingProperty ? "Encerrando..." : "Confirmar Encerramento"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
