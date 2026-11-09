import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCurrentUser } from "@/lib/currentUser";

// Cache em memória de alta performance para fornecedores (reduz round-trips nas telas de compras/estoque)
let cachedSuppliers: { data: any; expiresAt: number; companyId: string } | null = null;

export function invalidateSuppliersCache() {
  cachedSuppliers = null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const user = await resolveCurrentUser(session);
    if (!user) throw new Error("Usuário não encontrado");

    if (cachedSuppliers && cachedSuppliers.companyId === user.company_id && cachedSuppliers.expiresAt > Date.now()) {
      return NextResponse.json(cachedSuppliers.data);
    }

    const suppliers = await prisma.supplier.findMany({
      where: { company_id: user.company_id },
      orderBy: { name: "asc" }
    });

    cachedSuppliers = {
      data: suppliers,
      companyId: user.company_id,
      expiresAt: Date.now() + 60 * 1000,
    };

    return NextResponse.json(suppliers);
  } catch (err: any) {
    console.error("GET /api/suppliers error:", err);
    return new NextResponse(err.message, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    
    const user = await resolveCurrentUser(session);
    if (!user) throw new Error("Usuário não encontrado");

    const dataToSave = { ...body };
    dataToSave.company_id = user.company_id;

    const newRecord = await prisma.supplier.create({
      data: dataToSave
    });

    invalidateSuppliersCache();
    return NextResponse.json(newRecord);
  } catch (err: any) {
    console.error(err);
    return new NextResponse(err.message, { status: 500 });
  }
}

