import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

if (!process.env.NEXTAUTH_URL) {
  const host =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;
  if (host) {
    process.env.NEXTAUTH_URL = host.startsWith("http") ? host : `https://${host}`;
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
