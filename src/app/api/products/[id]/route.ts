import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCurrentUser } from "@/lib/currentUser";
import { NextResponse } from "next/server";
import { invalidateProductsCache } from "@/app/api/products/route";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const currentUser = await resolveCurrentUser(session);
    if (!currentUser?.company_id) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    const product = await prisma.product.findFirst({
      where: {
        id,
        company_id: currentUser.company_id,
      },
      include: {
        category: true,
        suppliers: {
          include: {
            supplier: true,
            price_history: {
              orderBy: { recorded_at: "desc" },
              take: 5
            }
          },
          orderBy: { is_preferred: "desc" }
        },
        movements: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            supplier: { select: { id: true, name: true, trade_name: true } },
            asset: { select: { id: true, name: true, asset_tag: true } }
          },
          orderBy: { movement_date: "desc" },
          take: 20
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json({ error: "Erro ao buscar detalhes do produto" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const currentUser = await resolveCurrentUser(session);
    if (!currentUser?.company_id) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    const product = await prisma.product.findFirst({
      where: {
        id,
        company_id: currentUser.company_id,
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const body = await req.json();

    // Validação de SKU caso tenha sido alterado
    if (body.sku && body.sku.trim() !== product.sku) {
      const existingSku = await prisma.product.findFirst({
        where: {
          sku: { equals: body.sku.trim(), mode: "insensitive" },
          id: { not: product.id }
        }
      });
      if (existingSku) {
        return NextResponse.json({ error: `O SKU '${body.sku.trim()}' já pertence a outro produto.` }, { status: 409 });
      }
    }

    // Validação de part_number em duplicidade caso alterado
    if (body.part_number && body.part_number.trim() && body.part_number.trim() !== product.part_number) {
      const existingPn = await prisma.product.findFirst({
        where: {
          company_id: currentUser.company_id,
          part_number: { equals: body.part_number.trim(), mode: "insensitive" },
          id: { not: product.id }
        }
      });
      if (existingPn) {
        return NextResponse.json({
          error: `O Part Number '${body.part_number.trim()}' já está cadastrado no produto '${existingPn.name}'.`
        }, { status: 409 });
      }
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        name: body.name?.trim() || product.name,
        sku: body.sku?.trim() || product.sku,
        description: body.description !== undefined ? body.description?.trim() : product.description,
        category_id: body.category_id || product.category_id,
        brand: body.brand !== undefined ? body.brand?.trim() : product.brand,
        model: body.model !== undefined ? body.model?.trim() : product.model,
        part_number: body.part_number !== undefined ? body.part_number?.trim() || null : product.part_number,
        unit: body.unit ? body.unit.toUpperCase() : product.unit,
        type: body.type || product.type,
        compatibility: body.compatibility !== undefined ? body.compatibility?.trim() : product.compatibility,
        location: body.location !== undefined ? body.location?.trim() : product.location,
        min_stock: body.min_stock !== undefined ? Number(body.min_stock) : product.min_stock,
        reorder_point: body.reorder_point !== undefined ? Number(body.reorder_point) : product.reorder_point,
        photo_url: body.photo_url !== undefined ? body.photo_url : product.photo_url,
        notes: body.notes !== undefined ? body.notes?.trim() : product.notes,
        status: body.status || product.status,
      },
      include: {
        category: true,
        suppliers: {
          include: { supplier: true }
        }
      }
    });

    // Se fornecedor foi indicado na edição, vincula caso ainda não esteja associado
    if (body.supplier_id) {
      const existingLink = await prisma.productSupplier.findFirst({
        where: { product_id: product.id, supplier_id: body.supplier_id }
      });
      if (!existingLink) {
        await prisma.productSupplier.create({
          data: {
            product_id: product.id,
            supplier_id: body.supplier_id,
            is_preferred: true,
            last_price: Number(body.last_cost) || 0,
            company_id: currentUser.company_id,
          }
        });
      }
    }

    invalidateProductsCache();
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const currentUser = await resolveCurrentUser(session);
    if (!currentUser?.company_id) {
      return NextResponse.json({ error: "Empresa não identificada" }, { status: 400 });
    }

    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    const product = await prisma.product.findFirst({
      where: {
        id,
        company_id: currentUser.company_id,
      },
      include: {
        _count: {
          select: { movements: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    invalidateProductsCache();
    // Se o produto já possui movimentações registradas, NUNCA deletar fisicamente. Apenas inativar.
    if (product._count.movements > 0) {
      const inactivated = await prisma.product.update({
        where: { id: product.id },
        data: { status: "INACTIVE" }
      });
      return NextResponse.json({
        message: "O produto possui histórico de movimentações e foi inativado no sistema para preservar a integridade contábil.",
        product: inactivated,
        wasInactivated: true
      });
    }

    // Se não tiver movimentações, pode excluir fisicamente
    await prisma.product.delete({
      where: { id: product.id }
    });

    return NextResponse.json({
      message: "Produto excluído com sucesso.",
      deletedId: product.id,
      wasInactivated: false
    });
  } catch (error: any) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Erro ao processar exclusão/inativação do produto" }, { status: 500 });
  }
}
