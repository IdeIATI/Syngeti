"use client";

import { useState, useEffect } from "react";
import { X, Building2, DollarSign, Clock, Star, Save, RefreshCw, AlertCircle, History } from "lucide-react";

interface ModalSupplierQuoteProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: any;
  suppliers: any[];
  existingLink?: any | null;
}

export default function ModalSupplierQuote({
  isOpen,
  onClose,
  onSuccess,
  product,
  suppliers,
  existingLink,
}: ModalSupplierQuoteProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [supplierProductCode, setSupplierProductCode] = useState("");
  const [price, setPrice] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("1");
  const [isPreferred, setIsPreferred] = useState(false);
  const [notes, setNotes] = useState("");
  const [documentRef, setDocumentRef] = useState("");

  useEffect(() => {
    if (existingLink) {
      setSupplierId(existingLink.supplier_id || "");
      setSupplierProductCode(existingLink.supplier_product_code || "");
      setPrice(String(existingLink.last_price || ""));
      setLeadTimeDays(existingLink.lead_time_days ? String(existingLink.lead_time_days) : "");
      setMinOrderQty(String(existingLink.min_order_qty || 1));
      setIsPreferred(Boolean(existingLink.is_preferred));
      setNotes(existingLink.notes || "");
    } else {
      setSupplierId(suppliers.length > 0 ? suppliers[0].id : "");
      setSupplierProductCode("");
      setPrice("");
      setLeadTimeDays("");
      setMinOrderQty("1");
      setIsPreferred(false);
      setNotes("");
    }
    setDocumentRef("");
    setError(null);
  }, [existingLink, isOpen, suppliers]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Selecione um fornecedor.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/products/${product.id}/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: supplierId,
          supplier_product_code: supplierProductCode.trim() || null,
          price: price ? Number(price) : 0,
          lead_time_days: leadTimeDays ? Number(leadTimeDays) : null,
          min_order_qty: Number(minOrderQty) || 1,
          is_preferred: isPreferred,
          notes: notes.trim() || null,
          document_ref: documentRef.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar cotação/vínculo");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border rounded-2xl w-[94vw] max-w-[650px] max-h-[92dvh] shadow-2xl flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                Vincular Fornecedor & Cotação
              </h2>
              <p className="text-xs text-muted-foreground">
                Item: <strong className="text-foreground">{product.name}</strong> ({product.sku})
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Fornecedor <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={Boolean(existingLink)}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer disabled:opacity-70"
            >
              <option value="" disabled>Selecione um fornecedor...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.trade_name || s.name} {s.cnpj ? `— CNPJ: ${s.cnpj}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Preço Cotado (R$) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-muted-foreground font-semibold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Part Number / Código no Fornecedor
              </label>
              <input
                type="text"
                value={supplierProductCode}
                onChange={(e) => setSupplierProductCode(e.target.value)}
                placeholder="Ex: FORN-XP600-09"
                className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Prazo de Entrega (Dias Úteis)
              </label>
              <input
                type="number"
                min="0"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                placeholder="Ex: 5"
                className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Quantidade Mínima de Pedido (MOQ)
              </label>
              <input
                type="number"
                min="1"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
                placeholder="1"
                className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Referência da Cotação (Nº Proposta, E-mail ou Orçamento)
            </label>
            <input
              type="text"
              value={documentRef}
              onChange={(e) => setDocumentRef(e.target.value)}
              placeholder="Ex: Proposta Comercial 2026/894"
              className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Fornecedor Preferencial Switch */}
          <div className="flex items-center gap-3 p-3 bg-surface-elevated/50 border border-border rounded-xl">
            <input
              type="checkbox"
              id="isPreferred"
              checked={isPreferred}
              onChange={(e) => setIsPreferred(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-border bg-surface cursor-pointer"
            />
            <label htmlFor="isPreferred" className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
              <Star className={`w-3.5 h-3.5 ${isPreferred ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
              Definir como Fornecedor Preferencial deste item
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Observações / Condições de Pagamento
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Frete FOB, faturamento em 28 dias."
              className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>
        </form>

        {/* Footer */}
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
                Salvando Cotação...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Vínculo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
