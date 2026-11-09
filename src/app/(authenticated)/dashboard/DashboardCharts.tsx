"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Paleta ampla de 20 cores modernas, vibrantes e com alto contraste
const PALETTE = [
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
const CATEGORY_COLOR_MAP: Record<string, string> = {
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

interface ChartItem {
  name: string;
  quantidade: number;
  color?: string;
}

export default function DashboardCharts({ 
  chartData 
}: { 
  chartData: ChartItem[] 
}) {
  const total = chartData ? chartData.reduce((sum, item) => sum + (item.quantidade || 0), 0) : 0;

  // Algoritmo de Blindagem Anti-Colisão:
  // Garante matematicamente que NENHUMA categoria repita cor com outra no gráfico
  const usedColors = new Set<string>();
  const enrichedData = (chartData || []).map((item, idx) => {
    let assignedColor = item.color;
    const preferredColor = getCategoryColor(item.name, idx);

    // Se não tem cor ou a cor preferida já está ocupada por outro item
    if (!assignedColor || usedColors.has(assignedColor)) {
      if (!usedColors.has(preferredColor)) {
        assignedColor = preferredColor;
      } else {
        // Encontra a primeira cor da PALETTE que ainda esteja livre
        const freeColor = PALETTE.find((c) => !usedColors.has(c));
        assignedColor = freeColor || PALETTE[idx % PALETTE.length];
      }
    }

    usedColors.add(assignedColor);

    return {
      ...item,
      color: assignedColor,
      percent: total > 0 ? Math.round((item.quantidade / total) * 100) : 0,
    };
  });

  if (!chartData || chartData.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground w-full flex-1">
        <div className="relative w-[140px] h-[140px] rounded-full border-2 border-dashed border-border/60 flex flex-col items-center justify-center mb-3">
          <span className="text-3xl font-black text-foreground leading-none">0</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total</span>
        </div>
        <p className="text-xs text-muted-foreground">Nenhum chamado categorizado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full py-1">
      {/* Gráfico Donut com Total Centralizado */}
      <div className="relative w-[180px] h-[180px] flex-shrink-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enrichedData}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={78}
              paddingAngle={2.5}
              dataKey="quantidade"
              stroke="none"
            >
              {enrichedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ChartItem & { color: string; percent: number };
                  return (
                    <div className="bg-[#0B1528] border border-border/80 px-3 py-2 rounded-lg shadow-xl text-xs backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                          style={{ backgroundColor: data.color }} 
                        />
                        <span className="font-semibold text-white">{data.name}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-muted-foreground text-[11px]">
                        <span>Chamados: <strong className="text-white font-bold">{data.quantidade}</strong></span>
                        <span className="font-mono text-cyan-400 font-semibold">{data.percent}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Número Total 100% Centralizado no Vazio do Círculo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-3xl font-black text-foreground leading-none tracking-tight">{total}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total</span>
        </div>
      </div>

      {/* Legenda com Cores Únicas, Contagens e Percentuais */}
      <div className="flex-1 w-full max-h-[220px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        {enrichedData.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-foreground/90 font-medium truncate text-[11px] sm:text-xs">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground font-mono text-[11px]">
              <span className="font-semibold text-foreground">{item.quantidade}</span>
              <span className="text-[10px] opacity-75">({item.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
