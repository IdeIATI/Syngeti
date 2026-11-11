import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Monitor } from "lucide-react";
import AssetForm from "../new/AssetForm";

export const dynamic = "force-dynamic";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const [asset, companies, locations, departments, users] = await Promise.all([
    prisma.asset.findUnique({
      where: { id },
      include: {
        computer: true,
        network_device: true,
        printer: true,
      },
    }),
    prisma.company.findMany({
      select: { id: true, corporate_name: true, trade_name: true },
      orderBy: { trade_name: "asc" },
    }),
    prisma.location.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!asset) notFound();

  const formattedCompanies = companies.map((c) => ({
    id: c.id,
    name: c.trade_name || c.corporate_name,
    corporate_name: c.corporate_name,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/cmdb"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para o Inventário (CMDB)
          </Link>
          <h2 className="text-2xl font-bold text-foreground">
            {asset.name} <span className="text-sm font-mono text-primary ml-1">({asset.asset_tag || asset.internal_id})</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e atualize as informações técnicas e patrimoniais do equipamento.
          </p>
        </div>

        {asset.type === "COMPUTER" && (
          <Link
            href="/pc-access"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors shrink-0"
          >
            <Monitor className="w-4 h-4" />
            Acessos & Senhas do PC
          </Link>
        )}
      </div>

      <AssetForm
        companies={formattedCompanies}
        locations={locations}
        departments={departments}
        users={users}
        initialData={asset}
        assetId={asset.id}
      />
    </div>
  );
}
