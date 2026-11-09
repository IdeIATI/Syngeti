// Paleta ampla de 20 cores modernas, vibrantes e com alto contraste
export const PALETTE = [
  '#06B6D4', // Ciano Vibrante (Rede e Conectividade)
  '#F97316', // Laranja Intenso (Hardware)
  '#8B5CF6', // Roxo / Violeta (Software)
  '#EAB308', // Âmbar Dourado (Realocação)
  '#0D9488', // Teal / Verde-azulado (Acessos e Permissões)
  '#EC4899', // Rosa Pink (Impressora)
  '#64748B', // Slate / Cinza Neutro (Outros)
  '#2563EB', // Azul Royal (Acesso a Software)
  '#10B981', // Verde Esmeralda
  '#F43F5E', // Carmim / Rose
  '#3B82F6', // Azul Claro
  '#A855F7', // Púrpura
  '#84CC16', // Lima
  '#0EA5E9', // Sky Blue
  '#D946EF', // Fuchsia
  '#6366F1', // Indigo
  '#FB923C', // Tangerina
  '#2DD4BF', // Menta
  '#FBBF24', // Mostarda
  '#94A3B8', // Slate Light
];

// Mapeamento semântico exclusivo por categoria (todas com cores 100% distintas)
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  "rede e conectividade": "#06B6D4", // 🌐 Ciano Vibrante
  "hardware": "#F97316",             // 🟠 Laranja Intenso
  "software": "#8B5CF6",             // 🟣 Roxo / Violeta
  "realocação": "#EAB308",           // 🟡 Âmbar Dourado
  "realocacao": "#EAB308",           // 🟡 Âmbar Dourado (sem acento)
  "acessos e permissões": "#0D9488", // 🟢 Teal / Verde-azulado
  "acessos e permissoes": "#0D9488", // 🟢 Teal (sem acento)
  "impressora": "#EC4899",           // 🌸 Rosa Pink (diferente de Rede!)
  "outros": "#64748B",               // ⚪ Cinza Grafite / Slate (diferente de Hardware!)
  "acesso a software": "#2563EB",    // 🔵 Azul Royal (diferente de Software!)
  "telefonia": "#10B981",            // 🌿 Verde Esmeralda
  "infraestrutura": "#6366F1",       // 🔷 Indigo
  "segurança": "#EF4444",            // 🔴 Vermelho
  "backup": "#0EA5E9",               // 💠 Sky Blue
};

export function getCategoryColor(name: string, index: number): string {
  const normalized = (name || "").trim().toLowerCase();
  if (CATEGORY_COLOR_MAP[normalized]) {
    return CATEGORY_COLOR_MAP[normalized];
  }
  return PALETTE[index % PALETTE.length];
}
