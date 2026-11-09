import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCurrentUser } from "@/lib/currentUser";
import { NextResponse } from "next/server";
import { generateSmartSku } from "@/lib/skuGenerator";

export const dynamic = "force-dynamic";

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
    const name = searchParams.get("name") || "";
    const type = searchParams.get("type") || "PART";
    const customTypeName = searchParams.get("customTypeName") || undefined;
    const customAcronym = searchParams.get("customAcronym") || undefined;

    // Busca o total de produtos cadastrados na empresa para determinar o próximo número de sequência
    const totalCount = await prisma.product.count({
      where: { company_id: currentUser.company_id }
    });

    const nextSequence = totalCount + 1;
    const suggestedSku = generateSmartSku(name, type, nextSequence, customTypeName, customAcronym);

    return NextResponse.json({
      sequence: nextSequence,
      suggestedSku,
      prefix: suggestedSku.split("-")[0] || "PRD",
      acronym: suggestedSku.split("-")[1] || "PR",
    });
  } catch (error: any) {
    console.error("GET /api/products/next-sku error:", error);
    return NextResponse.json({ error: "Erro ao gerar próximo SKU" }, { status: 500 });
  }
}
