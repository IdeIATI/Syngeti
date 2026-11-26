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
import DashboardCharts from "./DashboardCharts";
import { getCategoryColor } from "./categoryColors";
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

  const userName = session.user?.name ? session.user.name.split(' ')[0] : 'Usuário';
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
    if (Array.isArray(ticketStatusGroups)) {
      ticketStatusGroups.forEach((g) => {
        if (g?.status) {
          statusMap[g.status] = g._count?.id || 0;
        }
      });
    }

    chamadosAbertos = (statusMap["NEW"] || 0) + (statusMap["OPEN"] || 0);
    emAtendimento = statusMap["IN_PROGRESS"] || 0;
    chamadosResolvidos = (statusMap["RESOLVED"] || 0) + (statusMap["CLOSED"] || 0);
    resolvidosHoje = typeof todayResolvedCount === 'number' ? todayResolvedCount : 0;
    equipamentosAtivos = typeof activeAssetsCount === 'number' ? activeAssetsCount : 0;
    ticketsByCategory = Array.isArray(categoryGroups) ? categoryGroups : [];
    categories = Array.isArray(categoriesList) ? categoriesList : [];
    ultimosChamados = Array.isArray(recentTickets) ? recentTickets : [];
    criticalStockItems = Array.isArray(lowStockList) ? lowStockList : [];

    // Matriz de Prioridade
    if (Array.isArray(priorityGroups)) {
      priorityGroups.forEach((pg) => {
        if (pg?.priority) {
          priorityStats[pg.priority] = pg._count?.id || 0;
        }
      });
    }

    totalTicketsCount = Object.values(priorityStats).reduce((a, b) => a + b, 0);

    // Cálculo do MTTR
    if (Array.isArray(resolvedTicketsWithDates) && resolvedTicketsWithDates.length > 0) {
      const totalMinutes = resolvedTicketsWithDates.reduce((acc, t) => {
        if (!t?.resolved_at || !t?.created_at) return acc;
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
    if (Array.isArray(deptGroups)) {
      departmentData = deptGroups
        .map((g) => {
          const dept = categoriesList ? deptsList.find((d) => d.id === g.group_id) : null;
          return {
            name: dept ? dept.name : "Geral / Não Atribuído",
            quantidade: g._count?.id || 0,
          };
        })
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
    }

  } catch (error) {
    console.error("Aviso: Falha ao carregar métricas do dashboard via Prisma:", error);
  }

  // Mapeamento de dados do gráfico de categorias com garantia de cores exclusivas
  const chartData = (ticketsByCategory || []).map((t, index) => {
    const cat = categories.find((c) => c.id === t.category_id);
    const catName = cat ? cat.name : "Outros";
    return {
      name: catName,
      quantidade: t._count?.id || 0,
      color: getCategoryColor(catName, index),
    };
  }).sort((a, b) => b.quantidade - a.quantidade);

  // Taxa de Resolução Global
  const totalOperacional = chamadosAbertos + emAtendimento + chamadosResolvidos;
  const taxaResolucao = totalOperacional > 0 
    ? Math.round((chamadosResolvidos / totalOperacional) * 100) 
    : 100;

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      
      {/* Header Profile / Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-[28px] font-bold text-foreground tracking-tight">Olá, {userName}!</h2>
          <p className="text-sm font-normal text-text-secondary mt-1">
            Painel Estratégico de TI — Métricas operacionais, criticidade e suporte para tomada de decisões.
          </p>
        </div>
        <DashboardClock initialDate={formattedDate} initialTime={formattedTime} />
      </div>
      
      {/* KPI Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Chamados Abertos */}
        <div className="syngeti-card h-full flex flex-col justify-between gap-4 hover:border-border-strong transition-colors">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: "var(--kpi-1)", color: "var(--kpi-fg)" }}
            >
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-[15px] font-semibold text-foreground truncate">Fila de Chamados</h3>
              <span className="text-xs text-muted-foreground block">Abertos / Pendentes</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <p className="font-display text-3xl sm:text-4xl font-bold text-foreground tabular-nums leading-none">{chamadosAbertos}</p>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
              chamadosAbertos > 0 
                ? "bg-warning/15 text-warning border-warning/30" 
                : "bg-success/15 text-success border-success/30"
            }`}>
              {chamadosAbertos > 0 ? "Ação Necessária" : "Fila Limpa"}
            </span>
          </div>
        </div>

        {/* Em Atendimento */}
        <div className="syngeti-card h-full flex flex-col justify-between gap-4 hover:border-border-strong transition-colors">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: "var(--kpi-2)", color: "var(--kpi-fg)" }}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-[15px] font-semibold text-foreground truncate">Em Atendimento</h3>
              <span className="text-xs text-muted-foreground block">Em execução agora</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <p className="font-display text-3xl sm:text-4xl font-bold text-foreground tabular-nums leading-none">{emAtendimento}</p>
            <span className="text-xs text-muted-foreground font-medium">
              Em andamento
            </span>
          </div>
        </div>

        {/* Taxa de Resolução & MTTR */}
        <div className="syngeti-card h-full flex flex-col justify-between gap-4 hover:border-border-strong transition-colors">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: "var(--kpi-3)", color: "var(--kpi-fg)" }}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-[15px] font-semibold text-foreground truncate">Taxa de Resolução</h3>
              <span className="text-xs text-muted-foreground block">Eficiência de SLA</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="font-display text-3xl sm:text-4xl font-bold text-foreground tabular-nums leading-none">{taxaResolucao}%</p>
              <span className="text-xs text-muted-foreground font-medium mt-1 block">
                {chamadosResolvidos} resolvidos
              </span>
            </div>
            <span className="text-xs text-primary font-semibold bg-primary-soft border border-primary/20 px-2.5 py-1 rounded-md">
              MTTR ~ {mttrFormatted}
            </span>
          </div>
        </div>

        {/* Equipamentos Ativos */}
        <div className="syngeti-card h-full flex flex-col justify-between gap-4 hover:border-border-strong transition-colors">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: "var(--kpi-4)", color: "var(--kpi-fg)" }}
            >
              <Monitor className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-[15px] font-semibold text-foreground truncate">Ativos em Operação</h3>
              <span className="text-xs text-muted-foreground block">Parque computacional</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <p className="font-display text-3xl sm:text-4xl font-bold text-foreground tabular-nums leading-none">{equipamentosAtivos}</p>
            <Link href="/cmdb" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Ver inventário <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Seção Estratégica: Matriz de Criticidade & Continuidade de Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Matriz de Criticidade e Risco Operacional */}
        <div className="syngeti-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-danger/15 text-danger border border-danger/25">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-[15px] font-semibold text-foreground">Matriz de Criticidade & Risco Operacional</h3>
                <p className="text-xs text-muted-foreground">Distribuição de severidade dos chamados para alocação de equipe</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-muted-foreground">{totalTicketsCount} total</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            
            {/* Crítico */}
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-danger uppercase tracking-wide">Crítico</span>
                <span className="w-2 h-2 rounded-full bg-danger" aria-hidden="true"></span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground tabular-nums">{priorityStats.CRITICAL || 0}</p>
              <div className="w-full bg-surface-3 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-danger h-full rounded-full transition-all"
                  style={{ width: `${totalTicketsCount > 0 ? ((priorityStats.CRITICAL || 0) / totalTicketsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Alto */}
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/25 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Alto</span>
                <span className="w-2 h-2 rounded-full bg-orange-500" aria-hidden="true"></span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground tabular-nums">{priorityStats.HIGH || 0}</p>
              <div className="w-full bg-surface-3 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full transition-all"
                  style={{ width: `${totalTicketsCount > 0 ? ((priorityStats.HIGH || 0) / totalTicketsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Médio */}
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/25 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-warning uppercase tracking-wide">Médio</span>
                <span className="w-2 h-2 rounded-full bg-warning" aria-hidden="true"></span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground tabular-nums">{priorityStats.MEDIUM || 0}</p>
              <div className="w-full bg-surface-3 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-warning h-full rounded-full transition-all"
                  style={{ width: `${totalTicketsCount > 0 ? ((priorityStats.MEDIUM || 0) / totalTicketsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Baixo */}
            <div className="p-3 rounded-xl bg-info/10 border border-info/25 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-info uppercase tracking-wide">Baixo</span>
                <span className="w-2 h-2 rounded-full bg-info" aria-hidden="true"></span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground tabular-nums">{priorityStats.LOW || 0}</p>
              <div className="w-full bg-surface-3 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-info h-full rounded-full transition-all"
                  style={{ width: `${totalTicketsCount > 0 ? ((priorityStats.LOW || 0) / totalTicketsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Continuidade de TI & Alerta de Reposição de Estoque */}
        <div className="syngeti-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary-soft text-primary border border-primary/20">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-[15px] font-semibold text-foreground">Suprimentos & Continuidade de TI</h3>
                <p className="text-xs text-muted-foreground">Monitoramento de peças críticas para manutenção preventiva/corretiva</p>
              </div>
            </div>
            <Link href="/cmdb/stock" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0">
              Estoque <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {criticalStockItems.length > 0 ? (
            <div className="space-y-2 mt-2">
              {criticalStockItems.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between p-2.5 rounded-lg bg-danger/10 border border-danger/25 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                    <span className="font-medium text-foreground truncate">{prod.name}</span>
                  </div>
                  <span className="font-mono text-danger font-semibold shrink-0 ml-2">
                    {prod.current_stock} unid. (Mín: {prod.min_stock || 1})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-success/10 border border-success/25 gap-3 mt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center text-success shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground">Estoque de TI Regular</h4>
                  <p className="text-xs text-text-secondary">Nenhuma peça ou componente abaixo do limite de segurança operacional.</p>
                </div>
              </div>
              <Link 
                href="/cmdb/stock" 
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-success text-white hover:opacity-90 transition-opacity shrink-0 text-center"
              >
                Auditar Peças
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground border-t border-border mt-3">
            <span>Reposição automática conectada com compras</span>
            <span className="font-mono text-foreground font-semibold">100% SLA Ativo</span>
          </div>
        </div>

      </div>

      {/* Grid Principal: Categorias (Donut), Demandas por Setor, Últimos Chamados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Chamados por Categoria com Cores 100% Exclusivas */}
        <div className="syngeti-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-[15px] font-semibold text-foreground">Chamados por Categoria</h3>
              <p className="text-xs text-muted-foreground">Cores exclusivas e proporção por tipo</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-surface-2 text-text-secondary border border-border">
              {chartData.length} categorias
            </span>
          </div>
          <DashboardCharts chartData={chartData} />
        </div>
        
        {/* Demandas por Departamento (Gargalos por Setor) */}
        <div className="syngeti-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <div>
                <h3 className="font-display text-[15px] font-semibold text-foreground">Demandas por Departamento</h3>
                <p className="text-xs text-muted-foreground">Setores com maior volume de solicitações</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1 justify-center">
            {departmentData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Building2 className="w-8 h-8 mb-2 opacity-40 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Sem dados departamentais</p>
                <p className="text-xs text-muted-foreground mt-0.5">As demandas por setor aparecerão aqui.</p>
              </div>
            ) : (
              departmentData.map((dept, idx) => {
                const maxVal = departmentData[0]?.quantidade || 1;
                const pct = Math.round((dept.quantidade / maxVal) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate max-w-[210px]">{dept.name}</span>
                      <span className="font-mono text-text-secondary font-semibold tabular-nums">{dept.quantidade} ch.</span>
                    </div>
                    <div className="w-full bg-surface-3 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, opacity: Math.max(0.45, 1 - idx * 0.12) }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Últimos Chamados & Ação Rápida */}
        <div className="syngeti-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-[15px] font-semibold text-foreground">Últimos Chamados</h3>
              <p className="text-xs text-muted-foreground">Atendimento recente da equipe</p>
            </div>
            <Link href="/service-desk" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-2.5 flex-1 justify-center">
            {ultimosChamados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Nenhum chamado registrado</p>
                <p className="text-xs text-muted-foreground mt-0.5">Os novos chamados aparecerão aqui.</p>
              </div>
            ) : (
              ultimosChamados.map(ticket => (
                <Link 
                  key={ticket.id}
                  href={`/service-desk?ticketId=${ticket.id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-border hover:border-border-strong hover:bg-surface-hover transition-colors gap-2 min-w-0"
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
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
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      ticket.priority === 'CRITICAL' 
                        ? 'bg-danger/10 text-danger border-danger/25' 
                        : ticket.priority === 'HIGH' 
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25' 
                        : ticket.priority === 'LOW'
                        ? 'bg-info/10 text-info border-info/25'
                        : 'bg-warning/10 text-warning border-warning/25'
                    }`}>
                      {ticket.priority === 'CRITICAL' ? 'Crítico' : ticket.priority === 'HIGH' ? 'Alto' : ticket.priority === 'LOW' ? 'Baixo' : 'Médio'}
                    </span>
                    <span className={`text-xs font-semibold ${
                      ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                        ? 'text-success'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'text-primary'
                        : 'text-info'
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
