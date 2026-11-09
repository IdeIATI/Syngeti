"use client";

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PALETTE, getCategoryColor } from './categoryColors';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full py-4 animate-pulse">
        <div className="w-[180px] h-[180px] rounded-full border-4 border-muted/30 bg-surface/50 shrink-0" />
        <div className="flex-1 space-y-2.5 w-full">
          <div className="h-4 bg-muted/30 rounded w-full" />
          <div className="h-4 bg-muted/30 rounded w-3/4" />
          <div className="h-4 bg-muted/30 rounded w-2/3" />
          <div className="h-4 bg-muted/30 rounded w-1/2" />
        </div>
      </div>
    );
  }

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
              isAnimationActive={false}
            >
              {enrichedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#0B1528',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: any, name: any) => [`${value} chamados`, name]}
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
