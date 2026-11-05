import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCurrentUser } from "@/lib/currentUser";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const user = await resolveCurrentUser(session);
    if (!user) throw new Error("Usuário não encontrado");

    const suppliers = await prisma.supplier.findMany({
      where: { company_id: user.company_id },
      orderBy: { name: "asc" }
    });

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

    return NextResponse.json(newRecord);
  } catch (err: any) {
    console.error(err);
    return new NextResponse(err.message, { status: 500 });
  }
}

