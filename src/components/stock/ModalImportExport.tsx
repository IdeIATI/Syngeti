"use client";

import { useState } from "react";
import { X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, RefreshCw, Info } from "lucide-react";

interface ModalImportExportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  products: any[];
  categories: any[];
}

export default function ModalImportExport({
  isOpen,
  onClose,
  onImportSuccess,
  products,
  categories,
}: ModalImportExportProps) {
  const [activeTab, setActiveTab] = useState<"EXPORT" | "IMPORT">("EXPORT");
  const [fileContent, setFileContent] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  // 1. EXPORTAÇÃO CSV FORMATADO COM UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      "SKU",
      "Nome",
      "Categoria",
      "Tipo",
      "Unidade",
      "Marca",
      "Modelo",
      "Part Number",
      "Compatibilidade",
      "Localizacao",
      "Saldo Atual",
      "Estoque Minimo",
      "Ponto Reposicao",
      "Ultimo Custo (R$)",
      "Custo Medio (R$)",
      "Valor Total (R$)",
      "Status",
    ];

    const escapeCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = products.map((p) => {
      const unitVal = p.avg_cost > 0 ? p.avg_cost : (p.last_cost > 0 ? p.last_cost : 0);
      const totalVal = (p.current_stock || 0) * unitVal;
      return [
        escapeCell(p.sku),
        escapeCell(p.name),
        escapeCell(p.category?.name || ""),
        escapeCell(p.type),
        escapeCell(p.unit),
        escapeCell(p.brand || ""),
        escapeCell(p.model || ""),
        escapeCell(p.part_number || ""),
        escapeCell(p.compatibility || ""),
        escapeCell(p.location || ""),
        escapeCell(p.current_stock ?? 0),
        escapeCell(p.min_stock ?? 0),
        escapeCell(p.reorder_point ?? 0),
        escapeCell((p.last_cost || 0).toFixed(2)),
        escapeCell((p.avg_cost || 0).toFixed(2)),
        escapeCell(totalVal.toFixed(2)),
        escapeCell(p.status === "ACTIVE" ? "Ativo" : "Inativo"),
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `syngeti_estoque_pecas_ti_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. PARSER DE CSV PARA IMPORTAÇÃO
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingError(null);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setParsingError("Arquivo vazio");
        return;
      }
      setFileContent(text);
      parseCSV(text);
    };
    reader.onerror = () => setParsingError("Erro ao ler o arquivo.");
    reader.readAsText(file, "UTF-8");
  };

  const parseCSV = (content: string) => {
    try {
      const cleanContent = content.replace(/^\uFEFF/, "");
      const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setParsingError("O arquivo deve conter pelo menos o cabeçalho e 1 linha de dados.");
        return;
      }

      // Detect delimiter (, or ;)
      const delimiter = lines[0].includes(";") ? ";" : ",";
      const rawHeaders = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());

      const dataRows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Simple token split respecting quotes
        const tokens = line.split(delimiter).map((t) => t.replace(/^["']|["']$/g, "").trim());
        const rowObj: any = {};
        rawHeaders.forEach((header, idx) => {
          rowObj[header] = tokens[idx] || "";
        });

        // Resolve campos
        const name = rowObj["nome"] || rowObj["produto"] || rowObj["descricao"] || rowObj["item"] || "";
        const sku = rowObj["sku"] || rowObj["codigo"] || "";
        const categoryName = rowObj["categoria"] || rowObj["grupo"] || "";
        const brand = rowObj["marca"] || "";
        const model = rowObj["modelo"] || "";
        const partNumber = rowObj["part number"] || rowObj["part_number"] || rowObj["pn"] || "";
        const unit = (rowObj["unidade"] || rowObj["un"] || "UN").toUpperCase();
        const location = rowObj["localizacao"] || rowObj["local"] || rowObj["prateleira"] || "";
        const minStock = Number(rowObj["estoque minimo"] || rowObj["min_stock"] || 0);
        const reorderPoint = Number(rowObj["ponto reposicao"] || rowObj["reorder_point"] || 0);
        const cost = Number((rowObj["custo"] || rowObj["ultimo custo"] || "0").replace(",", "."));
        const initialStock = Number(rowObj["saldo"] || rowObj["saldo inicial"] || rowObj["quantidade"] || 0);

        if (name) {
          dataRows.push({
            name,
            sku,
            categoryName,
            brand,
            model,
            part_number: partNumber,
            unit,
            location,
            min_stock: isNaN(minStock) ? 0 : minStock,
            reorder_point: isNaN(reorderPoint) ? 0 : reorderPoint,
            last_cost: isNaN(cost) ? 0 : cost,
            initial_stock: isNaN(initialStock) ? 0 : initialStock,
          });
        }
      }

      setParsedRows(dataRows);
    } catch (err: any) {
      setParsingError("Falha ao processar arquivo: " + err.message);
    }
  };

  // 3. EXECUÇÃO DO BATCH DE IMPORTAÇÃO
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setImporting(true);
    setImportResults(null);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Map default category
    const defaultCatId = categories.length > 0 ? categories[0].id : "";

    for (const row of parsedRows) {
      try {
        let catId = defaultCatId;
        if (row.categoryName) {
          const matchCat = categories.find((c) => c.name.toLowerCase() === row.categoryName.toLowerCase());
          if (matchCat) catId = matchCat.id;
        }

        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name,
            sku: row.sku || undefined,
            category_id: catId,
            brand: row.brand || null,
            model: row.model || null,
            part_number: row.part_number || null,
            unit: row.unit || "UN",
            location: row.location || null,
            min_stock: row.min_stock || 0,
            reorder_point: row.reorder_point || 0,
            last_cost: row.last_cost || 0,
            initial_stock: row.initial_stock || 0,
            status: "ACTIVE",
          }),
        });

        const data = await res.json();
        if (res.ok) {
          success++;
        } else {
          failed++;
          errors.push(`${row.name}: ${data.error || "Erro desconhecido"}`);
        }
      } catch (err: any) {
        failed++;
        errors.push(`${row.name}: ${err.message}`);
      }
    }

    setImporting(false);
    setImportResults({ success, failed, errors });
    if (success > 0) {
      onImportSuccess();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border rounded-2xl w-[94vw] max-w-[750px] max-h-[92dvh] shadow-2xl flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                Importação & Exportação de Estoque
              </h2>
              <p className="text-xs text-muted-foreground">
                Gere planilhas em formato Excel/CSV ou cadastre itens em lote rapidamente.
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

        {/* Tab switch */}
        <div className="flex border-b border-border bg-surface px-6 pt-3 shrink-0 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("EXPORT")}
            className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "EXPORT"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Download className="w-4 h-4" />
            Exportar Planilha (CSV/Excel)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("IMPORT")}
            className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "IMPORT"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="w-4 h-4" />
            Importar em Lote (CSV)
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === "EXPORT" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Exportação Completa com Rastreabilidade
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O arquivo gerado inclui todos os <strong>{products.length} itens</strong> cadastrados, com seus respectivos saldos atuais, estoque mínimo, ponto de reposição, localização física no almoxarifado, custos médios e valor financeiro total imobilizado em estoque.
                </p>
                <div className="text-[11px] text-muted-foreground font-medium pt-1">
                  ✓ Codificação UTF-8 BOM (compatível com Microsoft Excel brasileiro sem caracteres desconfigurados).
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Baixar Planilha CSV Agora
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 shrink-0" />
                  Formato esperado do CSV:
                </div>
                <p className="leading-relaxed text-[11px]">
                  Cabeçalhos aceitos (separados por vírgula ou ponto-e-vírgula):
                  <br />
                  <code className="text-foreground font-mono">
                    nome; categoria; sku; part_number; unidade; marca; modelo; localizacao; estoque_minimo; custo; saldo
                  </code>
                </p>
              </div>

              {/* Upload picker */}
              <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 text-center transition-all bg-surface-elevated/30">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <label className="cursor-pointer block">
                  <span className="text-xs sm:text-sm font-bold text-primary hover:underline">
                    Clique para selecionar seu arquivo .CSV
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    ou arraste o arquivo até aqui
                  </span>
                  <input
                    type="file"
                    accept=".csv, text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {parsingError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {parsingError}
                </div>
              )}

              {/* Preview table */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground">
                      Pré-visualização ({parsedRows.length} itens identificados):
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-elevated/80 text-muted-foreground font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">Nome</th>
                          <th className="p-2">Part Number</th>
                          <th className="p-2">Unidade</th>
                          <th className="p-2">Local</th>
                          <th className="p-2">Custo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parsedRows.slice(0, 8).map((row, idx) => (
                          <tr key={idx} className="hover:bg-surface-elevated/30">
                            <td className="p-2 font-medium text-foreground">{row.name}</td>
                            <td className="p-2 font-mono text-muted-foreground">{row.part_number || "-"}</td>
                            <td className="p-2">{row.unit}</td>
                            <td className="p-2">{row.location || "-"}</td>
                            <td className="p-2 font-mono">R$ {row.last_cost.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedRows.length > 8 && (
                    <span className="text-[11px] text-muted-foreground italic">
                      + {parsedRows.length - 8} outros itens serão importados.
                    </span>
                  )}
                </div>
              )}

              {/* Results summary */}
              {importResults && (
                <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2">
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-emerald-400">✓ {importResults.success} importados com sucesso</span>
                    {importResults.failed > 0 && (
                      <span className="text-red-400">✗ {importResults.failed} falhas</span>
                    )}
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className="max-h-28 overflow-y-auto text-[11px] text-red-400 space-y-1">
                      {importResults.errors.map((e, idx) => (
                        <div key={idx}>• {e}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {parsedRows.length > 0 && !importResults && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={importing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Importando {parsedRows.length} itens...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Confirmar e Inserir {parsedRows.length} Produtos
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
