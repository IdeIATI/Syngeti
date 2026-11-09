import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCurrentUser } from "@/lib/currentUser";
import { NextResponse } from "next/server";
import { invalidateProductsCache } from "@/app/api/products/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const currentUser = await resolveCurrentUser(session);
    if (!currentUser?.company_id) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const product_id = searchParams.get("product_id");
    const type = searchParams.get("type");
    const q = searchParams.get("q")?.trim() || "";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    const where: any = {
      company_id: currentUser.company_id,
    };

    if (product_id && product_id !== "ALL") {
      where.product_id = product_id;
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { document_ref: { contains: q, mode: "insensitive" } },
        { destination: { contains: q, mode: "insensitive" } },
        { reason: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { product: { sku: { contains: q, mode: "insensitive" } } },
        { product: { part_number: { contains: q, mode: "insensitive" } } },
      ];
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unit: true,
            part_number: true,
            category: { select: { id: true, name: true } }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        },
        supplier: {
          select: { id: true, name: true, trade_name: true }
        },
        asset: {
          select: { id: true, name: true, asset_tag: true }
        }
      },
      orderBy: { movement_date: "desc" },
      take: limit
    });

    return NextResponse.json(movements);
  } catch (error: any) {
    console.error("GET /api/stock/movements error:", error);
    return NextResponse.json({ error: "Erro ao listar movimentações de estoque" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const currentUser = await resolveCurrentUser(session);
    if (!currentUser?.company_id) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const body = await req.json();
    const product_id = body.product_id;
    const type = body.type; // IN_PURCHASE, OUT_CONSUMPTION, OUT_MAINTENANCE, ADJUSTMENT, RETURN
    const rawQuantity = Number(body.quantity);
    const unit_cost = body.unit_cost !== undefined && body.unit_cost !== null && body.unit_cost !== "" ? Number(body.unit_cost) : null;
    const supplier_id = body.supplier_id || null;
    const document_ref = body.document_ref?.trim() || null;
    const destination = body.destination?.trim() || null;
    const asset_id = body.asset_id || null;
    const ticket_id = body.ticket_id || null;
    const reason = body.reason?.trim() || null;

    if (!product_id) {
      return NextResponse.json({ error: "O produto é obrigatório." }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: "O tipo de movimentação é obrigatório." }, { status: 400 });
    }

    // Justificativa obrigatória para ajustes de inventário
    if (type === "ADJUSTMENT" && !reason) {
      return NextResponse.json({ error: "A justificativa/motivo é obrigatória para ajustes de estoque." }, { status: 400 });
    }

    // Executa a transação atômica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obter produto com lock lógico
      const product = await tx.product.findFirst({
        where: {
          id: product_id,
          company_id: currentUser.company_id
        }
      });

      if (!product) {
        throw new Error("Produto não encontrado.");
      }

      if (product.status === "INACTIVE") {
        throw new Error("Não é possível movimentar um produto inativo. Reative o produto antes.");
      }

      const currentStock = product.current_stock;
      let balance_after = currentStock;
      let effectiveQuantity = rawQuantity;

      if (type === "IN_PURCHASE" || type === "RETURN") {
        if (effectiveQuantity <= 0) {
          throw new Error("A quantidade de entrada deve ser maior que zero.");
        }
        balance_after = currentStock + effectiveQuantity;
      } else if (type === "OUT_CONSUMPTION" || type === "OUT_MAINTENANCE") {
        if (effectiveQuantity <= 0) {
          throw new Error("A quantidade de saída deve ser maior que zero.");
        }
        balance_after = currentStock - effectiveQuantity;

        // REGRA DE OURO: NUNCA PERMITIR SALDO NEGATIVO
        if (balance_after < 0) {
          throw new Error(
            `Operação bloqueada: Saldo insuficiente. Saldo atual: ${currentStock} ${product.unit}, Tentativa de saída: ${effectiveQuantity} ${product.unit}. O sistema não permite saldo negativo.`
          );
        }
      } else if (type === "ADJUSTMENT") {
        const adjustmentMode = body.adjustment_mode || "SET_BALANCE"; // "SET_BALANCE" | "ADD" | "SUB"
        if (adjustmentMode === "SET_BALANCE") {
          const targetBalance = Number(body.target_balance);
          if (isNaN(targetBalance) || targetBalance < 0) {
            throw new Error("O saldo final após ajuste não pode ser negativo.");
          }
          effectiveQuantity = Math.abs(targetBalance - currentStock);
          balance_after = targetBalance;
        } else if (adjustmentMode === "SUB") {
          if (effectiveQuantity <= 0) throw new Error("A quantidade de ajuste deve ser maior que zero.");
          balance_after = currentStock - effectiveQuantity;
          if (balance_after < 0) {
            throw new Error(`Operação bloqueada: Ajuste deixaria saldo negativo (${balance_after} ${product.unit}).`);
          }
        } else {
          // ADD
          if (effectiveQuantity <= 0) throw new Error("A quantidade de ajuste deve ser maior que zero.");
          balance_after = currentStock + effectiveQuantity;
        }
      } else {
        throw new Error(`Tipo de movimentação inválido: ${type}`);
      }

      // 2. Gerar código único de movimentação
      const year = new Date().getFullYear();
      const countThisYear = await tx.stockMovement.count({
        where: {
          company_id: currentUser.company_id,
          code: { startsWith: `MOV-${year}-` }
        }
      });
      const code = `MOV-${year}-${String(countThisYear + 1).padStart(5, "0")}`;

      // 3. Custos e Médias
      const total_cost = unit_cost !== null && unit_cost !== undefined ? unit_cost * effectiveQuantity : null;

      let newAvgCost = product.avg_cost;
      let newLastCost = product.last_cost;

      if (unit_cost !== null && unit_cost > 0) {
        newLastCost = unit_cost;
        if (type === "IN_PURCHASE") {
          const oldStock = Math.max(0, currentStock);
          const totalExistingValue = oldStock * (product.avg_cost || unit_cost);
          const totalNewValue = effectiveQuantity * unit_cost;
          const totalQty = oldStock + effectiveQuantity;
          newAvgCost = totalQty > 0 ? (totalExistingValue + totalNewValue) / totalQty : unit_cost;
        }
      }

      // 4. Grava a movimentação
      const movement = await tx.stockMovement.create({
        data: {
          code,
          product_id: product.id,
          type,
          quantity: effectiveQuantity,
          balance_after,
          unit_cost,
          total_cost,
          movement_date: body.movement_date ? new Date(body.movement_date) : new Date(),
          supplier_id,
          document_ref,
          destination,
          asset_id,
          ticket_id,
          reason,
          user_id: currentUser.id,
          company_id: currentUser.company_id
        },
        include: {
          product: true,
          supplier: true,
          asset: true,
          user: { select: { id: true, name: true, email: true } }
        }
      });

      // 5. Atualiza o saldo e custos do produto
      await tx.product.update({
        where: { id: product.id },
        data: {
          current_stock: balance_after,
          avg_cost: newAvgCost,
          last_cost: newLastCost
        }
      });

      // 6. Se tiver fornecedor e custo, atualiza cotação / histórico no ProductSupplier
      if (supplier_id && unit_cost && unit_cost > 0) {
        let prodSupp = await tx.productSupplier.findUnique({
          where: {
            product_id_supplier_id: {
              product_id: product.id,
              supplier_id
            }
          }
        });

        if (!prodSupp) {
          prodSupp = await tx.productSupplier.create({
            data: {
              product_id: product.id,
              supplier_id,
              last_price: unit_cost,
              company_id: currentUser.company_id
            }
          });
        } else {
          await tx.productSupplier.update({
            where: { id: prodSupp.id },
            data: {
              last_price: unit_cost,
              price_updated_at: new Date()
            }
          });
        }

        // Registrar no histórico de preços
        await tx.supplierPriceHistory.create({
          data: {
            product_supplier_id: prodSupp.id,
            price: unit_cost,
            document_ref: document_ref || code,
            registered_by_id: currentUser.id
          }
        });
      }

      return movement;
    });

    invalidateProductsCache();
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/stock/movements error:", error);
    return NextResponse.json({ error: error.message || "Erro ao registrar movimentação de estoque" }, { status: 400 });
  }
}
