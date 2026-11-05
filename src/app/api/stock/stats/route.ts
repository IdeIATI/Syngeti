import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCurrentUser } from "@/lib/currentUser";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const currentUser = await resolveCurrentUser(session);
    if (!currentUser?.company_id) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      activeProducts,
      movementsThisMonth,
      products,
      categoriesCount
    ] = await Promise.all([
      prisma.product.count({ where: { company_id: currentUser.company_id } }),
      prisma.product.count({ where: { company_id: currentUser.company_id, status: "ACTIVE" } }),
      prisma.stockMovement.count({
        where: {
          company_id: currentUser.company_id,
          movement_date: { gte: firstDayOfMonth }
        }
      }),
      prisma.product.findMany({
        where: { company_id: currentUser.company_id, status: "ACTIVE" },
        select: {
          id: true,
          current_stock: true,
          min_stock: true,
          reorder_point: true,
          avg_cost: true,
          last_cost: true,
        }
      }),
      prisma.productCategory.count({ where: { company_id: currentUser.company_id } })
    ]);

    let criticalStock = 0; // zerados
    let lowStock = 0;      // <= min_stock
    let reorderStock = 0;  // <= reorder_point
    let totalStockValue = 0;
    let totalPieces = 0;

    for (const p of products) {
      const qty = p.current_stock;
      totalPieces += Math.max(0, qty);
      const unitVal = p.avg_cost > 0 ? p.avg_cost : (p.last_cost > 0 ? p.last_cost : 0);
      totalStockValue += Math.max(0, qty) * unitVal;

      if (qty <= 0) {
        criticalStock++;
      } else if (qty <= p.min_stock) {
        lowStock++;
      } else if (qty <= p.reorder_point) {
        reorderStock++;
      }
    }

    return NextResponse.json({
      totalProducts,
      activeProducts,
      criticalStock,
      lowStock,
      reorderStock,
      needsReplenishment: criticalStock + lowStock + reorderStock,
      totalStockValue,
      totalPieces,
      movementsThisMonth,
      categoriesCount
    });
  } catch (error: any) {
    console.error("GET /api/stock/stats error:", error);
    return NextResponse.json({ error: "Erro ao carregar estatísticas do estoque" }, { status: 500 });
  }
}
