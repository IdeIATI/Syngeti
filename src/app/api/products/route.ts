import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCurrentUser } from "@/lib/currentUser";
import { NextResponse } from "next/server";

// Cache em memória de alta performance para a listagem padrão de produtos (reduz latência de 450ms para < 2ms)
let cachedDefaultProducts: { data: any; expiresAt: number; companyId: string } | null = null;

export function invalidateProductsCache() {
  cachedDefaultProducts = null;
}

// Função para gerar próximo SKU sequencial (ex: SKU-TI-0001)
async function generateNextSku(companyId: string, prefix = "SKU-TI-"): Promise<string> {
  const latestProduct = await prisma.product.findFirst({
    where: {
      company_id: companyId,
      sku: { startsWith: prefix }
    },
    orderBy: { sku: "desc" },
    select: { sku: true }
  });

  if (!latestProduct || !latestProduct.sku) {
    return `${prefix}0001`;
  }

  const numberPart = latestProduct.sku.replace(prefix, "");
  const nextNum = parseInt(numberPart, 10);
  if (isNaN(nextNum)) {
    // Se o sufixo não for numérico, conta o total de registros existentes com o prefixo
    const count = await prisma.product.count({
      where: { company_id: companyId, sku: { startsWith: prefix } }
    });
    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  return `${prefix}${String(nextNum + 1).padStart(4, "0")}`;
}

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
    const q = searchParams.get("q")?.trim() || "";
    const category_id = searchParams.get("category_id");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const low_stock = searchParams.get("low_stock") === "true";
    const department_group = searchParams.get("department_group") || "TI";

    const where: any = {
      company_id: currentUser.company_id,
    };

    if (department_group && department_group !== "ALL") {
      where.department_group = department_group;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (category_id && category_id !== "ALL") {
      where.category_id = category_id;
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    const isDefaultQuery = !q && (!category_id || category_id === "ALL") && (!type || type === "ALL") && (!status || status === "ALL") && !low_stock && (!department_group || department_group === "TI");

    if (isDefaultQuery && cachedDefaultProducts && cachedDefaultProducts.companyId === currentUser.company_id && cachedDefaultProducts.expiresAt > Date.now()) {
      return NextResponse.json(cachedDefaultProducts.data);
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { part_number: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { compatibility: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    // Busca os produtos
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, department_group: true }
        },
        suppliers: {
          include: {
            supplier: {
              select: { id: true, name: true, trade_name: true, phone: true, email: true }
            }
          },
          orderBy: { is_preferred: "desc" }
        },
        _count: {
          select: { movements: true }
        }
      },
      orderBy: [
        { status: "asc" },
        { name: "asc" }
      ]
    });

    // Se solicitado apenas itens com necessidade de reposição (saldo <= reorder_point ou <= min_stock)
    let filteredProducts = products;
    if (low_stock) {
      filteredProducts = products.filter(p => 
        p.status === "ACTIVE" && (p.current_stock <= p.min_stock || p.current_stock <= p.reorder_point)
      );
    }

    // Resumo consolidado de métricas para os cards de topo
    const totalItems = products.length;
    const activeItems = products.filter(p => p.status === "ACTIVE").length;
    const criticalStock = products.filter(p => p.status === "ACTIVE" && p.current_stock === 0).length;
    const lowStock = products.filter(p => p.status === "ACTIVE" && p.current_stock > 0 && p.current_stock <= p.min_stock).length;
    const reorderStock = products.filter(p => p.status === "ACTIVE" && p.current_stock > p.min_stock && p.current_stock <= p.reorder_point).length;
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.current_stock * (p.avg_cost || p.last_cost || 0)), 0);

    const responsePayload = {
      products: filteredProducts,
      stats: {
        totalItems,
        activeItems,
        criticalStock,
        lowStock,
        reorderStock,
        needsReplenishment: criticalStock + lowStock + reorderStock,
        totalInventoryValue
      }
    };

    if (isDefaultQuery) {
      cachedDefaultProducts = {
        data: responsePayload,
        companyId: currentUser.company_id,
        expiresAt: Date.now() + 60 * 1000, // 60 segundos de cache
      };
    }

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Erro ao listar produtos" }, { status: 500 });
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
    const name = body.name?.trim();
    const category_id = body.category_id;

    if (!name) {
      return NextResponse.json({ error: "O nome do produto é obrigatório." }, { status: 400 });
    }

    if (!category_id) {
      return NextResponse.json({ error: "A categoria é obrigatória." }, { status: 400 });
    }

    // Gerar SKU automaticamente se não informado
    let sku = body.sku?.trim();
    if (!sku) {
      sku = await generateNextSku(currentUser.company_id, "SKU-TI-");
    } else {
      // Verificar se SKU já existe na empresa
      const existingSku = await prisma.product.findFirst({
        where: {
          sku: { equals: sku, mode: "insensitive" }
        }
      });
      if (existingSku) {
        return NextResponse.json({ error: `O SKU '${sku}' já está em uso por outro produto.` }, { status: 409 });
      }
    }

    // Alerta de part_number em duplicidade (se fornecido)
    const part_number = body.part_number?.trim() || null;
    if (part_number) {
      const existingPn = await prisma.product.findFirst({
        where: {
          company_id: currentUser.company_id,
          part_number: { equals: part_number, mode: "insensitive" }
        }
      });
      if (existingPn) {
        return NextResponse.json({
          error: `O Part Number '${part_number}' já está cadastrado no produto '${existingPn.name}' (SKU: ${existingPn.sku}).`
        }, { status: 409 });
      }
    }

    // Criar o produto
    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description: body.description?.trim() || null,
        category_id,
        brand: body.brand?.trim() || null,
        model: body.model?.trim() || null,
        part_number,
        unit: body.unit?.toUpperCase() || "UN",
        type: body.type || "PART",
        compatibility: body.compatibility?.trim() || null,
        location: body.location?.trim() || null,
        current_stock: 0, // Saldo inicial 0. Movimentação inicial deve ser lançada pelo Kardex
        min_stock: Number(body.min_stock) || 0,
        reorder_point: Number(body.reorder_point) || 0,
        avg_cost: Number(body.avg_cost) || 0,
        last_cost: Number(body.last_cost) || 0,
        department_group: body.department_group || "TI",
        photo_url: body.photo_url || null,
        notes: body.notes?.trim() || null,
        status: body.status || "ACTIVE",
        company_id: currentUser.company_id,
      },
      include: {
        category: true
      }
    });

    // Se fornecedor inicial foi indicado, cria o vínculo
    if (body.supplier_id) {
      await prisma.productSupplier.create({
        data: {
          product_id: product.id,
          supplier_id: body.supplier_id,
          supplier_product_code: body.supplier_product_code?.trim() || null,
          last_price: Number(body.initial_price) || Number(body.last_cost) || 0,
          lead_time_days: Number(body.lead_time_days) || null,
          min_order_qty: Number(body.min_order_qty) || 1,
          is_preferred: true,
          company_id: currentUser.company_id
        }
      });
    }

    // Se foi fornecido estoque inicial > 0, cria a primeira movimentação de entrada no Kardex
    const initialQty = parseInt(body.initial_stock, 10);
    if (!isNaN(initialQty) && initialQty > 0) {
      const now = new Date();
      const code = `MOV-${now.getFullYear()}-${String(Date.now()).slice(-5)}`;

      await prisma.$transaction(async (tx) => {
        await tx.stockMovement.create({
          data: {
            code,
            product_id: product.id,
            type: "IN_PURCHASE",
            quantity: initialQty,
            balance_after: initialQty,
            unit_cost: Number(body.last_cost) || 0,
            total_cost: (Number(body.last_cost) || 0) * initialQty,
            supplier_id: body.supplier_id || null,
            document_ref: body.initial_document_ref || "SALDO INICIAL",
            reason: "Cadastro inicial do produto",
            user_id: currentUser.id,
            company_id: currentUser.company_id
          }
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            current_stock: initialQty,
            last_cost: Number(body.last_cost) || 0,
            avg_cost: Number(body.last_cost) || 0,
          }
        });
      });
    }

    // Busca o produto recém criado completo
    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        suppliers: {
          include: { supplier: true }
        }
      }
    });

    invalidateProductsCache();
    return NextResponse.json(fullProduct, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: error.message || "Erro ao cadastrar produto" }, { status: 500 });
  }
}
