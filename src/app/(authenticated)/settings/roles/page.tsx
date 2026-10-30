import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import RoleManager from "./RoleManager";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RolesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { users: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Perfis de Acesso (Roles)</h2>
          <p className="text-sm text-muted-foreground mt-1">Crie perfis de permissão e defina o que cada grupo pode acessar no sistema.</p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-hover hover:bg-muted border border-border text-xs font-bold text-foreground transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-primary" />
          <span>Configurações</span>
        </Link>
      </div>

      <RoleManager initialRoles={roles} />
    </div>
  );
}
