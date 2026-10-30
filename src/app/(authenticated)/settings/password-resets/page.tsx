import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PasswordResetManager from "./PasswordResetManager";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PasswordResetsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userRole = (session.user?.role || "").toUpperCase();
  if (userRole !== "ADMINISTRADOR" && userRole !== "ADMIN" && userRole !== "GESTOR") {
    redirect("/dashboard");
  }

  const initialRequests = await prisma.passwordResetRequest.findMany({
    orderBy: { created_at: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          job_title: true,
          role: { select: { name: true } },
          department: { select: { name: true } }
        }
      }
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Solicitações de Recuperação de Senha</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e atenda aos chamados de redefinição de acesso solicitados pelos colaboradores.
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-hover hover:bg-muted border border-border text-xs font-bold text-foreground transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-primary" />
          <span>Configurações</span>
        </Link>
      </div>

      <PasswordResetManager initialRequests={initialRequests} currentAdminName={session.user.name || "Administrador"} />
    </div>
  );
}
