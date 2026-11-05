import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    let userId = "";
    if (params) {
      const resolved = await Promise.resolve(params);
      userId = resolved?.id || "";
    }

    if (!userId || userId === "undefined") {
      const url = new URL(req.url);
      const segments = url.pathname.split("/").filter(Boolean);
      const avatarIdx = segments.indexOf("avatar");
      if (avatarIdx > 0) {
        userId = segments[avatarIdx - 1];
      }
    }

    // Se o ID for 'me', descobre o ID do usuário através da sessão autenticada
    if (userId === "me" || !userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return new Response(null, { status: 401 });
      }
      userId = session.user.id || "";
      if (!userId && session.user.email) {
        const u = await prisma.user.findFirst({
          where: {
            OR: [
              { email: session.user.email },
              { username: session.user.email },
            ],
          },
          select: { id: true },
        });
        if (u) userId = u.id;
      }
    }

    // Caso de contingência para Administrador do Sistema ('admin', 'admin-master', 'administrador')
    if (userId === "admin-master" || userId === "admin" || userId === "administrador") {
      const admin = await prisma.user.findFirst({
        where: {
          OR: [
            { username: "administrador" },
            { email: "tidlambsport@gmail.com" },
            { name: "Administrador do Sistema" },
            { username: "admin" },
          ],
        },
        select: { id: true, avatar: true },
      });
      if (admin?.avatar) {
        return serveAvatarData(admin.avatar);
      }
      return new Response(null, { status: 404 });
    }

    // Busca o avatar do usuário no banco por ID direto
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Se não encontrou por ID (ex: email passado como parâmetro), tenta por email/username
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userId },
            { username: userId },
          ],
        },
        select: { avatar: true },
      });
    }

    if (!user || !user.avatar) {
      return new Response(null, { status: 404 });
    }

    return serveAvatarData(user.avatar);
  } catch (error) {
    console.error("Erro ao servir avatar do usuário:", error);
    return new Response(null, { status: 500 });
  }
}

function serveAvatarData(avatarString: string): Response {
  // 1. Se for uma URL externa (ex: Supabase Storage, CDN, S3)
  if (avatarString.startsWith("http://") || avatarString.startsWith("https://")) {
    return Response.redirect(avatarString, 307);
  }

  // 2. Se for uma Data URI em Base64 (padrão salvo pelo upload do sistema)
  if (avatarString.startsWith("data:")) {
    const matches = avatarString.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    }
  }

  // 3. Fallback genérico se a string não for reconhecida
  return new Response(null, { status: 404 });
}
