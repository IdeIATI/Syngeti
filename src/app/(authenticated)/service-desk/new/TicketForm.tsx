"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Trash2, UserPlus, FolderPlus, Laptop, 
  HelpCircle, CheckCircle2, AlertTriangle, Layers, 
  FileText, ShieldAlert, Cpu, Network, KeyRound, Printer, Box,
  ArrowLeft, UserCheck, X
} from "lucide-react";
import SmartSelect, { SmartSelectOption } from "@/components/SmartSelect";

interface UserItem {
  id: string;
  name: string;
  email: string;
  job_title?: string | null;
  department?: { id: string; name: string } | null;
}

interface RequesterItem {
  id: string;
  name: string;
  email?: string | null;
  department?: string | null;
  type?: "USER" | "REQUESTER";
}

interface AssetItem {
  id: string;
  name: string;
  internal_id: string;
  asset_tag?: string | null;
  type: string;
}

interface CategoryItem {
  id: string;
  name: string;
  description?: string | null;
}

interface DepartmentItem {
  id: string;
  name: string;
}

interface RequestedItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: string;
  details: string;
}

export default function TicketForm({
  categories: initialCategories,
  assets: initialAssets,
  departments: initialDepartments,
  users: initialUsers,
  initialRequesters,
  initialCatalogItems,
  currentUserId,
  onClose,
  onSuccess,
  isModal = false,
}: {
  categories: CategoryItem[];
  assets: AssetItem[];
  departments: DepartmentItem[];
  users: UserItem[];
  initialRequesters?: any[];
  initialCatalogItems?: any[];
  currentUserId: string;
  onClose?: () => void;
  onSuccess?: (ticket: any) => void;
  isModal?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Dynamic Lists (allow live additions)
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(initialCategories);
  const [assetsList, setAssetsList] = useState<AssetItem[]>(initialAssets);
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>(initialDepartments);
  const [usersList, setUsersList] = useState<UserItem[]>(initialUsers);
  const [requestersList, setRequestersList] = useState<RequesterItem[]>(() => {
    if (initialRequesters && initialRequesters.length > 0) return initialRequesters;
    return initialUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department?.name || null,
      type: "USER"
    }));
  });
  const [catalogItems, setCatalogItems] = useState<Array<{ id: string; name: string; category?: string; unit?: string }>>(initialCatalogItems || []);

  // Form State
  const [activeTab, setActiveTab] = useState<"details" | "items">("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"INCIDENT" | "REQUEST">("INCIDENT");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [impact, setImpact] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [requesterId, setRequesterId] = useState(currentUserId || (initialUsers[0]?.id || ""));
  const [requesterName, setRequesterName] = useState(initialUsers.find(u => u.id === currentUserId)?.name || initialUsers[0]?.name || "");
  const [categoryId, setCategoryId] = useState(initialCategories[0]?.id || "");
  const [assetId, setAssetId] = useState("");
  const [customAssetNote, setCustomAssetNote] = useState("");
  const [groupId, setGroupId] = useState(initialDepartments[0]?.id || "");

  // Responsible State (Registered Technician OR Manual Name)
  const [assignedToId, setAssignedToId] = useState("");
  const [assignedToName, setAssignedToName] = useState("");

  // Dynamic Requested Items List (manual item addition)
  const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);

  // Carrega lista unificada de solicitantes e catálogo de itens apenas se não vieram pré-carregados pelo SSR
  useEffect(() => {
    if (!initialRequesters || initialRequesters.length === 0) {
      fetch("/api/requesters")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setRequestersList(data);
          }
        })
        .catch(() => {});
    }

    if (!initialCatalogItems || initialCatalogItems.length === 0) {
      fetch("/api/item-catalog")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCatalogItems(data);
          }
        })
        .catch(() => {});
    }
  }, [initialRequesters, initialCatalogItems]);

  // Sair do Chamado (com confirmação se houver dados preenchidos)
  const handleExitTicket = () => {
    const isDirty = title.trim() || description.trim() || requestedItems.length > 0 || assignedToName.trim();
    if (isDirty) {
      if (!window.confirm("Atenção: Existem alterações não salvas. Deseja realmente sair do chamado sem salvar?")) {
        return;
      }
    }
    if (onClose) {
      onClose();
    } else {
      router.push("/service-desk");
    }
  };

  // Modals for Manual Additions
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserJobTitle, setNewUserJobTitle] = useState("");
  const [newUserDeptId, setNewUserDeptId] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [savingDept, setSavingDept] = useState(false);

  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetType, setNewAssetType] = useState("COMPUTER");
  const [newAssetTag, setNewAssetTag] = useState("");
  const [newAssetManufacturer, setNewAssetManufacturer] = useState("");
  const [newAssetModel, setNewAssetModel] = useState("");
  const [savingAsset, setSavingAsset] = useState(false);

  // Calculate priority based on ITIL standard Matrix (Urgency x Impact)
  useEffect(() => {
    if (urgency === "CRITICAL" || impact === "CRITICAL") {
      setPriority("CRITICAL");
    } else if (urgency === "HIGH" && impact === "HIGH") {
      setPriority("CRITICAL");
    } else if ((urgency === "HIGH" && impact === "MEDIUM") || (urgency === "MEDIUM" && impact === "HIGH")) {
      setPriority("HIGH");
    } else if (urgency === "LOW" && impact === "LOW") {
      setPriority("LOW");
    } else {
      setPriority("MEDIUM");
    }
  }, [urgency, impact]);

  // Fast Templates
  const applyTemplate = (tmpl: {
    title: string;
    description: string;
    type: "INCIDENT" | "REQUEST";
    categoryKeyword: string;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    items?: Array<{ name: string; quantity: number; category: string; details: string }>;
  }) => {
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setType(tmpl.type);
    setUrgency(tmpl.urgency);
    setImpact(tmpl.impact);

    const matchedCat = categoriesList.find(c => c.name.toLowerCase().includes(tmpl.categoryKeyword.toLowerCase()));
    if (matchedCat) {
      setCategoryId(matchedCat.id);
    }

    if (tmpl.items && tmpl.items.length > 0) {
      setRequestedItems(tmpl.items.map((it, idx) => ({ ...it, id: String(Date.now() + idx) })));
    }
  };

  // Add Item to Requested Items list manually
  const handleAddRequestedItem = (preset?: Partial<RequestedItem>) => {
    const newItem: RequestedItem = {
      id: String(Date.now() + Math.random()),
      name: preset?.name || "",
      quantity: preset?.quantity || 1,
      unit: preset?.unit || "UN",
      category: preset?.category || "Hardware / Periférico",
      details: preset?.details || "",
    };
    setRequestedItems([...requestedItems, newItem]);
  };

  const handleUpdateRequestedItem = (id: string, field: keyof RequestedItem, value: any) => {
    setRequestedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveRequestedItem = (id: string) => {
    setRequestedItems(prev => prev.filter(item => item.id !== id));
  };

  // Save New User Manually Inline
  const handleSaveUserInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    setSavingUser(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: "tempPassword123!",
          job_title: newUserJobTitle.trim() || undefined,
          department_id: newUserDeptId || undefined,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar usuário");
      }

      const createdUser = await res.json();
      setUsersList(prev => [createdUser, ...prev]);
      setRequesterId(createdUser.id);
      setShowAddUserModal(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserJobTitle("");
    } catch (err: any) {
      alert(err.message || "Falha ao cadastrar solicitante");
    } finally {
      setSavingUser(false);
    }
  };

  // Save New Category Manually Inline
  const handleSaveCategoryInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setSavingCategory(true);
    try {
      const res = await fetch("/api/tickets/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || undefined,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar categoria");
      }

      const createdCat = await res.json();
      setCategoriesList(prev => [...prev, createdCat]);
      setCategoryId(createdCat.id);
      setShowAddCategoryModal(false);
      setNewCategoryName("");
      setNewCategoryDesc("");
    } catch (err: any) {
      alert(err.message || "Falha ao cadastrar categoria");
    } finally {
      setSavingCategory(false);
    }
  };

  // Save New Department Manually Inline
  const handleSaveDeptInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setSavingDept(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeptName.trim() })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar setor");
      }

      const createdDept = await res.json();
      setDepartmentsList(prev => [...prev, createdDept]);
      setGroupId(createdDept.id);
      setShowAddDeptModal(false);
      setNewDeptName("");
    } catch (err: any) {
      alert(err.message || "Falha ao cadastrar setor");
    } finally {
      setSavingDept(false);
    }
  };

  // Save New Asset Manually Inline
  const handleSaveAssetInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;

    setSavingAsset(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAssetName.trim(),
          type: newAssetType,
          asset_tag: newAssetTag.trim() || undefined,
          manufacturer: newAssetManufacturer.trim() || undefined,
          model: newAssetModel.trim() || undefined,
          status: "IN_USE",
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao cadastrar equipamento");
      }

      const createdAsset = await res.json();
      setAssetsList(prev => [createdAsset, ...prev]);
      setAssetId(createdAsset.id);
      setShowAddAssetModal(false);
      setNewAssetName("");
      setNewAssetTag("");
      setNewAssetManufacturer("");
      setNewAssetModel("");
    } catch (err: any) {
      alert(err.message || "Falha ao cadastrar equipamento");
    } finally {
      setSavingAsset(false);
    }
  };

  // Handlers para o SmartSelect (Universal Creatable)
  const handleCreateRequester = async (name: string): Promise<SmartSelectOption> => {
    const res = await fetch("/api/requesters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erro ao cadastrar solicitante");
    }
    const created = await res.json();
    const newOptItem: RequesterItem = {
      id: created.id,
      name: created.name,
      email: created.email,
      department: created.department,
      type: "REQUESTER"
    };
    setRequestersList(prev => [newOptItem, ...prev]);
    setRequesterId(created.id);
    setRequesterName(created.name);
    return {
      id: created.id,
      label: created.name,
      sublabel: "Solicitante Manual",
      badge: "Manual"
    };
  };

  const handleCreateCategory = async (name: string): Promise<SmartSelectOption> => {
    const res = await fetch("/api/tickets/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erro ao criar categoria");
    }
    const created = await res.json();
    setCategoriesList(prev => [...prev, created]);
    setCategoryId(created.id);
    return { id: created.id, label: created.name };
  };

  const handleCreateDepartment = async (name: string): Promise<SmartSelectOption> => {
    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erro ao criar setor");
    }
    const created = await res.json();
    setDepartmentsList(prev => [...prev, created]);
    setGroupId(created.id);
    return { id: created.id, label: created.name };
  };

  const handleCreateAsset = async (name: string): Promise<SmartSelectOption> => {
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type: "COMPUTER", status: "IN_USE" })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erro ao cadastrar equipamento");
    }
    const created = await res.json();
    setAssetsList(prev => [created, ...prev]);
    setAssetId(created.id);
    return { id: created.id, label: created.name, badge: created.type };
  };

  const handleCreateCatalogItem = async (name: string): Promise<SmartSelectOption> => {
    try {
      const res = await fetch("/api/item-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });
      if (res.ok) {
        const created = await res.json();
        setCatalogItems(prev => [created, ...prev]);
      }
    } catch (e) {
      console.warn("Item catalog add warning:", e);
    }
    return { id: name.trim(), label: name.trim() };
  };

  // Main Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Por favor, preencha o título e a descrição do chamado.");
      return;
    }

    setLoading(true);

    try {
      let fullDescription = description.trim();
      if (customAssetNote.trim()) {
        fullDescription = `${fullDescription}\n\n[Identificação Manual do Dispositivo / Equipamento]: ${customAssetNote.trim()}`;
      }

      const targetAssignedToId = assignedToId || null;
      const targetAssignedToName = assignedToName?.trim() || null;

      const payload = {
        title: title.trim(),
        description: fullDescription,
        type,
        urgency,
        impact,
        priority,
        requester_id: requesterId,
        requester_name: requesterName?.trim() || null,
        assigned_to_id: targetAssignedToId,
        assigned_to_name: targetAssignedToName,
        category_id: categoryId || null,
        asset_id: assetId || null,
        group_id: groupId || null,
        items: requestedItems.filter(i => i.name.trim() !== "").map(i => ({
          description: i.name.trim(),
          quantity: i.quantity,
          unit: i.unit || "UN",
          notes: i.details || "",
        })),
        requested_items: requestedItems.filter(i => i.name.trim() !== ""),
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Falha ao abrir chamado");
      }

      const createdTicket = await res.json();
      if (onSuccess) {
        onSuccess(createdTicket);
      } else {
        router.push(`/service-desk/${createdTicket.id}`);
        router.refresh();
      }
    } catch (error: any) {
      alert(error.message || "Erro ao registrar o chamado.");
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col ${isModal ? "h-full" : "space-y-6"}`}>
      {/* Top Bar: Modelos Rápidos Compactos + Abas Leves */}
      <div className="bg-surface border-b border-border px-5 py-3 flex flex-col gap-3 shrink-0">
        {/* Modelos Rápidos em Linha Horizontal Enxuta */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1.5 mr-1">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Modelos:
          </span>
          <button
            type="button"
            onClick={() => applyTemplate({
              title: "Computador não inicia ou tela azul",
              description: "Equipamento não responde ao ligar ou trava em tela de recuperação do sistema operacional. Necessita verificação física.",
              type: "INCIDENT",
              categoryKeyword: "Hardware",
              urgency: "HIGH",
              impact: "MEDIUM",
            })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface-elevated hover:border-primary/50 hover:bg-surface-hover text-xs font-medium text-foreground transition-all shrink-0 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>Falha em PC</span>
          </button>
          <button
            type="button"
            onClick={() => applyTemplate({
              title: "Sem conexão com a Internet / Wi-Fi instável",
              description: "Queda na conexão com a rede local corporativa. Páginas e sistemas internos inacessíveis.",
              type: "INCIDENT",
              categoryKeyword: "Redes",
              urgency: "HIGH",
              impact: "HIGH",
            })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface-elevated hover:border-primary/50 hover:bg-surface-hover text-xs font-medium text-foreground transition-all shrink-0 cursor-pointer"
          >
            <Network className="w-3.5 h-3.5 text-info" />
            <span>Queda de Internet</span>
          </button>
          <button
            type="button"
            onClick={() => applyTemplate({
              title: "Solicitação de Acesso / Criação de Usuário",
              description: "Novo colaborador necessita de e-mail corporativo, acesso ao ERP e permissões nas pastas de rede.",
              type: "REQUEST",
              categoryKeyword: "Acessos",
              urgency: "MEDIUM",
              impact: "MEDIUM",
              items: [
                { name: "Criação de Conta de E-mail Corporativo", quantity: 1, category: "Acesso / Conta", details: "Domínio padrão da empresa" },
                { name: "Acesso ao Sistema ERP", quantity: 1, category: "Software / Licença", details: "Módulo Operacional" },
              ]
            })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface-elevated hover:border-primary/50 hover:bg-surface-hover text-xs font-medium text-foreground transition-all shrink-0 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-warning" />
            <span>Acesso & Usuário</span>
          </button>
          <button
            type="button"
            onClick={() => applyTemplate({
              title: "Falha na Impressora / Solicitação de Toner",
              description: "Impressora apresentando aviso de toner baixo ou emperramento de papel no alimentador principal.",
              type: "INCIDENT",
              categoryKeyword: "Impressão",
              urgency: "MEDIUM",
              impact: "LOW",
              items: [
                { name: "Toner Preto para Impressora", quantity: 1, category: "Consumível", details: "Para impressora do setor" }
              ]
            })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface-elevated hover:border-primary/50 hover:bg-surface-hover text-xs font-medium text-foreground transition-all shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-accent" />
            <span>Impressora / Toner</span>
          </button>
          <button
            type="button"
            onClick={() => applyTemplate({
              title: "Solicitação de Kit de Periféricos de Trabalho",
              description: "Solicitação de periféricos complementares para melhoria da ergonomia e produtividade no posto de trabalho.",
              type: "REQUEST",
              categoryKeyword: "Solicitação",
              urgency: "LOW",
              impact: "LOW",
              items: [
                { name: "Mouse sem fio ergonômico", quantity: 1, category: "Hardware / Periférico", details: "Conexão USB" },
                { name: "Teclado ABNT2 com teclado numérico", quantity: 1, category: "Hardware / Periférico", details: "USB Padrão" }
              ]
            })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface-elevated hover:border-primary/50 hover:bg-surface-hover text-xs font-medium text-foreground transition-all shrink-0 cursor-pointer"
          >
            <Box className="w-3.5 h-3.5 text-success" />
            <span>Periféricos & Peças</span>
          </button>
        </div>

        {/* Abas Leves de Navegação */}
        <div className="flex items-center gap-2 border-t border-border/50 pt-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "details"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Detalhes & Classificação</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "items"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Peças & Itens</span>
            {requestedItems.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "items" ? "bg-white/20 text-white" : "bg-primary/20 text-primary"
              }`}>
                {requestedItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Form Body com Rolagem Suave */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6">
          
          {/* ABA 1: DETALHES & CLASSIFICAÇÃO (2 Colunas Desktop) */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-150">
              {/* Coluna 1: Conteúdo Principal (7 de 12) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Título Resumido */}
                <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Título do Chamado *
                    </label>
                    <span className="text-[11px] text-muted-foreground font-medium">Claro e direto</span>
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Lentidão severa no sistema de faturamento ao emitir notas..."
                    className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-foreground text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                  />
                </div>

                {/* Descrição Detalhada */}
                <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Descrição do Problema / Sintomas *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o que ocorreu, mensagens de erro exibidas, quando começou e procedimentos já realizados..."
                    className="w-full rounded-xl border border-border bg-surface-elevated p-3.5 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-y leading-relaxed placeholder:text-muted-foreground/60"
                  />
                </div>

                {/* Ativo / Equipamento CMDB */}
                <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-primary" />
                      Ativo CMDB Relacionado
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddAssetModal(true)}
                      className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Cadastrar Ativo
                    </button>
                  </div>
                  <SmartSelect
                    placeholder="Selecione ativo do inventário ou cadastre rápido..."
                    value={assetId}
                    options={assetsList.map((a) => ({
                      id: a.id,
                      label: a.name,
                      sublabel: a.asset_tag ? `Tag: ${a.asset_tag}` : a.internal_id,
                      badge: a.type
                    }))}
                    onChange={(val) => setAssetId(val)}
                    onCreateOption={handleCreateAsset}
                    creatableText="+ Cadastrar Ativo Rápido"
                    clearable
                  />
                  <div>
                    <input
                      type="text"
                      value={customAssetNote}
                      onChange={(e) => setCustomAssetNote(e.target.value)}
                      placeholder="Ou digite a identificação manual (Ex: PC mesa 04 do Financeiro / Notebook preto Lenovo)..."
                      className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-xs focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>
              </div>

              {/* Coluna 2: Classificação & Atribuição (5 de 12) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Solicitante */}
                <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Solicitante do Chamado *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(true)}
                      className="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors cursor-pointer"
                      title="Cadastrar usuário completo"
                    >
                      <UserPlus className="w-3 h-3" />
                      + Completo
                    </button>
                  </div>
                  <SmartSelect
                    placeholder="Pesquise por nome, e-mail ou digite para criar na hora..."
                    value={requesterId}
                    options={requestersList.map(r => ({
                      id: r.id,
                      label: r.name,
                      sublabel: r.email ? `${r.email}${r.department ? ` • Setor: ${r.department}` : ''}` : (r.department ? `Setor: ${r.department}` : undefined),
                      badge: r.type === "REQUESTER" ? "Manual" : "Colaborador"
                    }))}
                    onChange={(val, opt) => {
                      setRequesterId(val);
                      setRequesterName(opt?.label || "");
                    }}
                    onCreateOption={handleCreateRequester}
                    creatableText="+ Adicionar Solicitante"
                    emptyMessage="Nenhum solicitante encontrado. Digite para cadastrar na hora."
                  />
                </div>

                {/* Tipo e Categoria */}
                <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                      Tipo *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-xs font-bold focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="INCIDENT">🚨 Incidente (Falha)</option>
                      <option value="REQUEST">📋 Requisição (Pedido)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Categoria *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddCategoryModal(true)}
                        className="text-[11px] font-bold text-primary hover:text-primary-hover cursor-pointer"
                      >
                        + Nova
                      </button>
                    </div>
                    <SmartSelect
                      placeholder="Selecione categoria..."
                      value={categoryId}
                      options={categoriesList.map((c) => ({
                        id: c.id,
                        label: c.name,
                        sublabel: c.description || undefined
                      }))}
                      onChange={(val) => setCategoryId(val)}
                      onCreateOption={handleCreateCategory}
                      creatableText="+ Nova Categoria"
                    />
                  </div>
                </div>

                {/* Setor e Responsável Técnico */}
                <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs space-y-3.5">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Setor / Departamento
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddDeptModal(true)}
                        className="text-[11px] font-bold text-primary hover:text-primary-hover cursor-pointer"
                      >
                        + Novo
                      </button>
                    </div>
                    <SmartSelect
                      placeholder="Selecione ou digite setor..."
                      value={groupId}
                      options={departmentsList.map((d) => ({
                        id: d.id,
                        label: d.name
                      }))}
                      onChange={(val) => setGroupId(val)}
                      onCreateOption={handleCreateDepartment}
                      creatableText="+ Novo Setor"
                      clearable
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-primary" />
                      Responsável Técnico
                    </label>
                    <SmartSelect
                      placeholder="Técnico ou digite qualquer nome livre..."
                      value={assignedToId || assignedToName}
                      options={usersList.map((u) => ({
                        id: u.id,
                        label: u.name,
                        sublabel: u.job_title ? `${u.email} - ${u.job_title}` : u.email,
                        badge: "Técnico"
                      }))}
                      onChange={(val, opt) => {
                        if (usersList.some(u => u.id === val)) {
                          setAssignedToId(val);
                          setAssignedToName(opt?.label || "");
                        } else {
                          setAssignedToId("");
                          setAssignedToName(opt?.label || val);
                        }
                      }}
                      onCreateOption={async (name) => {
                        setAssignedToId("");
                        setAssignedToName(name);
                        return { id: name, label: name, badge: "Manual" };
                      }}
                      creatableText="+ Atribuir a"
                      clearable
                      emptyMessage="Nenhum técnico na lista. Digite para atribuir livremente."
                    />
                  </div>
                </div>

                {/* Matriz de Prioridade ITIL */}
                <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs space-y-3">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                    Prioridade ITIL (SLA)
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Urgência</label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as any)}
                        className="w-full rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-foreground text-xs font-medium cursor-pointer"
                      >
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta</option>
                        <option value="CRITICAL">Crítica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Impacto</label>
                      <select
                        value={impact}
                        onChange={(e) => setImpact(e.target.value as any)}
                        className="w-full rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-foreground text-xs font-medium cursor-pointer"
                      >
                        <option value="LOW">Baixo</option>
                        <option value="MEDIUM">Médio</option>
                        <option value="HIGH">Alto</option>
                        <option value="CRITICAL">Crítico</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-border/50">
                    <span className="text-[11px] font-semibold text-muted-foreground">Prioridade Calculada:</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                      priority === "CRITICAL" ? "bg-danger/10 text-danger border-danger/30 animate-pulse" :
                      priority === "HIGH" ? "bg-warning/10 text-warning border-warning/30" :
                      priority === "MEDIUM" ? "bg-info/10 text-info border-info/30" :
                      "bg-success/10 text-success border-success/30"
                    }`}>
                      {priority === "CRITICAL" ? "CRÍTICA (SLA 4h)" :
                       priority === "HIGH" ? "ALTA (SLA 8h)" :
                       priority === "MEDIUM" ? "MÉDIA (SLA 24h)" :
                       "BAIXA (SLA 48h)"}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ABA 2: PEÇAS & ITENS SOLICITADOS */}
          {activeTab === "items" && (
            <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-2xs space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Box className="w-4 h-4 text-primary" />
                    Peças, Materiais & Acessos Requeridos
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adicione os componentes necessários para este atendimento.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleAddRequestedItem()}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Adicionar Item
                </button>
              </div>

              {requestedItems.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                  <Box className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-foreground">Nenhum item adicionado ao chamado</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Se o chamado envolve substituição de peças ou periféricos, selecione um atalho rápido abaixo:</p>
                  <div className="flex justify-center gap-2 mt-4 flex-wrap max-w-lg mx-auto">
                    <button
                      type="button"
                      onClick={() => handleAddRequestedItem({ name: "Mouse sem fio", quantity: 1, unit: "UN", details: "Óptico USB" })}
                      className="text-xs bg-surface-elevated border border-border px-3 py-1.5 rounded-lg text-foreground hover:border-primary/50 font-medium transition-colors cursor-pointer"
                    >
                      + Mouse sem fio
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddRequestedItem({ name: "Teclado USB", quantity: 1, unit: "UN", details: "ABNT2" })}
                      className="text-xs bg-surface-elevated border border-border px-3 py-1.5 rounded-lg text-foreground hover:border-primary/50 font-medium transition-colors cursor-pointer"
                    >
                      + Teclado USB
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddRequestedItem({ name: "Monitor 24 polegadas", quantity: 1, unit: "UN", details: "HDMI/DisplayPort" })}
                      className="text-xs bg-surface-elevated border border-border px-3 py-1.5 rounded-lg text-foreground hover:border-primary/50 font-medium transition-colors cursor-pointer"
                    >
                      + Monitor 24&quot;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddRequestedItem({ name: "Cabo de Rede Cat6", quantity: 1, unit: "UN", details: "3 metros montado" })}
                      className="text-xs bg-surface-elevated border border-border px-3 py-1.5 rounded-lg text-foreground hover:border-primary/50 font-medium transition-colors cursor-pointer"
                    >
                      + Cabo de Rede
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddRequestedItem({ name: "Toner Preto", quantity: 1, unit: "UN", details: "Para impressora do setor" })}
                      className="text-xs bg-surface-elevated border border-border px-3 py-1.5 rounded-lg text-foreground hover:border-primary/50 font-medium transition-colors cursor-pointer"
                    >
                      + Toner Impressora
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {requestedItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 bg-surface-elevated/70 border border-border rounded-xl items-center">
                      <div className="sm:col-span-1 text-xs font-bold text-muted-foreground text-center">
                        #{index + 1}
                      </div>
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 sm:hidden">Descrição do Item</label>
                        <SmartSelect
                          placeholder="Descrição do item ou catálogo..."
                          value={item.name}
                          options={catalogItems.map(ci => ({
                            id: ci.name,
                            label: ci.name,
                            sublabel: ci.category || undefined
                          }))}
                          onChange={(val, opt) => handleUpdateRequestedItem(item.id, "name", opt?.label || val)}
                          onCreateOption={handleCreateCatalogItem}
                          creatableText="+ Adicionar"
                          clearable
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 sm:hidden">Quantidade</label>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-bold text-muted-foreground hidden sm:inline">Qtd:</span>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateRequestedItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                            className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-border bg-surface text-foreground text-center"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 sm:hidden">Unidade</label>
                        <input
                          type="text"
                          placeholder="UN"
                          value={item.unit || "UN"}
                          onChange={(e) => handleUpdateRequestedItem(item.id, "unit", e.target.value)}
                          className="w-full text-xs font-medium px-2 py-1.5 rounded-lg border border-border bg-surface text-foreground text-center"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1 sm:hidden">Observação</label>
                        <input
                          type="text"
                          placeholder="Detalhes..."
                          value={item.details}
                          onChange={(e) => handleUpdateRequestedItem(item.id, "details", e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveRequestedItem(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* C — RODAPÉ FIXO (Sticky Footer) */}
        <div className="shrink-0 border-t border-border bg-surface px-6 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            type="button"
            onClick={handleExitTicket}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sair do Chamado</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-hover transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Registrando Chamado...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e Abrir Chamado</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* MODAL: Adicionar Novo Solicitante Manualmente */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Adicionar Novo Solicitante Manual
              </h4>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserInline} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  placeholder="carlos.silva@empresa.com.br"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    placeholder="Ex: Analista Contábil"
                    value={newUserJobTitle}
                    onChange={(e) => setNewUserJobTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Setor</label>
                  <select
                    value={newUserDeptId}
                    onChange={(e) => setNewUserDeptId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                  >
                    <option value="">Selecione...</option>
                    {departmentsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-surface-elevated"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover"
                >
                  {savingUser ? "Cadastrando..." : "Cadastrar e Selecionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar Nova Categoria Manualmente */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-primary" />
                Adicionar Nova Categoria Manual
              </h4>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategoryInline} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Segurança da Informação"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Descrição / Escopo</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Incidentes relacionados a antivírus, spam, bloqueios e firewall"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-surface-elevated"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover"
                >
                  {savingCategory ? "Salvando..." : "Salvar e Selecionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar Novo Setor Manualmente */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Adicionar Novo Setor / Departamento Manual
              </h4>
              <button
                type="button"
                onClick={() => setShowAddDeptModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeptInline} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Nome do Setor / Departamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Suporte N2 - Infraestrutura"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-surface-elevated"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDept}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover"
                >
                  {savingDept ? "Salvando..." : "Salvar e Selecionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cadastrar Ativo CMDB Manualmente */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <Laptop className="w-5 h-5 text-primary" />
                Cadastrar Ativo no CMDB Manualmente
              </h4>
              <button
                type="button"
                onClick={() => setShowAddAssetModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssetInline} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Nome do Equipamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Notebook Dell Latitude 3420"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Tipo de Ativo</label>
                  <select
                    value={newAssetType}
                    onChange={(e) => setNewAssetType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                  >
                    <option value="COMPUTER">Computador / Notebook</option>
                    <option value="MONITOR">Monitor de Vídeo</option>
                    <option value="PRINTER">Impressora</option>
                    <option value="NETWORK">Equipamento de Rede</option>
                    <option value="OTHER">Outro Dispositivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Plaqueta / Patrimônio</label>
                  <input
                    type="text"
                    placeholder="Ex: PAT-0129"
                    value={newAssetTag}
                    onChange={(e) => setNewAssetTag(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Fabricante</label>
                  <input
                    type="text"
                    placeholder="Ex: Dell / HP / Lenovo"
                    value={newAssetManufacturer}
                    onChange={(e) => setNewAssetManufacturer(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: Inspiron 15"
                    value={newAssetModel}
                    onChange={(e) => setNewAssetModel(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-surface-elevated"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAsset}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover"
                >
                  {savingAsset ? "Cadastrando..." : "Cadastrar e Vincular"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
