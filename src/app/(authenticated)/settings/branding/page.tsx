import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BrandingClient from "./BrandingClient";
import { getBrandingAsync } from "@/lib/branding";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function BrandingSettingsPage() {
  const session = await getServerSession(authOptions);
  
  const role = (session?.user?.role || "").toUpperCase();
  if (!session || (!role.includes('ADMIN') && !role.includes('GESTOR') && role !== 'TI')) {
    redirect("/dashboard");
  }

  const initialData = await getBrandingAsync();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Identidade Visual do SYNGETI</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os logotipos, ícones e imagem de fundo da plataforma.</p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-hover hover:bg-muted border border-border text-xs font-bold text-foreground transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-primary" />
          <span>Configurações</span>
        </Link>
      </div>

      <BrandingClient initialData={initialData} />
    </div>
  );
}
