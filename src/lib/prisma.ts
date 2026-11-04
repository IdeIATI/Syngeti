import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const DEFAULT_FALLBACK_URL =
  "postgresql://postgres.piagucmxxsimuububnyl:x6RO3ISFMqwDd6We@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

function cleanAndSanitizeDbUrl(raw?: string): string {
  if (!raw || !raw.trim()) {
    return DEFAULT_FALLBACK_URL;
  }
  let url = raw.trim();

  // Correção automática de erro de digitação comum: piaqu -> piaguc
  if (url.includes("piaqucmxxsimuububnyl")) {
    url = url.replace("piaqucmxxsimuububnyl", "piagucmxxsimuububnyl");
  }

  // Correção de host cortado ou incompleto (ex: aws-0-sa-east-1.poole: ...)
  if (url.includes("aws-0-sa-east-1.poole:") || (url.includes("aws-0-sa-east-1") && !url.includes(".pooler.supabase.com"))) {
    url = url.replace(/aws-0-sa-east-1.*$/, "aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true");
  }

  return url;
}

const rawUrl = cleanAndSanitizeDbUrl(process.env.DATABASE_URL);

// Configuração otimizada de conexão para Supabase PgBouncer (Transaction Mode)
// connection_limit=20 e pool_timeout=20 evitam exaustão de pool (P2024) em picos concorrentes de chat e sincronização
function buildResilientDbUrl(url: string): string {
  let finalUrl = url;
  const appendParam = (key: string, value: string) => {
    if (!finalUrl.includes(`${key}=`)) {
      finalUrl += `${finalUrl.includes("?") ? "&" : "?"}${key}=${value}`;
    }
  };
  if (finalUrl.includes("pooler.supabase.com:6543")) {
    appendParam("pgbouncer", "true");
  }
  appendParam("connection_limit", "20");
  appendParam("pool_timeout", "20");
  appendParam("connect_timeout", "15");
  return finalUrl;
}

const dbUrl = buildResilientDbUrl(rawUrl);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error', 'warn'],
  });

globalForPrisma.prisma = prisma;
