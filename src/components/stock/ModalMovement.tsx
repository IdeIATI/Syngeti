"use client";

import { useState, useEffect } from "react";
import { X, ArrowDownRight, ArrowUpRight, SlidersHorizontal, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

interface ModalMovementProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (movement: any) => void;
  products: any[];
  preSelectedProductId?: string;
  suppliers: any[];
  assets?: any[];
}

export default function ModalMovement({
  isOpen,
  onClose,
  onSuccess,
  products,
  preSelectedProductId,
  suppliers,
  assets = [],
}: ModalMovementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productId, setProductId] = useState("");
  const [type, setType] = useState<"IN_PURCHASE" | "OUT_CONSUMPTION" | "OUT_MAINTENANCE" | "ADJUSTMENT" | "RETURN">("OUT_CONSUMPTION");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [documentRef, setDocumentRef] = useState("");
  const [destination, setDestination] = useState("");
  const [assetId, setAssetId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [reason, setReason] = useState("");

  // Ajuste modes
  const [adjustmentMode, setAdjustmentMode] = useState<"SET_BALANCE" | "ADD" | "SUB">("SET_BALANCE");
  const [targetBalance, setTargetBalance] = useState("0");

  useEffect(() => {
    if (preSelectedProductId) {
      setProductId(preSelectedProductId);
    } else if (products.length > 0 && !productId) {
      setProductId(products[0].id);
    }
    setError(null);
  }, [preSelectedProductId, products, isOpen]);

  // Selected product
  const selectedProduct = products.find((p) => p.id === productId);
  const currentStock = selectedProduct?.current_stock ?? 0;
  const unitName = selectedProduct?.unit || "UN";

  // Pre-fill unit cost from product's last_cost if type is purchase
  useEffect(() => {
    if (type === "IN_PURCHASE" && selectedProduct && !unitCost) {
      if (selectedProduct.last_cost > 0) {
        setUnitCost(String(selectedProduct.last_cost));
      }
    }
  }, [type, selectedProduct]);

  if (!isOpen) return null;

  // Real-time calculation of balance after movement
  let calculatedBalanceAfter = currentStock;
  const numQty = Number(quantity) || 0;

  if (type === "IN_PURCHASE" || type === "RETURN") {
    calculatedBalanceAfter = currentStock + numQty;
  } else if (type === "OUT_CONSUMPTION" || type === "OUT_MAINTENANCE") {
    calculatedBalanceAfter = currentStock - numQty;
  } else if (type === "ADJUSTMENT") {
    if (adjustmentMode === "SET_BALANCE") {
      calculatedBalanceAfter = Number(targetBalance) || 0;
    } else if (adjustmentMode === "SUB") {
      calculatedBalanceAfter = currentStock - numQty;
    } else {
      calculatedBalanceAfter = currentStock + numQty;
    }
  }

  const isNegative = calculatedBalanceAfter < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId) {
      setError("Selecione um produto.");
      return;
    }

    if (type !== "ADJUSTMENT" && numQty <= 0) {
      setError("A quantidade deve ser maior que zero.");
      return;
    }

    if (type === "ADJUSTMENT" && !reason.trim()) {
      setError("A justificativa é obrigatória para qualquer ajuste de estoque.");
      return;
    }

    if (isNegative) {
      setError(`Operação bloqueada: O saldo ficaria negativo (${calculatedBalanceAfter} ${unitName}).`);
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        product_id: productId,
        type,
        quantity: numQty,
        unit_cost: unitCost ? Number(unitCost) : null,
        supplier_id: (type === "IN_PURCHASE" && supplierId) ? supplierId : null,
        document_ref: documentRef.trim() || null,
        destination: destination.trim() || null,
        asset_id: assetId || null,
        ticket_id: ticketId.trim() || null,
        reason: reason.trim() || null,
      };

      if (type === "ADJUSTMENT") {
        payload.adjustment_mode = adjustmentMode;
        payload.target_balance = Number(targetBalance);
      }

      const res = await fetch("/api/stock/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao registrar movimentação");
      }

      onSuccess(data);
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
        className="bg-surface border border-border rounded-2xl w-[94vw] max-w-[850px] max-h-[92dvh] shadow-2xl flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              type === "IN_PURCHASE" || type === "RETURN"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : type === "ADJUSTMENT"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
            }`}>
              {type === "IN_PURCHASE" || type === "RETURN" ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : type === "ADJUSTMENT" ? (
                <SlidersHorizontal className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                Lançar Movimentação de Estoque
              </h2>
              <p className="text-xs text-muted-foreground">
                Livro Kardex oficial — registro atômico, imutável e com bloqueio de saldo negativo.
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
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipo de Movimentação */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Tipo de Operação
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType("OUT_CONSUMPTION")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  type === "OUT_CONSUMPTION"
                    ? "bg-blue-500/15 border-blue-500 text-blue-400 shadow-sm"
                    : "bg-surface-elevated/40 border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 mb-1 text-blue-400" />
                Saída (Consumo/Uso)
              </button>

              <button
                type="button"
                onClick={() => setType("IN_PURCHASE")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  type === "IN_PURCHASE"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm"
                    : "bg-surface-elevated/40 border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                <ArrowDownRight className="w-4 h-4 mb-1 text-emerald-400" />
                Entrada (Compra / NF)
              </button>

              <button
                type="button"
                onClick={() => setType("OUT_MAINTENANCE")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  type === "OUT_MAINTENANCE"
                    ? "bg-purple-500/15 border-purple-500 text-purple-400 shadow-sm"
                    : "bg-surface-elevated/40 border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                <Sparkles className="w-4 h-4 mb-1 text-purple-400" />
                Saída Manutenção
              </button>

              <button
                type="button"
                onClick={() => setType("ADJUSTMENT")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  type === "ADJUSTMENT"
                    ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm"
                    : "bg-surface-elevated/40 border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 mb-1 text-amber-400" />
                Ajuste de Inventário
              </button>
            </div>
          </div>

          {/* Seleção do Produto & Card de Saldo */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Produto / Peça de TI <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer font-medium"
              >
                <option value="" disabled>Selecione a peça ou equipamento...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} {p.part_number ? `(PN: ${p.part_number})` : ""} — Saldo: {p.current_stock} {p.unit}
                  </option>
                ))}
              </select>
              {selectedProduct?.location && (
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Localização no almoxarifado: <strong className="text-foreground">{selectedProduct.location}</strong>
                </span>
              )}
            </div>

            {/* Simulador de Saldo em Tempo Real */}
            <div className={`sm:col-span-4 p-3.5 rounded-xl border flex flex-col justify-between ${
              isNegative 
                ? "bg-red-500/10 border-red-500/40 text-red-400" 
                : "bg-surface-elevated/60 border-border"
            }`}>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Simulação de Saldo
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-muted-foreground">Atual: <strong>{currentStock}</strong></span>
                <span className="text-xs font-bold">➔</span>
                <span className={`text-base font-extrabold ${isNegative ? "text-red-500" : "text-foreground"}`}>
                  {calculatedBalanceAfter} {unitName}
                </span>
              </div>
              {isNegative ? (
                <div className="text-[10px] text-red-500 font-bold mt-1">
                  ⚠ Bloqueio: Saldo ficaria negativo!
                </div>
              ) : (
                <div className="text-[10px] text-emerald-500/90 font-medium mt-1">
                  ✓ Saldo final válido
                </div>
              )}
            </div>
          </div>

          {/* Campos Específicos por Tipo */}

          {/* Ajuste de Inventário */}
          {type === "ADJUSTMENT" && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4" />
                Parâmetros do Ajuste de Contagem Física
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Modo do Ajuste
                  </label>
                  <select
                    value={adjustmentMode}
                    onChange={(e: any) => setAdjustmentMode(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="SET_BALANCE">Definir Novo Saldo Físico Real</option>
                    <option value="ADD">Adicionar Quantidade (+)</option>
                    <option value="SUB">Subtrair Quantidade (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {adjustmentMode === "SET_BALANCE" ? "Saldo Contado no Almoxarifado" : "Quantidade a Ajustar"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adjustmentMode === "SET_BALANCE" ? targetBalance : quantity}
                    onChange={(e) => {
                      if (adjustmentMode === "SET_BALANCE") {
                        setTargetBalance(e.target.value);
                      } else {
                        setQuantity(e.target.value);
                      }
                    }}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quantidade (para não-ajuste) */}
          {type !== "ADJUSTMENT" && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Quantidade Movimentada <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-muted-foreground font-semibold">
                    {unitName}
                  </span>
                </div>
              </div>

              {type === "IN_PURCHASE" && (
                <>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Custo Unitário (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Custo Total da Compra
                    </label>
                    <div className="w-full bg-surface-elevated/40 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground font-mono">
                      R$ {((Number(quantity) || 0) * (Number(unitCost) || 0)).toFixed(2)}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Vínculo de Fornecedor & Nota Fiscal na Entrada */}
          {type === "IN_PURCHASE" && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Fornecedor da Compra
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Selecione o fornecedor (opcional)...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.trade_name || s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Número da Nota Fiscal / Pedido de Compra
                </label>
                <input
                  type="text"
                  value={documentRef}
                  onChange={(e) => setDocumentRef(e.target.value)}
                  placeholder="Ex: NF-e 104523 ou Pedido #7890"
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>
          )}

          {/* Vínculo de Máquina/Ativo CMDB & Destino na Saída */}
          {(type === "OUT_CONSUMPTION" || type === "OUT_MAINTENANCE") && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Máquina / Equipamento CMDB Destino
                </label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Vincular a equipamento inventariado (opcional)...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.asset_tag || "S/ TAG"}] {a.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Cria rastreabilidade direta no histórico do equipamento.
                </span>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Destino Livre / Setor / Linha de Produção
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Ex: Linha DTF 01 / Recepção / Troca preventiva"
                  className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Justificativa / Motivo */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Motivo / Justificativa {type === "ADJUSTMENT" && <span className="text-red-500">* (Obrigatório em Ajuste)</span>}
            </label>
            <textarea
              required={type === "ADJUSTMENT"}
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                type === "ADJUSTMENT"
                  ? "Descreva detalhadamente o motivo da correção (ex: contagem de inventário trimestral, peça danificada, etc.)"
                  : "Observações adicionais ou identificação da manutenção realizada..."
              }
              className="w-full bg-surface-elevated border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            />
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
            disabled={loading || isNegative}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 ${
              isNegative
                ? "bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Registrando no Kardex...
              </>
            ) : isNegative ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                Saldo Negativo Bloqueado
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Movimentação
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
