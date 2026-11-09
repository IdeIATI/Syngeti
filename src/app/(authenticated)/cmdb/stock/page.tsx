"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Package, 
  Server, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Building2, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  MapPin, 
  RefreshCw, 
  DollarSign, 
  Boxes, 
  Cpu, 
  Clock, 
  ChevronRight,
  ExternalLink,
  ChevronDown,
  EyeOff,
  Sparkles,
  FileSpreadsheet
} from "lucide-react";

import ModalProduct from "@/components/stock/ModalProduct";
import ModalMovement from "@/components/stock/ModalMovement";
import ModalSupplierQuote from "@/components/stock/ModalSupplierQuote";
import ModalImportExport from "@/components/stock/ModalImportExport";

export default function StockManagementPage() {
  // Navigation tabs within Stock module
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "KARDEX" | "SUPPLIERS" | "REPLENISHMENT">("PRODUCTS");

  // Data states
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalItems: 0,
    activeItems: 0,
    criticalStock: 0,
    lowStock: 0,
    reorderStock: 0,
    needsReplenishment: 0,
    totalInventoryValue: 0,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");

  // Kardex filters
  const [kardexProductFilter, setKardexProductFilter] = useState("ALL");
  const [kardexTypeFilter, setKardexTypeFilter] = useState("ALL");

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [preSelectedProductId, setPreSelectedProductId] = useState<string | undefined>(undefined);

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteProduct, setQuoteProduct] = useState<any | null>(null);
  const [quoteExistingLink, setQuoteExistingLink] = useState<any | null>(null);

  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, suppRes, assetRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/product-categories"),
        fetch("/api/suppliers"),
        fetch("/api/assets"),
      ]);

      const [prodData, catData, suppData, assetData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        suppRes.json(),
        assetRes.json(),
      ]);

      if (prodData.products) {
        setProducts(prodData.products);
        setStats(prodData.stats);
      }
      if (Array.isArray(catData)) setCategories(catData);
      if (Array.isArray(suppData)) setSuppliers(suppData);
      if (Array.isArray(assetData)) setAssets(assetData);
    } catch (err) {
      console.error("Falha ao carregar dados do estoque:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (force = false) => {
    if (!force && movements.length > 0) return;
    try {
      setLoadingMovements(true);
      const res = await fetch("/api/stock/movements?limit=150");
      const data = await res.json();
      if (Array.isArray(data)) {
        setMovements(data);
      }
    } catch (err) {
      console.error("Falha ao carregar histórico Kardex:", err);
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "KARDEX") {
      fetchMovements();
    }
  }, [activeTab]);

  // Actions
  const handleOpenNewProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: any) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenNewMovement = (prodId?: string) => {
    setPreSelectedProductId(prodId);
    setIsMovementModalOpen(true);
  };

  const handleOpenQuote = (prod: any, existingLink?: any) => {
    setQuoteProduct(prod);
    setQuoteExistingLink(existingLink || null);
    setIsQuoteModalOpen(true);
  };

  const handleDeleteOrInactivate = async (product: any) => {
    const isMovementsCount = product._count?.movements > 0;
    const confirmMessage = isMovementsCount
      ? `O item '${product.name}' possui movimentações registradas no Kardex e será INATIVADO para manter a integridade contábil. Deseja prosseguir?`
      : `Deseja realmente excluir permanentemente o item '${product.name}'?`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar");
      alert(data.message || "Operação realizada com sucesso.");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category
      if (selectedCategory !== "ALL" && p.category_id !== selectedCategory) return false;
      // Type
      if (selectedType !== "ALL" && p.type !== selectedType) return false;
      // Status
      if (selectedStatus !== "ALL" && p.status !== selectedStatus) return false;
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(term);
        const matchesSku = p.sku.toLowerCase().includes(term);
        const matchesPn = p.part_number?.toLowerCase().includes(term);
        const matchesBrand = p.brand?.toLowerCase().includes(term);
        const matchesModel = p.model?.toLowerCase().includes(term);
        const matchesCompat = p.compatibility?.toLowerCase().includes(term);
        const matchesLoc = p.location?.toLowerCase().includes(term);
        if (!matchesName && !matchesSku && !matchesPn && !matchesBrand && !matchesModel && !matchesCompat && !matchesLoc) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, selectedType, selectedStatus, searchTerm]);

  // Replenishment items (current_stock <= min_stock OR <= reorder_point)
  const replenishmentItems = useMemo(() => {
    return products.filter((p) => p.status === "ACTIVE" && (p.current_stock <= p.min_stock || p.current_stock <= p.reorder_point));
  }, [products]);

  // Filtered Kardex
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (kardexProductFilter !== "ALL" && m.product_id !== kardexProductFilter) return false;
      if (kardexTypeFilter !== "ALL" && m.type !== kardexTypeFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesCode = m.code?.toLowerCase().includes(term);
        const matchesDoc = m.document_ref?.toLowerCase().includes(term);
        const matchesDest = m.destination?.toLowerCase().includes(term);
        const matchesReason = m.reason?.toLowerCase().includes(term);
        const matchesProd = m.product?.name?.toLowerCase().includes(term) || m.product?.sku?.toLowerCase().includes(term);
        if (!matchesCode && !matchesDoc && !matchesDest && !matchesReason && !matchesProd) return false;
      }
      return true;
    });
  }, [movements, kardexProductFilter, kardexTypeFilter, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Breadcrumb & Switcher between CMDB Assets and Stock */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link href="/cmdb" className="hover:text-primary transition-colors">
              CMDB / ESTOQUE
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-bold">Peças & Estoque de TI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-primary" />
            Controle de Peças, Insumos & Estoque
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gestão física e contábil de peças de impressoras DTF, cabeças de impressão, sensores, placas, cabos e periféricos.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsImportExportModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-surface-elevated/40 text-xs font-bold text-foreground hover:bg-surface-elevated transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Planilha (CSV)
          </button>

          <button
            type="button"
            onClick={() => handleOpenNewMovement()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Movimentação (Kardex)
          </button>

          <button
            type="button"
            onClick={handleOpenNewProduct}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Produto / Peça
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total em Estoque */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Total de Peças</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">{stats.totalItems}</span>
            <span className="text-xs text-muted-foreground font-semibold">({stats.activeItems} ativos)</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
            <span>Valor Imobilizado:</span>
            <strong className="text-foreground font-mono">
              R$ {stats.totalInventoryValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Itens a Repor */}
        <div 
          onClick={() => setActiveTab("REPLENISHMENT")}
          className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-500/40 transition-all"
        >
          <div className="flex justify-between items-center text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Necessitam Reposição</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold ${stats.needsReplenishment > 0 ? "text-amber-400" : "text-foreground"}`}>
              {stats.needsReplenishment}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">itens</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-400/90 font-medium">
            {stats.criticalStock} com estoque zerado
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Categorias Ativas</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">{categories.length}</span>
            <span className="text-xs text-muted-foreground font-semibold">grupos de TI</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Sensores, Cabeças, Tintas, Cabos
          </div>
        </div>

        {/* Fornecedores Homologados */}
        <div 
          onClick={() => setActiveTab("SUPPLIERS")}
          className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-all"
        >
          <div className="flex justify-between items-center text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Fornecedores</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground">{suppliers.length}</span>
            <span className="text-xs text-muted-foreground font-semibold">parceiros cadastrados</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/90 font-medium">
            Histórico & cotações ativas
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border bg-surface px-6 pt-3 rounded-2xl shadow-sm gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("PRODUCTS")}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "PRODUCTS"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="w-4 h-4" />
          Produtos & Peças ({filteredProducts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("KARDEX")}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "KARDEX"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-4 h-4" />
          Movimentações (Livro Kardex)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SUPPLIERS")}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "SUPPLIERS"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Fornecedores & Cotações
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("REPLENISHMENT")}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "REPLENISHMENT"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Itens a Repor
          {stats.needsReplenishment > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-extrabold">
              {stats.needsReplenishment}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PRODUTOS & PEÇAS */}
      {activeTab === "PRODUCTS" && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search */}
            <div className="sm:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, SKU, part number, compatibilidade..."
                className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Category filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type filter */}
            <div className="sm:col-span-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="PART">Peças de Reposição</option>
                <option value="EQUIPMENT">Equipamentos</option>
                <option value="SUPPLY">Insumos DTF</option>
                <option value="CONSUMABLE">Consumíveis</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="sm:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer font-semibold"
              >
                <option value="ACTIVE">Apenas Ativos</option>
                <option value="INACTIVE">Inativos</option>
                <option value="ALL">Todos os Status</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> Carregando estoque...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Package className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div className="text-sm font-bold text-foreground">Nenhum produto ou peça encontrado</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Não há itens correspondentes aos filtros selecionados. Cadastre uma nova peça ou ajuste a busca.
              </p>
              <button
                type="button"
                onClick={handleOpenNewProduct}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all"
              >
                Cadastrar Primeira Peça
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated/70 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">SKU / Identificação</th>
                    <th className="py-3 px-4">Produto & Compatibilidade</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Localização</th>
                    <th className="py-3 px-4 text-center">Saldo em Estoque</th>
                    <th className="py-3 px-4 text-right">Último Custo</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((p) => {
                    const isCritical = p.current_stock <= 0;
                    const isBelowMin = p.current_stock > 0 && p.current_stock <= p.min_stock;
                    const isReorder = p.current_stock > p.min_stock && p.current_stock <= p.reorder_point;
                    const unitVal = p.avg_cost > 0 ? p.avg_cost : (p.last_cost > 0 ? p.last_cost : 0);
                    const totalVal = (p.current_stock || 0) * unitVal;

                    return (
                      <tr key={p.id} className="hover:bg-surface-elevated/30 transition-colors">
                        {/* SKU */}
                        <td className="py-3 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{p.sku}</span>
                            {p.status === "INACTIVE" && (
                              <span className="px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 text-[9px] font-bold">
                                Inativo
                              </span>
                            )}
                          </div>
                          {p.part_number && (
                            <div className="text-[10px] text-muted-foreground font-normal">
                              PN: <strong className="text-foreground">{p.part_number}</strong>
                            </div>
                          )}
                        </td>

                        {/* Nome & Compatibilidade */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-foreground text-xs sm:text-sm">{p.name}</div>
                          {p.compatibility && (
                            <div className="text-[11px] text-muted-foreground truncate" title={p.compatibility}>
                              {p.compatibility}
                            </div>
                          )}
                          {(p.brand || p.model) && (
                            <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                              {[p.brand, p.model].filter(Boolean).join(" • ")}
                            </div>
                          )}
                        </td>

                        {/* Categoria */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-lg bg-surface-elevated text-muted-foreground text-[11px] font-medium border border-border">
                            {p.category?.name || "Sem categoria"}
                          </span>
                        </td>

                        {/* Localização */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.location ? (
                            <span className="flex items-center gap-1 text-[11px] text-foreground font-medium">
                              <MapPin className="w-3 h-3 text-primary shrink-0" />
                              {p.location}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60 italic">Não definida</span>
                          )}
                        </td>

                        {/* Saldo / Badges */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-extrabold font-mono text-foreground">
                              {p.current_stock} <span className="text-[10px] font-normal text-muted-foreground">{p.unit}</span>
                            </span>
                            {isCritical ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-black uppercase tracking-wider mt-0.5">
                                Zerado
                              </span>
                            ) : isBelowMin ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-black uppercase tracking-wider mt-0.5">
                                Abaixo Mín. ({p.min_stock})
                              </span>
                            ) : isReorder ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-black uppercase tracking-wider mt-0.5">
                                Reposição ({p.reorder_point})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold mt-0.5">
                                Regular
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Custo */}
                        <td className="py-3 px-4 text-right font-mono text-foreground whitespace-nowrap">
                          R$ {(p.last_cost || 0).toFixed(2)}
                          {p.avg_cost > 0 && p.avg_cost !== p.last_cost && (
                            <div className="text-[10px] text-muted-foreground">
                              Méd: R$ {p.avg_cost.toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* Valor Total */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground whitespace-nowrap">
                          R$ {totalVal.toFixed(2)}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Lançar Movimentação */}
                            <button
                              type="button"
                              onClick={() => handleOpenNewMovement(p.id)}
                              title="Lançar Entrada, Saída ou Ajuste"
                              className="p-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {/* Cotação Fornecedor */}
                            <button
                              type="button"
                              onClick={() => handleOpenQuote(p)}
                              title="Gerenciar Cotações & Fornecedores"
                              className="p-1.5 rounded-lg border border-border bg-surface-elevated/40 text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                            >
                              <Building2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(p)}
                              title="Editar Produto"
                              className="p-1.5 rounded-lg border border-border bg-surface-elevated/40 text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Inativar / Deletar */}
                            <button
                              type="button"
                              onClick={() => handleDeleteOrInactivate(p)}
                              title={p._count?.movements > 0 ? "Inativar Produto" : "Excluir Produto"}
                              className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KARDEX (LIVRO DE MOVIMENTAÇÕES) */}
      {activeTab === "KARDEX" && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 space-y-4">
          {/* Kardex Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código (MOV-...), NF, destino ou motivo..."
                className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={kardexProductFilter}
                onChange={(e) => setKardexProductFilter(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">Todos os Produtos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={kardexTypeFilter}
                onChange={(e) => setKardexTypeFilter(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">Todos os Tipos de Operação</option>
                <option value="IN_PURCHASE">Entrada (Compra/NF)</option>
                <option value="OUT_CONSUMPTION">Saída (Consumo/Uso)</option>
                <option value="OUT_MAINTENANCE">Saída Manutenção</option>
                <option value="ADJUSTMENT">Ajuste de Inventário</option>
                <option value="RETURN">Devolução</option>
              </select>
            </div>
          </div>

          {/* Kardex Table */}
          {loadingMovements ? (
            <div className="p-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> Carregando Livro Kardex...
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm space-y-2">
              <History className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <div>Nenhuma movimentação registrada no Kardex para os filtros atuais.</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated/70 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Código / Data</th>
                    <th className="py-3 px-4">Item (SKU)</th>
                    <th className="py-3 px-4">Operação</th>
                    <th className="py-3 px-4 text-center">Quantidade</th>
                    <th className="py-3 px-4 text-center">Saldo Resultante</th>
                    <th className="py-3 px-4">Origem / Destino / Documento</th>
                    <th className="py-3 px-4">Responsável & Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {filteredMovements.map((m) => {
                    const isEntry = m.type === "IN_PURCHASE" || m.type === "RETURN";
                    const isExit = m.type === "OUT_CONSUMPTION" || m.type === "OUT_MAINTENANCE";
                    const isAdjustment = m.type === "ADJUSTMENT";

                    return (
                      <tr key={m.id} className="hover:bg-surface-elevated/30 transition-colors">
                        {/* Código & Data */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-foreground block">{m.code}</span>
                          <span className="text-[10px] text-muted-foreground font-sans">
                            {new Date(m.movement_date).toLocaleString("pt-BR")}
                          </span>
                        </td>

                        {/* Produto */}
                        <td className="py-3 px-4 font-sans max-w-xs">
                          <span className="font-bold text-foreground block truncate">
                            {m.product?.name}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {m.product?.sku}
                          </span>
                        </td>

                        {/* Tipo de Operação */}
                        <td className="py-3 px-4 font-sans whitespace-nowrap">
                          {isEntry ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <ArrowDownRight className="w-3 h-3" />
                              {m.type === "RETURN" ? "Devolução" : "Entrada (Compra)"}
                            </span>
                          ) : isAdjustment ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <SlidersHorizontal className="w-3 h-3" />
                              Ajuste Inventário
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold flex items-center gap-1 w-fit">
                              <ArrowUpRight className="w-3 h-3" />
                              {m.type === "OUT_MAINTENANCE" ? "Saída Manutenção" : "Saída Consumo"}
                            </span>
                          )}
                        </td>

                        {/* Quantidade */}
                        <td className="py-3 px-4 text-center font-bold whitespace-nowrap">
                          <span className={isEntry ? "text-emerald-400" : isExit ? "text-blue-400" : "text-amber-400"}>
                            {isEntry ? "+" : isExit ? "-" : "±"}{m.quantity} {m.product?.unit}
                          </span>
                        </td>

                        {/* Saldo Resultante */}
                        <td className="py-3 px-4 text-center font-extrabold text-foreground whitespace-nowrap">
                          {m.balance_after} {m.product?.unit}
                        </td>

                        {/* Documento / Destino */}
                        <td className="py-3 px-4 font-sans text-xs max-w-xs">
                          {m.document_ref && (
                            <div className="font-mono text-foreground font-semibold">
                              Doc: {m.document_ref}
                            </div>
                          )}
                          {m.asset && (
                            <div className="text-[11px] text-primary flex items-center gap-1">
                              <Server className="w-3 h-3" />
                              [{m.asset.asset_tag || "CMDB"}] {m.asset.name}
                            </div>
                          )}
                          {m.destination && (
                            <div className="text-[11px] text-muted-foreground">
                              Destino: {m.destination}
                            </div>
                          )}
                          {m.supplier && (
                            <div className="text-[11px] text-muted-foreground">
                              Forn: {m.supplier.trade_name || m.supplier.name}
                            </div>
                          )}
                        </td>

                        {/* Responsável & Motivo */}
                        <td className="py-3 px-4 font-sans text-xs max-w-xs">
                          <div className="text-muted-foreground font-medium">
                            {m.user?.name || "Usuário"}
                          </div>
                          {m.reason && (
                            <div className="text-[11px] text-foreground italic mt-0.5">
                              "{m.reason}"
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FORNECEDORES & COTAÇÕES */}
      {activeTab === "SUPPLIERS" && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Comparativo de Fornecedores & Histórico de Cotações</h3>
              <p className="text-xs text-muted-foreground">
                Vincule fornecedores a cada peça, acompanhe a evolução dos preços cotados e defina fornecedores preferenciais.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => {
              const suppliersList = p.suppliers || [];
              const preferred = suppliersList.find((s: any) => s.is_preferred);

              return (
                <div key={p.id} className="bg-surface-elevated/40 border border-border rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] text-primary font-bold">{p.sku}</span>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">{p.name}</h4>
                      {p.part_number && (
                        <span className="text-[10px] text-muted-foreground font-mono">PN: {p.part_number}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenQuote(p)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Cotar
                    </button>
                  </div>

                  {suppliersList.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground/60 italic py-2">
                      Nenhum fornecedor vinculado a esta peça ainda.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {suppliersList.map((sup: any) => (
                        <div
                          key={sup.id}
                          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                            sup.is_preferred
                              ? "bg-amber-500/10 border-amber-500/30 text-foreground"
                              : "bg-surface border-border text-muted-foreground"
                          }`}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5 text-foreground">
                              {sup.supplier?.trade_name || sup.supplier?.name}
                              {sup.is_preferred && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase">
                                  Preferencial
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {sup.lead_time_days ? `Prazo: ${sup.lead_time_days} dias` : "Prazo não informado"} • MOQ: {sup.min_order_qty || 1} un
                              {sup.supplier_product_code && ` • Cód: ${sup.supplier_product_code}`}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-extrabold text-foreground text-xs block">
                              R$ {(sup.last_price || 0).toFixed(2)}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {new Date(sup.price_updated_at || sup.updated_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ITENS A REPOR */}
      {activeTab === "REPLENISHMENT" && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Quadro de Reposição Crítica & Sugestão de Compras
              </h3>
              <p className="text-xs text-muted-foreground">
                Peças com estoque abaixo do mínimo de segurança ou no gatilho do ponto de reposição.
              </p>
            </div>
          </div>

          {replenishmentItems.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-foreground">Estoque 100% Abastecido</div>
              <p className="text-xs text-muted-foreground">
                Nenhum item está abaixo do estoque mínimo ou no ponto de reposição no momento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated/70 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">SKU / Peça</th>
                    <th className="py-3 px-4">Local</th>
                    <th className="py-3 px-4 text-center">Saldo Atual</th>
                    <th className="py-3 px-4 text-center">Mínimo / Reposição</th>
                    <th className="py-3 px-4 text-center">Qtd Sugerida</th>
                    <th className="py-3 px-4">Fornecedor Preferencial</th>
                    <th className="py-3 px-4 text-right">Custo Estimado</th>
                    <th className="py-3 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {replenishmentItems.map((p) => {
                    const isZero = p.current_stock <= 0;
                    const suggestedQty = Math.max(1, p.reorder_point - p.current_stock);
                    const prefSupplier = p.suppliers?.find((s: any) => s.is_preferred) || p.suppliers?.[0];
                    const refPrice = prefSupplier?.last_price || p.last_cost || p.avg_cost || 0;
                    const estimatedCost = suggestedQty * refPrice;

                    return (
                      <tr key={p.id} className="hover:bg-surface-elevated/30">
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] text-primary font-bold block">{p.sku}</span>
                          <span className="font-bold text-foreground text-xs block">{p.name}</span>
                          {p.part_number && (
                            <span className="text-[10px] text-muted-foreground font-mono">PN: {p.part_number}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-muted-foreground font-medium">
                          {p.location || "-"}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`text-sm font-extrabold font-mono ${isZero ? "text-red-500" : "text-amber-400"}`}>
                            {p.current_stock} {p.unit}
                          </span>
                          <div className="text-[10px] font-bold uppercase tracking-wider">
                            {isZero ? "Crítico (Zerado)" : "Abaixo do Mín."}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                          {p.min_stock} / <strong className="text-foreground">{p.reorder_point}</strong>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-extrabold text-primary">
                          +{suggestedQty} {p.unit}
                        </td>

                        <td className="py-3 px-4 text-xs">
                          {prefSupplier ? (
                            <div>
                              <span className="font-bold text-foreground block">
                                {prefSupplier.supplier?.trade_name || prefSupplier.supplier?.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                R$ {prefSupplier.last_price?.toFixed(2)} / un
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Sem fornecedor vinculado</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                          R$ {estimatedCost.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenNewMovement(p.id)}
                            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            Dar Entrada
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAIS */}
      <ModalProduct
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={() => fetchData()}
        productToEdit={productToEdit}
        categories={categories}
        suppliers={suppliers}
        onReloadCategories={fetchData}
      />

      <ModalMovement
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSuccess={() => {
          fetchData();
          if (activeTab === "KARDEX") fetchMovements();
        }}
        products={products}
        preSelectedProductId={preSelectedProductId}
        suppliers={suppliers}
        assets={assets}
      />

      {quoteProduct && (
        <ModalSupplierQuote
          isOpen={isQuoteModalOpen}
          onClose={() => {
            setIsQuoteModalOpen(false);
            setQuoteProduct(null);
            setQuoteExistingLink(null);
          }}
          onSuccess={() => fetchData()}
          product={quoteProduct}
          suppliers={suppliers}
          existingLink={quoteExistingLink}
        />
      )}

      <ModalImportExport
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        onImportSuccess={() => fetchData()}
        products={products}
        categories={categories}
      />
    </div>
  );
}
