import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCurrentUser } from "@/lib/currentUser";
import { NextResponse } from "next/server";

// Categorias padrão para auto-seeding na primeira chamada
const DEFAULT_CATEGORIES = [
  { name: "Sensores & Fim de Curso", description: "Sensores ópticos, mecânicos, de temperatura e de proximidade (DTF e impressoras)" },
  { name: "Cabeças de Impressão (Printheads)", description: "Cabeças Epson XP600, I3200, 4720 e similares" },
  { name: "Bombas, Motores & Válvulas", description: "Bombas peristálticas de tinta, dampers, motores de tração e eixos" },
  { name: "Tintas & Insumos DTF", description: "Pó de poliamida, filmes PET, tintas DTF CMYK+White e solventes de limpeza" },
  { name: "Placas, Fontes & Eletrônica", description: "Placas lógicas, fontes chaveadas 24V/48V, drivers de motor de passo" },
  { name: "Cabos, Flats & Conectores", description: "Cabos flat FFC para cabeças, chicotes elétricos e cabos de dados" },
  { name: "Periféricos & Peças de Computador", description: "Memórias RAM, SSDs, fontes ATX, placas de rede, mouses e teclados" },
  { name: "Ferramentas & Acessórios de Manutenção", description: "Seringas, swabs de limpeza, chaves especiais e fitas de vedação" }
];

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

    let categories = await prisma.productCategory.findMany({
      where: { company_id: currentUser.company_id },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: "asc" }
    });

    // Auto-seed se não houver nenhuma categoria cadastrada
    if (categories.length === 0) {
      for (const item of DEFAULT_CATEGORIES) {
        await prisma.productCategory.create({
          data: {
            name: item.name,
            description: item.description,
            department_group: "TI",
            company_id: currentUser.company_id
          }
        });
      }

      categories = await prisma.productCategory.findMany({
        where: { company_id: currentUser.company_id },
        include: {
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: "asc" }
      });
    }

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET /api/product-categories error:", error);
    return NextResponse.json({ error: "Erro ao listar categorias de produtos" }, { status: 500 });
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

    if (!name) {
      return NextResponse.json({ error: "Nome da categoria é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.productCategory.findFirst({
      where: {
        company_id: currentUser.company_id,
        name: { equals: name, mode: "insensitive" }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Já existe uma categoria com este nome" }, { status: 409 });
    }

    const category = await prisma.productCategory.create({
      data: {
        name,
        description: body.description?.trim() || null,
        department_group: body.department_group || "TI",
        company_id: currentUser.company_id
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/product-categories error:", error);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
