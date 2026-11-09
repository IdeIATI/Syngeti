"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Package, 
  Plus, 
  Save, 
  AlertCircle, 
  RefreshCw, 
  Upload, 
  Sparkles, 
  Check, 
  Building2, 
  Tag, 
  Edit3,
  Layers
} from "lucide-react";
import { 
  DEFAULT_ITEM_TYPES, 
  ItemTypeOption, 
  generateSmartSku, 
  extractTypeAcronym 
} from "@/lib/skuGenerator";

interface ModalProductProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
  productToEdit?: any | null;
  categories: any[];
  suppliers: any[];
  onReloadCategories?: () => void;
  onReloadSuppliers?: () => void;
}

const CUSTOM_TYPES_STORAGE_KEY = "syngeti_custom_product_types";

export default function ModalProduct({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
  categories,
  suppliers: initialSuppliers,
  onReloadCategories,
  onReloadSuppliers,
}: ModalProductProps) {
  const isEditing = Boolean(productToEdit?.id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lista local de fornecedores para permitir inserção inline imediata
  const [localSuppliers, setLocalSuppliers] = useState<any[]>(initialSuppliers || []);

  useEffect(() => {
    setLocalSuppliers(initialSuppliers || []);
  }, [initialSuppliers]);

  // Lista de tipos de item (Padrões + Customizados pelo usuário)
  const [customTypes, setCustomTypes] = useState<ItemTypeOption[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CUSTOM_TYPES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCustomTypes(parsed);
          }
        }
      } catch (e) {
        console.error("Falha ao carregar tipos customizados:", e);
      }
    }
  }, [isOpen]);

  const allItemTypes = useMemo(() => {
    const list = [...DEFAULT_ITEM_TYPES];
    customTypes.forEach((ct) => {
      if (!list.some((item) => item.id === ct.id)) {
        list.push(ct);
      }
    });
    return list;
  }, [customTypes]);

  // Form states
  const [sku, setSku] = useState("");
  const [isManualSku, setIsManualSku] = useState(false);
  const [nextSequence, setNextSequence] = useState<number>(1);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [unit, setUnit] = useState("UN");
  const [type, setType] = useState("PART");
  const [compatibility, setCompatibility] = useState("");
  const [location, setLocation] = useState("");
  const [minStock, setMinStock] = useState("0");
  const [reorderPoint, setReorderPoint] = useState("0");
  const [lastCost, setLastCost] = useState("0");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  // Initial stock & Supplier
  const [initialStock, setInitialStock] = useState("0");
  const [supplierId, setSupplierId] = useState("");

  // Novo Tipo de Item inline
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeAcronym, setNewTypeAcronym] = useState("");

  // Nova Categoria inline
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  // Novo Fornecedor inline
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierTrade, setNewSupplierTrade] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierCnpj, setNewSupplierCnpj] = useState("");
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [supplierSuccessMsg, setSupplierSuccessMsg] = useState<string | null>(null);

  // Busca a sequência numérica real do banco ao abrir modal para novo produto
  useEffect(() => {
    if (isOpen && !isEditing) {
      fetch("/api/products/next-sku")
        .then((r) => r.json())
        .then((data) => {
          if (data?.sequence) {
            setNextSequence(data.sequence);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, isEditing]);

  // Inicialização do formulário
  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku || "");
      setIsManualSku(true); // Na edição, respeita o SKU existente como padrão
      setName(productToEdit.name || "");
      setCategoryId(productToEdit.category_id || "");
      setBrand(productToEdit.brand || "");
      setModel(productToEdit.model || "");
      setPartNumber(productToEdit.part_number || "");
      setUnit(productToEdit.unit || "UN");
      setType(productToEdit.type || "PART");
      setCompatibility(productToEdit.compatibility || "");
      setLocation(productToEdit.location || "");
      setMinStock(String(productToEdit.min_stock ?? 0));
      setReorderPoint(String(productToEdit.reorder_point ?? 0));
      setLastCost(String(productToEdit.last_cost ?? 0));
      setPhotoUrl(productToEdit.photo_url || "");
      setNotes(productToEdit.notes || "");
      setStatus(productToEdit.status || "ACTIVE");
      setInitialStock("0");

      // Se o produto tiver fornecedor vinculado
      const preferred = productToEdit.suppliers?.find((s: any) => s.is_preferred) || productToEdit.suppliers?.[0];
      setSupplierId(preferred?.supplier_id || "");

      // Tenta extrair a sequência do SKU atual (ex: SEN-PR-0001 -> 1)
      if (productToEdit.sku) {
        const matches = productToEdit.sku.match(/\d+$/);
        if (matches) {
          const num = parseInt(matches[0], 10);
          if (!isNaN(num) && num > 0) setNextSequence(num);
        }
      }
    } else {
      setSku("");
      setIsManualSku(false);
      setName("");
      setCategoryId(categories.length > 0 ? categories[0].id : "");
      setBrand("");
      setModel("");
      setPartNumber("");
      setUnit("UN");
      setType("PART");
      setCompatibility("");
      setLocation("");
      setMinStock("2");
      setReorderPoint("5");
      setLastCost("0");
      setPhotoUrl("");
      setNotes("");
      setStatus("ACTIVE");
      setInitialStock("0");
      setSupplierId("");
    }
    setError(null);
    setShowNewType(false);
    setShowNewCategory(false);
    setShowNewSupplier(false);
    setSupplierSuccessMsg(null);
  }, [productToEdit, isOpen, categories]);

  // Recalcula o SKU automaticamente quando o nome ou o tipo mudarem (somente se não foi editado manualmente)
  useEffect(() => {
    if (!isEditing && !isManualSku) {
      if (name.trim()) {
        const currentTypeObj = allItemTypes.find((t) => t.id === type);
        const generated = generateSmartSku(
          name, 
          type, 
          nextSequence, 
          currentTypeObj?.name, 
          currentTypeObj?.acronym
        );
        setSku(generated);
      } else {
        setSku("");
      }
    }
  }, [name, type, nextSequence, isManualSku, isEditing, allItemTypes]);

  // Função para forçar a regeração do SKU pelo padrão inteligente
  const handleRegenerateSku = () => {
    if (!name.trim()) {
      setError("Digite o Nome do Produto para gerar o SKU inteligente.");
      return;
    }
    const currentTypeObj = allItemTypes.find((t) => t.id === type);
    const generated = generateSmartSku(
      name, 
      type, 
      nextSequence, 
      currentTypeObj?.name, 
      currentTypeObj?.acronym
    );
    setSku(generated);
    setIsManualSku(false);
    setError(null);
  };

  // Criação de Nova Categoria inline
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setCreatingCat(true);
      const res = await fetch("/api/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao criar categoria");
      
      if (onReloadCategories) onReloadCategories();
      setCategoryId(data.id);
      setNewCatName("");
      setShowNewCategory(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingCat(false);
    }
  };

  // Criação de Novo Tipo de Item inline
  const handleCreateType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const trimmedName = newTypeName.trim();
    const acronym = (newTypeAcronym.trim() || extractTypeAcronym("", trimmedName)).toUpperCase().slice(0, 4);
    const id = `CUSTOM_${trimmedName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;

    const newTypeObj: ItemTypeOption = {
      id,
      name: trimmedName,
      acronym,
      isCustom: true,
    };

    const updated = [...customTypes, newTypeObj];
    setCustomTypes(updated);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CUSTOM_TYPES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Falha ao salvar tipo customizado no storage:", e);
      }
    }

    setType(id);
    setNewTypeName("");
    setNewTypeAcronym("");
    setShowNewType(false);

    // Se o SKU for automático, já recalcula com a nova sigla
    if (!isManualSku && name.trim()) {
      const generated = generateSmartSku(name, id, nextSequence, trimmedName, acronym);
      setSku(generated);
    }
  };

  // Criação de Novo Fornecedor inline
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    try {
      setCreatingSupplier(true);
      setSupplierSuccessMsg(null);
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSupplierName.trim(),
          trade_name: newSupplierTrade.trim() || null,
          phone: newSupplierPhone.trim() || null,
          cnpj: newSupplierCnpj.trim() || null,
          status: "ACTIVE",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data || "Falha ao cadastrar fornecedor");
      }

      // Adiciona o novo fornecedor na lista local e já o seleciona
      setLocalSuppliers((prev) => [data, ...prev]);
      setSupplierId(data.id);
      setNewSupplierName("");
      setNewSupplierTrade("");
      setNewSupplierPhone("");
      setNewSupplierCnpj("");
      setShowNewSupplier(false);
      setSupplierSuccessMsg(`Fornecedor "${data.trade_name || data.name}" cadastrado e selecionado!`);

      if (onReloadSuppliers) onReloadSuppliers();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar fornecedor");
    } finally {
      setCreatingSupplier(false);
    }
  };

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("O nome do produto é obrigatório.");
      return;
    }

    if (!categoryId) {
      setError("Selecione uma categoria para o produto.");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        category_id: categoryId,
        brand: brand.trim() || null,
        model: model.trim() || null,
        part_number: partNumber.trim() || null,
        unit,
        type,
        compatibility: compatibility.trim() || null,
        location: location.trim() || null,
        min_stock: Number(minStock) || 0,
        reorder_point: Number(reorderPoint) || 0,
        last_cost: Number(lastCost) || 0,
        photo_url: photoUrl.trim() || null,
        notes: notes.trim() || null,
        status,
        supplier_id: supplierId || null,
      };

      // Metadados para tipos customizados
      const currentTypeObj = allItemTypes.find((t) => t.id === type);
      if (currentTypeObj?.isCustom) {
        payload.custom_type_name = currentTypeObj.name;
        payload.custom_acronym = currentTypeObj.acronym;
      }

      if (!isEditing) {
        payload.initial_stock = Number(initialStock) || 0;
      }

      const url = isEditing ? `/api/products/${productToEdit.id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar produto");
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border rounded-2xl w-[94vw] max-w-[950px] max-h-[92dvh] shadow-2xl flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                {isEditing ? `Editar Produto / Peça (${productToEdit.sku})` : "Cadastrar Novo Produto ou Peça de TI"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing 
                  ? "Atualize o código interno (SKU), especificações técnicas, tipo de item e fornecedores."
                  : "Geração automática inteligente de SKU (3 letras do produto + tipo + sequência). Totalmente editável."
                }
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {supplierSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{supplierSuccessMsg}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSupplierSuccessMsg(null)}
                className="text-emerald-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section 1: Identificação Básica */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Identificação, SKU Inteligente & Classificação
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              
              {/* SKU / Código Interno (Automático + Totalmente Editável) */}
              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    Código Interno (SKU) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateSku}
                    title="Recalcular SKU pelo padrão inteligente: [3 letras produto]-[tipo]-[sequencial]"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Padrão Auto
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value.toUpperCase());
                      setIsManualSku(true);
                    }}
                    placeholder="Ex: SEN-PR-0001"
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono tracking-wider font-bold"
                  />
                  {isManualSku && (
                    <span 
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      title="Código personalizado manualmente pelo usuário"
                    >
                      Personalizado
                    </span>
                  )}
                  {!isManualSku && sku && (
                    <span 
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                      title="Gerado automaticamente pelo padrão do sistema"
                    >
                      Auto
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Padrão: <strong>3 letras</strong> - <strong>Tipo</strong> - <strong>Sequência</strong></span>
                  <span className="font-mono text-foreground font-semibold">Ex: SEN-PR-0001</span>
                </div>
              </div>

              {/* Nome do Produto / Peça */}
              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nome do Produto / Peça de Equipamento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sensor Fim de Curso DTF 60cm XP600"
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  As 3 primeiras letras serão usadas no prefixo do SKU (ex: <strong>SEN</strong>).
                </span>
              </div>

              {/* Tipo de Item (Com opção de criar novos tipos manualmente) */}
              <div className="sm:col-span-6">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Tipo de Item <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewType(!showNewType)}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Novo Tipo
                  </button>
                </div>

                {showNewType && (
                  <div className="p-3 bg-surface-elevated/90 border border-primary/30 rounded-xl mb-2.5 space-y-2 animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-foreground">Cadastrar Novo Tipo de Item</div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7">
                        <input
                          type="text"
                          placeholder="Nome do tipo (ex: Ferramenta)..."
                          value={newTypeName}
                          onChange={(e) => {
                            setNewTypeName(e.target.value);
                            if (!newTypeAcronym) {
                              setNewTypeAcronym(extractTypeAcronym("", e.target.value));
                            }
                          }}
                          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Sigla (ex: FER)..."
                          value={newTypeAcronym}
                          onChange={(e) => setNewTypeAcronym(e.target.value.toUpperCase())}
                          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary font-mono uppercase"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleCreateType}
                          className="w-full h-full py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer font-medium"
                >
                  {allItemTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.acronym})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Define a sigla intermediária do SKU (ex: Peça Reposição = <strong>PR</strong>, Consumível TI = <strong>CTI</strong>).
                </span>
              </div>

              {/* Categoria */}
              <div className="sm:col-span-6">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Nova Categoria
                  </button>
                </div>

                {showNewCategory ? (
                  <div className="flex items-center gap-2 p-2 bg-surface-elevated/70 border border-primary/30 rounded-xl mb-2">
                    <input
                      type="text"
                      placeholder="Nome da nova categoria..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      disabled={creatingCat}
                      onClick={handleCreateCategory}
                      className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {creatingCat ? "Salvando..." : "Adicionar"}
                    </button>
                  </div>
                ) : null}

                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="" disabled>Selecione uma categoria...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Agrupamento para filtros, inventário e relatórios.
                </span>
              </div>

              {/* Part Number / Código Fabricante */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Part Number (Fabricante)
                </label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="Ex: CS-18021 / F1080"
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>

              {/* Marca */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Marca / Fabricante
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex: Epson, Novi, Kingston"
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Modelo */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Modelo da Peça
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ex: DTF-60 / XP600"
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Compatibilidade de Máquinas e Equipamentos */}
              <div className="sm:col-span-12">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Equipamentos / Máquinas Compatíveis
                </label>
                <input
                  type="text"
                  value={compatibility}
                  onChange={(e) => setCompatibility(e.target.value)}
                  placeholder="Ex: NOVI - DTF - 60 ( DTF UV ), Impressora Epson L1800, Plotter 1.60m"
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Permite aos técnicos localizarem peças compatíveis diretamente ao atender chamados de manutenção.
                </span>
              </div>

            </div>
          </div>

          {/* Section 2: Fornecedor, Estoque & Custos */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Fornecedor, Estoque & Parâmetros Físicos
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">

              {/* Fornecedor (Com criação inline para novos fornecedores) */}
              <div className="sm:col-span-12 p-3 bg-surface-elevated/40 border border-border/80 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    Fornecedor Principal
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewSupplier(!showNewSupplier)}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Novo Fornecedor
                  </button>
                </div>

                {showNewSupplier && (
                  <div className="p-3 bg-surface border border-primary/30 rounded-xl mb-3 space-y-2.5 animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-foreground">Cadastrar Fornecedor Manualmente</div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          required
                          placeholder="Razão Social / Nome da Empresa *"
                          value={newSupplierName}
                          onChange={(e) => setNewSupplierName(e.target.value)}
                          className="w-full bg-surface-elevated border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Nome Fantasia (Opcional)"
                          value={newSupplierTrade}
                          onChange={(e) => setNewSupplierTrade(e.target.value)}
                          className="w-full bg-surface-elevated border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Telefone / WhatsApp (Opcional)"
                          value={newSupplierPhone}
                          onChange={(e) => setNewSupplierPhone(e.target.value)}
                          className="w-full bg-surface-elevated border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="CNPJ (Opcional)"
                          value={newSupplierCnpj}
                          onChange={(e) => setNewSupplierCnpj(e.target.value)}
                          className="w-full bg-surface-elevated border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          disabled={creatingSupplier || !newSupplierName.trim()}
                          onClick={handleCreateSupplier}
                          className="w-full h-full py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                          {creatingSupplier ? "Salvando..." : "Cadastrar"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer font-medium"
                >
                  <option value="">Nenhum fornecedor inicial vinculado</option>
                  {localSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.trade_name || s.name} {s.cnpj ? `(${s.cnpj})` : ""}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Fornecedor vinculado para reposição e histórico de preços.
                </span>
              </div>

              {/* Localização Física no Estoque */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Localização Física no Almoxarifado / TI
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Prateleira A2 - Gaveta 04"
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Unidade de Medida */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Unidade Medida
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="UN">Unidade (UN)</option>
                  <option value="PAR">Par (PAR)</option>
                  <option value="KIT">Kit / Conjunto (KIT)</option>
                  <option value="M">Metro Linear (M)</option>
                  <option value="L">Litro (L)</option>
                  <option value="CX">Caixa (CX)</option>
                  <option value="PCT">Pacote (PCT)</option>
                </select>
              </div>

              {/* Status do Cadastro */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Status do Cadastro
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer font-semibold"
                >
                  <option value="ACTIVE" className="text-emerald-500">Ativo</option>
                  <option value="INACTIVE" className="text-red-500">Inativo (Descontinuado)</option>
                </select>
              </div>

              {/* Estoque Mínimo */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Estoque Mínimo (Alerta de Ruptura)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Dispara alerta vermelho quando saldo for menor ou igual.
                </span>
              </div>

              {/* Ponto de Reposição */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Ponto de Reposição (Gatilho de Compra)
                </label>
                <input
                  type="number"
                  min="0"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Sinaliza a hora exata de solicitar cotação a fornecedores.
                </span>
              </div>

              {/* Último Custo */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Último Custo de Aquisição (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lastCost}
                  onChange={(e) => setLastCost(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Valor unitário em Reais
                </span>
              </div>

              {/* Se for Novo Produto: Estoque Inicial */}
              {!isEditing && (
                <div className="sm:col-span-12 p-3 bg-surface-elevated/40 border border-border/80 rounded-xl">
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Estoque Físico Inicial (Saldo de Abertura)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono max-w-[200px]"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Lançará automaticamente a primeira movimentação de entrada no Kardex e valorizará o estoque.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Anexo e Notas */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">3</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Foto & Observações Técnicas
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  URL da Foto / Imagem da Peça
                </label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://exemplo.com/fotos/sensor-dtf.jpg"
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Observações / Instruções de Instalação
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Cuidado com a polaridade do cabo flat. Testar continuidade antes de ligar a fonte."
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-elevated/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? "Salvar Alterações" : "Concluir Cadastro"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
