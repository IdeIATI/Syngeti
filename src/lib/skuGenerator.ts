/**
 * Utilitário para Geração Inteligente de SKU / Código Interno de Peças e Equipamentos
 * Padrão Syngeti: [3 Primeiras Letras do Produto] - [Sigla do Tipo de Item (2 ou 3 letras)] - [Sequência Numérica (0001)]
 * Exemplos:
 *  - Sensor fim de curso / Peça Reposicao => SEN-PR-0001
 *  - Placa de Video / Consumivel de TI => PLA-CTI-0002
 *  - Impressora Sublimatica / Equipamento/Maquina => IMP-EM-0003
 */

export interface ItemTypeOption {
  id: string;
  name: string;
  acronym: string;
  isCustom?: boolean;
}

export const DEFAULT_ITEM_TYPES: ItemTypeOption[] = [
  { id: "PART", name: "Peça de Reposição", acronym: "PR" },
  { id: "CONSUMABLE", name: "Consumível de TI", acronym: "CTI" },
  { id: "EQUIPMENT", name: "Equipamento / Máquina", acronym: "EM" },
  { id: "SUPPLY", name: "Insumo Industrial (DTF)", acronym: "II" },
  { id: "PERIPHERAL", name: "Periférico", acronym: "PER" },
  { id: "CABLE", name: "Cabo e Adaptador", acronym: "CA" },
];

/**
 * Extrai as 3 primeiras letras alfanuméricas do nome do produto, sem acentos e em maiúsculas
 */
export function extractProductPrefix(name: string): string {
  if (!name || !name.trim()) return "PRD";
  
  // Normaliza e remove acentos
  const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  // Remove tudo que não for letra ou número
  const letters = clean.replace(/[^A-Z0-9]/g, "");
  
  if (letters.length >= 3) {
    return letters.substring(0, 3);
  }
  // Se tiver menos de 3 letras, preenche com X
  return (letters + "XXX").substring(0, 3);
}

/**
 * Extrai ou localiza a sigla (2 ou 3 letras) do tipo de item
 */
export function extractTypeAcronym(typeId: string, customTypeName?: string, customAcronym?: string): string {
  if (customAcronym && customAcronym.trim()) {
    return customAcronym.trim().toUpperCase().slice(0, 4);
  }

  // Verifica se é um dos tipos padrão conhecidos
  const matchedDefault = DEFAULT_ITEM_TYPES.find(
    (t) => t.id.toUpperCase() === (typeId || "").toUpperCase()
  );
  if (matchedDefault) {
    return matchedDefault.acronym;
  }

  const rawText = (customTypeName || typeId || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  
  // Mapeamentos diretos por convenção
  if (rawText.includes("PECA") || rawText.includes("REPOSICAO")) return "PR";
  if (rawText.includes("CONSUMIVEL")) return "CTI";
  if (rawText.includes("EQUIPAMENTO") || rawText.includes("MAQUINA")) return "EM";
  if (rawText.includes("INSUMO") || rawText.includes("DTF")) return "II";
  if (rawText.includes("PERIFERICO")) return "PER";
  if (rawText.includes("CABO")) return "CA";

  // Se forem múltiplas palavras, pega as iniciais descartando preposições comuns
  const words = rawText.split(/[\s\/\-_]+/).filter(w => !["DE", "DO", "DA", "E", "EM", "PARA", "COM", "A", "O"].includes(w));
  if (words.length >= 2) {
    const initials = words.slice(0, 3).map(w => w[0]).join("");
    if (initials.length >= 2) return initials;
  }

  // Se for palavra única, pega as primeiras 2 ou 3 letras
  const lettersOnly = rawText.replace(/[^A-Z0-9]/g, "");
  if (lettersOnly.length >= 3) return lettersOnly.substring(0, 3);
  if (lettersOnly.length === 2) return lettersOnly;

  return "ITM";
}

/**
 * Formata o número da sequência com 4 dígitos (0001, 0002, ...)
 */
export function formatSequence(seq: number): string {
  const safeNum = Math.max(1, isNaN(seq) ? 1 : seq);
  return String(safeNum).padStart(4, "0");
}

/**
 * Gera o SKU completo no padrão inteligente
 */
export function generateSmartSku(
  name: string,
  typeId: string,
  sequence: number,
  customTypeName?: string,
  customAcronym?: string
): string {
  const prefix = extractProductPrefix(name);
  const acronym = extractTypeAcronym(typeId, customTypeName, customAcronym);
  const seqStr = formatSequence(sequence);
  return `${prefix}-${acronym}-${seqStr}`;
}
