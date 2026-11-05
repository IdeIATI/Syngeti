import { AuthenticatedShell } from "@/components/AuthenticatedShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getBranding } from "@/lib/branding";
import { resolveCurrentUser } from "@/lib/currentUser";

// Memoiza a busca de avatar por ciclo de render (evita queries duplicadas na mesma request)
const getUserAvatar = cache(async (userId: string, userEmail?: string | null): Promise<string | null> => {
  try {
    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, avatar: true },
    });

    if (!dbUser && userEmail) {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userEmail },
            { username: userEmail },
            ...(userEmail.includes("admin") ? [{ username: "administrador" }] : []),
          ],
        },
        select: { id: true, avatar: true },
      });
    }

    if (dbUser?.avatar) {
      return `/api/users/${dbUser.id}/avatar`;
    }
    return null;
  } catch {
    return null;
  }
});

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Resolve o usuário autenticado completo (com avatar canônico)
  const currentUser = await resolveCurrentUser(session);
  const userAvatar = currentUser?.avatar || session.user?.image || (session.user?.id ? await getUserAvatar(session.user.id, session.user.email) : null);

  const initialUser = {
    id: currentUser?.id || session.user.id || "admin-master",
    name: currentUser?.name || session.user.name || "Administrador",
    email: currentUser?.email || session.user.email || "administrador",
    role: currentUser?.role || "ADMINISTRADOR",
    avatar: userAvatar,
    company_id: currentUser?.company_id,
  };

  const branding = getBranding();

  return (
    <AuthenticatedShell
      initialUser={initialUser}
      initialBranding={branding}
    >
      {children}
    </AuthenticatedShell>
  );
}
