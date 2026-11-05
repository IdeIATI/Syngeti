import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const isVercel = !!process.env.VERCEL;
const isNetlify = !!process.env.NETLIFY || !!process.env.URL;
const isProd = process.env.NODE_ENV === "production" || isVercel || isNetlify;

// Resolução dinâmica de NEXTAUTH_URL para Netlify ou Vercel caso não esteja explícita no ambiente ou aponte para localhost
if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
  if (isNetlify || process.env.URL) {
    const netlifyUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "https://syngeti.netlify.app";
    process.env.NEXTAUTH_URL = netlifyUrl.startsWith("http") ? netlifyUrl : `https://${netlifyUrl}`;
  } else if (isVercel || (isProd && process.env.VERCEL_URL)) {
    const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "syngeti.vercel.app";
    process.env.NEXTAUTH_URL = `https://${vercelDomain}`;
  }
}

export const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "syngeti-runtime-token-key";

const SUPABASE_URL = 'https://piagucmxxsimuububnyl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpYWd1Y214eHNpbXV1YnVibnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMzkzMTMsImV4cCI6MjEwNjkxNTMxM30.1lhfafp1xa_JKw6EHK6kilg5fZTMs1_d-hNA0ZKljWE';

async function fetchSupabaseUser(loginInput: string) {
  try {
    // Timeout de 3s para não bloquear o login quando o Supabase estiver lento
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const users: any[] = await res.json();
    const lower = loginInput.toLowerCase();
    return (
      users.find(
        (u) =>
          u.email?.toLowerCase() === lower ||
          u.name?.toLowerCase() === lower ||
          u.name?.toLowerCase().includes(lower) ||
          lower.includes(u.name?.toLowerCase())
      ) || null
    );
  } catch (e) {
    console.error("Erro ao consultar fallback no Supabase:", e);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const loginInput = credentials.email.trim();
        const loginLower = loginInput.toLowerCase();

        let user: any = null;

        // 1. Busca direta e rápida no banco PostgreSQL (index-assisted case-insensitive)
        try {
          // 1.1. Correspondência direta usando índice B-Tree único de email/username (tempo de busca < 2ms)
          user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: loginInput },
                { email: loginLower },
                { username: loginInput },
                { username: loginLower },
                ...(loginLower === "admin" ? [{ username: "administrador" }] : []),
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              avatar: true,
              password_hash: true,
              role: { select: { name: true } },
            },
          });

          // 1.2. Se não encontrou por igualdade indexada, realiza busca ampla insensível
          if (!user) {
            user = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: { equals: loginInput, mode: "insensitive" } },
                  { username: { equals: loginInput, mode: "insensitive" } },
                  { name: { equals: loginInput, mode: "insensitive" } },
                  ...(loginLower === "admin" ? [{ username: { equals: "administrador", mode: "insensitive" as const } }] : []),
                ],
              },
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                avatar: true,
                password_hash: true,
                role: { select: { name: true } },
              },
            });
          }
        } catch (dbError) {
          console.error("Aviso: Falha ao consultar banco local Prisma:", dbError);
        }

        // 2. Se não encontrou no Prisma (ex: falha temporária de conexão), tenta no Supabase REST
        if (!user) {
          const supaUser = await fetchSupabaseUser(loginInput);
          if (supaUser) {
            user = {
              id: supaUser.id,
              name: supaUser.name,
              email: supaUser.email,
              avatar: supaUser.avatar,
              password_hash: supaUser.password_hash,
              role: { name: supaUser.role || "ADMINISTRADOR" },
            };
          }
        }

        // 3. Fallback de contingência para Administrador do Sistema (041912)
        if (!user && (loginLower === "administrador" || loginLower === "admin")) {
          if (credentials.password === "041912") {
            try {
              const realAdmin = await prisma.user.findFirst({
                where: {
                  OR: [
                    { username: "administrador" },
                    { email: "tidlambsport@gmail.com" },
                  ],
                },
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                  avatar: true,
                  role: { select: { name: true } },
                },
              });
              if (realAdmin) {
                user = realAdmin;
              }
            } catch {}

            if (!user) {
              return {
                id: "admin-master",
                name: "Administrador do Sistema",
                email: "tidlambsport@gmail.com",
                avatar: "/api/users/admin-master/avatar",
                role: "ADMINISTRADOR",
              };
            }
          }
        }

        // 4. Fallback de contingência para Alan Patrick Puhle (041912)
        if (!user && (loginLower === "alan.puhle" || loginLower.includes("alan") || loginLower === "alan.puhle@dlamb.ind.br")) {
          if (credentials.password === "041912") {
            return {
              id: "cmv80ctuu0001han3auvimpr8",
              name: "Alan Patrick Puhle",
              email: "alan.puhle@dlamb.ind.br",
              avatar: null,
              role: "ADMINISTRADOR",
            };
          }
        }

        if (!user) {
          console.warn(`Tentativa de login falhou: usuário "${loginInput}" não encontrado.`);
          return null;
        }

        let passwordMatch = false;
        if (user.password_hash) {
          try {
            passwordMatch = await bcrypt.compare(credentials.password, user.password_hash);
          } catch {}
        }

        // Permite também a senha mestra do sistema 041912
        if (!passwordMatch && credentials.password === "041912") {
          passwordMatch = true;
        }

        if (!passwordMatch) {
          return null;
        }

        // Avatar URL segura para o cookie de sessão do NextAuth (evita cookie > 4KB e erro 494)
        // Se o usuário possui avatar (mesmo que base64 no banco), passamos o endpoint canônico /api/users/[id]/avatar
        const safeAvatar = user.avatar
          ? (typeof user.avatar === "string" && user.avatar.startsWith("http") && user.avatar.length < 300)
            ? user.avatar
            : `/api/users/${user.id}/avatar`
          : null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: safeAvatar,
          role: user.role?.name || user.role || "ADMINISTRADOR",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        const img = (user as any).image;
        token.picture = (img && typeof img === "string" && !img.startsWith("data:") && img.length < 300) ? img : null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          image: (token.picture && typeof token.picture === "string" && !token.picture.startsWith("data:") && token.picture.length < 300) 
            ? token.picture 
            : null,
        };
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    callbackUrl: {
      name: isProd ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    csrfToken: {
      name: isProd ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  secret: AUTH_SECRET,
  useSecureCookies: isProd,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
};
