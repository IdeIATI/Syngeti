import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCurrentUser } from "@/lib/currentUser";
import { NextResponse } from "next/server";

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

    const suppliers = await prisma.productSupplier.findMany({
      where: {
        product_id: id,
        company_id: currentUser.company_id
      },
      include: {
        supplier: true,
        price_history: {
          orderBy: { recorded_at: "desc" },
          take: 10
        }
      },
      orderBy: [
        { is_preferred: "desc" },
        { last_price: "asc" }
      ]
    });

    return NextResponse.json(suppliers);
  } catch (error: any) {
    console.error("GET /api/products/[id]/suppliers error:", error);
    return NextResponse.json({ error: "Erro ao listar fornecedores do produto" }, { status: 500 });
  }
}

export async function POST(
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

    const body = await req.json();
    const supplier_id = body.supplier_id;
    const price = Number(body.price);

    if (!supplier_id) {
      return NextResponse.json({ error: "O fornecedor é obrigatório." }, { status: 400 });
    }

    // Se marcado como preferencial, remove preferência de outros fornecedores deste produto
    if (body.is_preferred) {
      await prisma.productSupplier.updateMany({
        where: {
          product_id: id,
          company_id: currentUser.company_id
        },
        data: { is_preferred: false }
      });
    }

    let prodSupp = await prisma.productSupplier.findUnique({
      where: {
        product_id_supplier_id: {
          product_id: id,
          supplier_id
        }
      }
    });

    if (!prodSupp) {
      prodSupp = await prisma.productSupplier.create({
        data: {
          product_id: id,
          supplier_id,
          supplier_product_code: body.supplier_product_code?.trim() || null,
          last_price: !isNaN(price) && price >= 0 ? price : 0,
          lead_time_days: Number(body.lead_time_days) || null,
          min_order_qty: Number(body.min_order_qty) || 1,
          is_preferred: Boolean(body.is_preferred),
          notes: body.notes?.trim() || null,
          company_id: currentUser.company_id
        }
      });
    } else {
      prodSupp = await prisma.productSupplier.update({
        where: { id: prodSupp.id },
        data: {
          supplier_product_code: body.supplier_product_code !== undefined ? body.supplier_product_code?.trim() : prodSupp.supplier_product_code,
          last_price: !isNaN(price) && price >= 0 ? price : prodSupp.last_price,
          lead_time_days: body.lead_time_days !== undefined ? Number(body.lead_time_days) : prodSupp.lead_time_days,
          min_order_qty: body.min_order_qty !== undefined ? Number(body.min_order_qty) : prodSupp.min_order_qty,
          is_preferred: body.is_preferred !== undefined ? Boolean(body.is_preferred) : prodSupp.is_preferred,
          notes: body.notes !== undefined ? body.notes?.trim() : prodSupp.notes,
          price_updated_at: !isNaN(price) && price > 0 ? new Date() : prodSupp.price_updated_at
        }
      });
    }

    // Grava histórico de cotação se preço foi informado
    if (!isNaN(price) && price > 0) {
      await prisma.supplierPriceHistory.create({
        data: {
          product_supplier_id: prodSupp.id,
          price,
          document_ref: body.document_ref?.trim() || "COTAÇÃO REGISTRADA",
          registered_by_id: currentUser.id
        }
      });
    }

    const updated = await prisma.productSupplier.findUnique({
      where: { id: prodSupp.id },
      include: {
        supplier: true,
        price_history: {
          orderBy: { recorded_at: "desc" },
          take: 5
        }
      }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/products/[id]/suppliers error:", error);
    return NextResponse.json({ error: error.message || "Erro ao vincular fornecedor" }, { status: 500 });
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

    const resolved = await Promise.resolve(params);
    const id = resolved.id;

    const { searchParams } = new URL(req.url);
    const supplier_id = searchParams.get("supplier_id");

    if (!supplier_id) {
      return NextResponse.json({ error: "supplier_id é obrigatório" }, { status: 400 });
    }

    await prisma.productSupplier.deleteMany({
      where: {
        product_id: id,
        supplier_id
      }
    });

    return NextResponse.json({ message: "Vínculo de fornecedor removido com sucesso." });
  } catch (error: any) {
    console.error("DELETE /api/products/[id]/suppliers error:", error);
    return NextResponse.json({ error: "Erro ao desvincular fornecedor" }, { status: 500 });
  }
}
