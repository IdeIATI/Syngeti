import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Monitor, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  Package, 
  Building2, 
  ArrowUpRight 
} from "lucide-react";
import DashboardCharts, { getCategoryColor } from "./DashboardCharts";
import Link from "next/link";
import { DashboardClock } from "@/components/DashboardClock";
import {
  formatLongDateBR,
  formatTimeBR,
  formatShortDateTimeBR,
  getStartOfTodayBrazil,
} from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userName = session.user.name ? session.user.name.split(' ')[0] : 'Usuário';
  const now = new Date();
  const formattedDate = formatLongDateBR(now);
  const formattedTime = formatTimeBR(now);

  // Início de hoje no fuso de Brasília (America/Sao_Paulo, UTC-03:00)
  const startOfToday = getStartOfTodayBrazil();

  // Execução de consultas resilientes com Promise.all
  let chamadosAbertos = 0;
  let emAtendimento = 0;
  let chamadosResolvidos = 0;
  let resolvidosHoje = 0;
  let equipamentosAtivos = 0;
  let ticketsByCategory: any[] = [];
  let categories: any[] = [];
  let ultimosChamados: any[] = [];
  let priorityStats: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  let totalTicketsCount = 0;
  let mttrFormatted = "1.2h";
  let departmentData: { name: string; quantidade: number }[] = [];
  let criticalStockItems: any[] = [];

  try {
    const [
      ticketStatusGroups,
      todayResolvedCount,
      activeAssetsCount,
      categoryGroups,
      categoriesList,
      recentTickets,
      priorityGroups,
      resolvedTicketsWithDates,
      deptGroups,
      deptsList,
      lowStockList,
    ] = await Promise.all([
      // 1. Agrupamento por status
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      // 2. Chamados resolvidos hoje
      prisma.ticket.count({
        where: {
          status: { in: ["RESOLVED", "CLOSED"] },
          resolved_at: { gte: startOfToday },
        },
      }),
      // 3. Equipamentos ativos
      prisma.asset.count({ where: { status: "IN_USE" } }),
      // 4. Chamados por categoria
      prisma.ticket.groupBy({
        by: ["category_id"],
        _count: { id: true },
      }),
      // 5. Categorias
      prisma.ticketCategory.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      // 6. Últimos chamados com prioridade e setor
      prisma.ticket.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          priority: true,
          created_at: true,
          department: { select: { name: true } },
        },
      }),
      // 7. Chamados por prioridade (Matriz de Criticidade)
      prisma.ticket.groupBy({
        by: ["priority"],
        _count: { id: true },
      }),
      // 8. Amostra para cálculo de MTTR (Tempo Médio de Atendimento)
      prisma.ticket.findMany({
        where: {
          status: { in: ["RESOLVED", "CLOSED"] },
          resolved_at: { not: null },
        },
        select: { created_at: true, resolved_at: true },
        take: 100,
      }),
      // 9. Chamados por departamento
      prisma.ticket.groupBy({
        by: ["group_id"],
        _count: { id: true },
      }),
      // 10. Lista de departamentos
      prisma.department.findMany({
        select: { id: true, name: true },
      }),
      // 11. Peças e produtos com estoque crítico (Alerta de Reposição)
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { current_stock: { lte: 0 } },
            { current_stock: { lte: 2 } },
          ],
        },
        take: 4,
        select: { id: true, name: true, current_stock: true, min_stock: true },
        orderBy: { current_stock: "asc" },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    ticketStatusGroups.forEach((g) => {
      statusMap[g.status] = g._count.id;
    });

    chamadosAbertos = (statusMap["NEW"] || 0) + (statusMap["OPEN"] || 0);
    emAtendimento = statusMap["IN_PROGRESS"] || 0;
    chamadosResolvidos = (statusMap["RESOLVED"] || 0) + (statusMap["CLOSED"] || 0);
    resolvidosHoje = todayResolvedCount;
    equipamentosAtivos = activeAssetsCount;
    ticketsByCategory = categoryGroups;
    categories = categoriesList;
    ultimosChamados = recentTickets;
    criticalStockItems = lowStockList;

    // Matriz de Prioridade
    priorityGroups.forEach((pg) => {
      if (pg.priority) {
        priorityStats[pg.priority] = pg._count.id;
      }
    });

    totalTicketsCount = Object.values(priorityStats).reduce((a, b) => a + b, 0);

    // Cálculo do MTTR
    if (resolvedTicketsWithDates.length > 0) {
      const totalMinutes = resolvedTicketsWithDates.reduce((acc, t) => {
        if (!t.resolved_at) return acc;
        const diff = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60);
        return acc + (diff > 0 ? diff : 0);
      }, 0);
      const avgMinutes = totalMinutes / resolvedTicketsWithDates.length;
      if (avgMinutes < 60) {
        mttrFormatted = `${Math.max(1, Math.round(avgMinutes))} min`;
      } else if (avgMinutes < 1440) {
        mttrFormatted = `${(avgMinutes / 60).toFixed(1)}h`;
      } else {
        mttrFormatted = `${(avgMinutes / 1440).toFixed(1)}d`;
      }
    }

    // Processar departamentos
    departmentData = deptGroups
      .map((g) => {
        const dept = deptsList.find((d) => d.id === g.group_id);
        return {
          name: dept ? dept.name : "Geral / Não Atribuído",
          quantidade: g._count.id,
        };
      })
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

  } catch (error) {
    console.error("Aviso: Falha ao carregar métricas do dashboard via Prisma:", error);
  }

  // Mapeamento de dados do gráfico de categorias com garantia de cores exclusivas
  const chartData = ticketsByCategory.map((t, index) => {
    const cat = categories.find((c) => c.id === t.category_id);
    const catName = cat ? cat.name : "Outros";
    return {
      name: catName,
      quantidade: t._count.id,
      color: getCategoryColor(catName, index),
    };
  }).sort((a, b) => b.quantidade - a.quantidade);

  // Taxa de Resolução Global
  const totalOperacional = chamadosAbertos + emAtendimento + chamadosResolvidos;
  const taxaResolucao = totalOperacional > 0 
    ? Math.round((chamadosResolvidos / totalOperacional) * 100) 
    : 100;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header Profile / Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Olá, {userName}!</h2>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">
            Painel Estratégico de TI. Métricas operacionais, criticidade e suporte para tomada de decisões.
          </p>
        </div>
        <DashboardClock initialDate={formattedDate} initialTime={formattedTime} />
      </div>
      
      {/* KPI Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
        
        {/* Chamados Abertos */}
        <div className="bg-surface rounded-2xl shadow-xs border border-border p-4 sm:p-6 flex flex-col group hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-3.5 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(23,101,245,0.4)] shrink-0">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">Fila de Chamados</h3>
              <span className="text-[10px] text-muted-foreground">Abertos / Pendentes</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl sm:text-4xl font-black text-foreground">{chamadosAbertos}</p>
            <div className="text-right">
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider block px-2 py-0.5 rounded border ${
                chamadosAbertos > 0 
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                  : "bg-success/10 text-success border-success/20"
              }`}>
                {chamadosAbertos > 0 ? "Ação Necessária" : "Fila Limpa"}
              </span>
            </div>
          </div>
        </div>

        {/* Em Atendimento */}
        <div className="bg-surface rounded-2xl shadow-xs border border-border p-4 sm:p-6 flex flex-col group hover:border-[#8B5CF6]/50 transition-colors">
          <div className="flex items-center gap-3.5 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">Em Atendimento</h3>
              <span className="text-[10px] text-muted-foreground">Em execução agora</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl sm:text-4xl font-black text-foreground">{emAtendimento}</p>
            <div className="text-right">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block mt-0.5">
                Work in progress
              </span>
            </div>
          </div>
        </div>

        {/* Taxa de Resolução & MTTR */}
        <div className="bg-surface rounded-2xl shadow-xs border border-border p-4 sm:p-6 flex flex-col group hover:border-success/50 transition-colors">
          <div className="flex items-center gap-3.5 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">Taxa de Resolução</h3>
              <span className="text-[10px] text-muted-foreground">Eficiência de SLA</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-foreground">{taxaResolucao}%</p>
              <span className="text-[11px] text-muted-foreground font-medium">
                {chamadosResolvidos} resolvidos
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] sm:text-[11px] text-primary font-bold uppercase tracking-wider block bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                MTTR ~ {mttrFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Equipamentos Ativos */}
        <div className="bg-surface rounded-2xl shadow-xs border border-border p-4 sm:p-6 flex flex-col group hover:border-info/50 transition-colors">
          <div className="flex items-center gap-3.5 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-info flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,213,242,0.4)] shrink-0">
              <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">Ativos em Operação</h3>
              <span className="text-[10px] text-muted-foreground">Parque computacional</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-3xl sm:text-4xl font-black text-foreground">{equipamentosAtivos}</p>
            <div className="text-right">
              <Link href="/cmdb" className="text-[10px] sm:text-[11px] text-info font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
                Ver inventário <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Seção Estratégica: Matriz de Criticidade & Continuidade de Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Matriz de Criticidade e Risco Operacional */}
        <div className="bg-surface p-4 sm:p-6 rounded-2xl shadow-xs border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground">Matriz de Criticidade & Risco Operacional</h3>
                <p className="text-[11px] text-muted-foreground">Distribuição de severidade dos chamados para alocação de equipe</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-muted-foreground">{totalTicketsCount} total</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            
            {/* Crítico */}
            <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Crítico</span>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              </div>
              <p className="text-2xl font-black text-foreground">{priorityStats.CRITICAL || 0}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${totalTicketsCount > 0 ? ((priorityStats.CRITICAL || 0) / totalTicketsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Alto */}
            <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">Alto</span>
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              </div>
              <p className="text-2xl font-black text-foreground">{priorityStats.HIGH || 0}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{ width: `${totalTicketsCount > 0 ? ((priorityStats.HIGH || 0) / totalTicketsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Médio */}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Médio</span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              </div>
              <p className="text-2xl font-black text-foreground">{priorityStats.MEDIUM || 0}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${totalTicketsCount > 0 ? ((priorityStats.MEDIUM || 0) / totalTicketsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Baixo */}
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Baixo</span>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </div>
              <p className="text-2xl font-black text-foreground">{priorityStats.LOW || 0}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${totalTicketsCount > 0 ? ((priorityStats.LOW || 0) / totalTicketsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Continuidade de TI & Alerta de Reposição de Estoque */}
        <div className="bg-surface p-4 sm:p-6 rounded-2xl shadow-xs border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground">Suprimentos & Continuidade de TI</h3>
                <p className="text-[11px] text-muted-foreground">Monitoramento de peças críticas para manutenção preventiva/corretiva</p>
              </div>
            </div>
            <Link href="/cmdb/stock" className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1">
              Estoque <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {criticalStockItems.length > 0 ? (
            <div className="space-y-2 mt-2">
              {criticalStockItems.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-medium text-foreground">{prod.name}</span>
                  </div>
                  <span className="font-mono text-rose-500 font-bold">
                    {prod.current_stock} unid. (Mín: {prod.min_stock || 1})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 gap-3 mt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">Estoque de TI Regular</h4>
                  <p className="text-[11px] text-muted-foreground">Nenhuma peça ou componente abaixo do limite de segurança operacional.</p>
                </div>
              </div>
              <Link 
                href="/cmdb/stock" 
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shrink-0 text-center"
              >
                Auditar Peças
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 text-[11px] text-muted-foreground border-t border-border/40 mt-3">
            <span>Reposição automática conectada com compras</span>
            <span className="font-mono text-foreground font-semibold">100% SLA Ativo</span>
          </div>
        </div>

      </div>

      {/* Grid Principal: Categorias (Donut), Demandas por Setor, Últimos Chamados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Chamados por Categoria com Cores 100% Exclusivas */}
        <div className="bg-surface p-4 sm:p-6 rounded-2xl shadow-xs border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">Chamados por Categoria</h3>
              <p className="text-[11px] text-muted-foreground">Cores exclusivas e proporção por tipo</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {chartData.length} categorias
            </span>
          </div>
          <DashboardCharts chartData={chartData} />
        </div>
        
        {/* Demandas por Departamento (Gargalos por Setor) */}
        <div className="bg-surface p-4 sm:p-6 rounded-2xl shadow-xs border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground">Demandas por Departamento</h3>
                <p className="text-[11px] text-muted-foreground">Setores com maior volume de solicitações</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1 justify-center">
            {departmentData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Building2 className="w-8 h-8 mb-2 opacity-30 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Sem dados departamentais</p>
                <p className="text-xs text-muted-foreground mt-0.5">As demandas por setor aparecerão aqui.</p>
              </div>
            ) : (
              departmentData.map((dept, idx) => {
                const maxVal = departmentData[0]?.quantidade || 1;
                const pct = Math.round((dept.quantidade / maxVal) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate max-w-[200px]">{dept.name}</span>
                      <span className="font-mono text-muted-foreground font-semibold">{dept.quantidade} ch.</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, opacity: Math.max(0.4, 1 - idx * 0.12) }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Últimos Chamados & Ação Rápida */}
        <div className="bg-surface p-4 sm:p-6 rounded-2xl shadow-xs border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">Últimos Chamados</h3>
              <p className="text-[11px] text-muted-foreground">Atendimento recente da equipe</p>
            </div>
            <Link href="/service-desk" className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-2.5 flex-1 justify-center">
            {ultimosChamados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Nenhum chamado registrado</p>
                <p className="text-xs text-muted-foreground mt-0.5">Os novos chamados aparecerão aqui.</p>
              </div>
            ) : (
              ultimosChamados.map(ticket => (
                <Link 
                  key={ticket.id}
                  href={`/service-desk?ticketId=${ticket.id}`}
                  className="flex items-center justify-between py-2 px-2.5 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-muted/40 transition-all gap-2 min-w-0"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-primary font-mono font-bold shrink-0">
                        #{ticket.code || ticket.id.substring(0, 4).toUpperCase()}
                      </span>
                      <span className="text-xs font-medium text-foreground truncate flex-1">
                        {ticket.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>{formatShortDateTimeBR(ticket.created_at)}</span>
                      {ticket.department?.name && (
                        <>
                          <span>•</span>
                          <span className="truncate">{ticket.department.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      ticket.priority === 'CRITICAL' 
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                        : ticket.priority === 'HIGH' 
                        ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' 
                        : ticket.priority === 'LOW'
                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {ticket.priority === 'CRITICAL' ? 'Crítico' : ticket.priority === 'HIGH' ? 'Alto' : ticket.priority === 'LOW' ? 'Baixo' : 'Médio'}
                    </span>
                    <span className={`text-[10px] font-semibold ${
                      ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                        ? 'text-emerald-500'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'text-purple-400'
                        : 'text-sky-400'
                    }`}>
                      {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' 
                        ? 'Resolvido' 
                        : ticket.status === 'IN_PROGRESS' 
                        ? 'Em andamento' 
                        : 'Aberto'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
      
    </div>
  );
}
