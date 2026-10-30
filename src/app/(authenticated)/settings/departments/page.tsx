import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DepartmentManager from "./DepartmentManager";

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [user, defaultCompany, departments] = await Promise.all([
    session.user?.id 
      ? prisma.user.findUnique({ where: { id: session.user.id }, select: { company_id: true } }) 
      : Promise.resolve(null),
    prisma.company.findFirst({ select: { id: true } }),
    prisma.department.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    })
  ]);

  const companyId = user?.company_id || defaultCompany?.id || "default";

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Departamentos</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os departamentos organizacionais da empresa.</p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-hover hover:bg-muted border border-border text-xs font-bold text-foreground transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-primary" />
          <span>Configurações</span>
        </Link>
      </div>

      <DepartmentManager initialDepartments={departments} companyId={companyId} />
    </div>
  );
}
