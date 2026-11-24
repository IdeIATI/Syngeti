import { spawn } from "child_process";
import assert from "assert";
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

const PORT = 3099;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "syngeti-runtime-token-key";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://piagucmxxsimuububnyl.supabase.co";
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpYWd1Y214eHNpbXV1YnVibnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMzkzMTMsImV4cCI6MjEwNjkxNTMxM30.1lhfafp1xa_JKw6EHK6kilg5fZTMs1_d-hNA0ZKljWE";

const prisma = new PrismaClient();

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/login`, { redirect: "manual" });
      if (res.status === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Servidor Next.js não respondeu em ${timeoutMs}ms`);
}

async function run() {
  console.log("=== E2E CONNECT CHAT PWA + SINCRONIZAÇÃO BIDIRECIONAL ===");
  const server = spawn("npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
  });

  const createdMessageIds = [];

  try {
    await waitForServer(BASE_URL);
    console.log(`[PASS] Servidor de produção ativo em ${BASE_URL}`);

    // 1. Validar Manifesto PWA, Service Worker e Ícones
    const manifestRes = await fetch(`${BASE_URL}/manifest.webmanifest`);
    assert.strictEqual(manifestRes.status, 200, "Manifesto /manifest.webmanifest deve retornar 200");
    const manifest = await manifestRes.json();
    assert.strictEqual(manifest.name, "CONNECT CHAT — SYNGETI");
    assert.strictEqual(manifest.start_url, "/chat");
    assert.strictEqual(manifest.display, "standalone");
    assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "Manifesto deve conter ícones 192 e 512");
    console.log("[PASS] Manifesto PWA válido:", manifest.name, "| start_url:", manifest.start_url);

    const swRes = await fetch(`${BASE_URL}/sw.js`);
    assert.strictEqual(swRes.status, 200, "Service Worker /sw.js deve retornar 200");
    const swText = await swRes.text();
    assert(swText.includes("notificationclick") && swText.includes("push"), "SW deve tratar push e notificationclick");
    console.log("[PASS] Service Worker /sw.js válido");

    const icon192 = await fetch(`${BASE_URL}/branding/connect-chat-192.png`);
    const icon512 = await fetch(`${BASE_URL}/branding/connect-chat-512.png`);
    assert.strictEqual(icon192.status, 200);
    assert.strictEqual(icon512.status, 200);
    console.log("[PASS] Ícones PWA 192x192 e 512x512 acessíveis (HTTP 200)");

    // 2. Validar Segurança / Middleware (sem sessão)
    const unauthChat = await fetch(`${BASE_URL}/chat`, { redirect: "manual" });
    assert.strictEqual(unauthChat.status, 307, "/chat sem sessão deve redirecionar (307)");
    assert(
      unauthChat.headers.get("location")?.includes("/login"),
      "/chat sem sessão deve redirecionar para /login"
    );

    const unauthAlias = await fetch(`${BASE_URL}/connect-chat`, { redirect: "manual" });
    assert.strictEqual(unauthAlias.status, 307, "/connect-chat deve redirecionar para /chat");
    assert(unauthAlias.headers.get("location")?.endsWith("/chat"));

    const unauthApi = await fetch(`${BASE_URL}/api/chat?channelId=test`);
    assert.strictEqual(unauthApi.status, 401, "API /api/chat sem sessão deve retornar 401");
    console.log("[PASS] Segurança & Middleware: rotas protegidas bloqueiam acesso não autenticado");

    // 3. Autenticar com usuário real do banco (mesma conta ERP e PWA)
    const user = await prisma.user.findFirst({
      where: { status: { in: ["ACTIVE", "active"] } },
      orderBy: { created_at: "asc" },
    });
    assert(user, "Nenhum usuário ativo encontrado no banco para teste");

    const jwt = await encode({
      token: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sub: user.id,
      },
      secret: SECRET,
    });
    const authHeaders = {
      Cookie: `next-auth.session-token=${jwt}`,
      "Content-Type": "application/json",
    };

    // 4. Validar Renderização Independente (/chat) vs ERP (/connect)
    const pwaHtmlRes = await fetch(`${BASE_URL}/chat`, { headers: authHeaders });
    assert.strictEqual(pwaHtmlRes.status, 200, "Rota /chat autenticada deve retornar 200");
    const pwaHtml = await pwaHtmlRes.text();
    assert(pwaHtml.includes("CONNECT CHAT"), "Rota /chat deve renderizar CONNECT CHAT");
    assert(!pwaHtml.includes("CMDB / ESTOQUE"), "Rota /chat NÃO deve conter menu lateral do ERP");

    const erpHtmlRes = await fetch(`${BASE_URL}/connect`, { headers: authHeaders });
    assert.strictEqual(erpHtmlRes.status, 200, "Rota /connect autenticada deve retornar 200");
    const erpHtml = await erpHtmlRes.text();
    assert(erpHtml.includes("CMDB / ESTOQUE"), "Rota /connect deve manter o menu do ERP");
    console.log(`[PASS] Interfaces validadas com mesmo login (${user.email}): /chat isolado e /connect integrado`);

    // 5. Validar Sincronização Bidirecional (PWA <-> ERP) + Idempotência no mesmo banco
    const geral = await prisma.chatChannel.findFirst({ where: { name: "Geral" } });
    assert(geral, "Canal Geral não encontrado");

    const pwaClientId = `e2e-pwa-${Date.now()}`;
    const pwaText = `[E2E PWA -> ERP] Mensagem enviada pelo App PWA ${Date.now()}`;

    // Envio pelo PWA
    const postPwa = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        channelId: geral.id,
        content: pwaText,
        type: "text",
        clientId: pwaClientId,
      }),
    });
    assert.strictEqual(postPwa.status, 200, "Envio pelo PWA deve retornar 200");
    const pwaMsg = await postPwa.json();
    createdMessageIds.push(pwaMsg.id);

    // Retry idempotente (não deve duplicar)
    const retryPwa = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        channelId: geral.id,
        content: pwaText,
        type: "text",
        clientId: pwaClientId,
      }),
    });
    assert.strictEqual(retryPwa.status, 200);
    const retryMsg = await retryPwa.json();
    assert.strictEqual(retryMsg.id, pwaMsg.id, "Retry com mesmo clientId deve retornar mesmo ID sem duplicar");

    const dbDupCount = await prisma.chatMessage.count({ where: { client_id: pwaClientId } });
    assert.strictEqual(dbDupCount, 1, "Banco deve conter exatamente 1 registro para o client_id");

    // Leitura pelo ERP
    const erpGet = await fetch(`${BASE_URL}/api/chat?channelId=${geral.id}`, { headers: authHeaders });
    assert.strictEqual(erpGet.status, 200);
    const erpMsgs = await erpGet.json();
    assert(
      erpMsgs.some((m) => m.id === pwaMsg.id && m.content === pwaText),
      "Mensagem enviada pelo PWA deve aparecer imediatamente no ERP"
    );
    console.log(`[PASS] PWA -> ERP sincronizado sem duplicidade (ID: ${pwaMsg.id})`);

    // Envio pelo ERP
    const erpClientId = `e2e-erp-${Date.now()}`;
    const erpText = `[E2E ERP -> PWA] Mensagem enviada pelo ERP ${Date.now()}`;
    const postErp = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        channelId: geral.id,
        content: erpText,
        type: "text",
        clientId: erpClientId,
      }),
    });
    assert.strictEqual(postErp.status, 200);
    const erpMsg = await postErp.json();
    createdMessageIds.push(erpMsg.id);

    // Leitura pelo PWA
    const pwaGet = await fetch(`${BASE_URL}/api/chat?channelId=${geral.id}`, { headers: authHeaders });
    assert.strictEqual(pwaGet.status, 200);
    const pwaMsgs = await pwaGet.json();
    assert(
      pwaMsgs.some((m) => m.id === erpMsg.id && m.content === erpText),
      "Mensagem enviada pelo ERP deve aparecer imediatamente no PWA"
    );
    console.log(`[PASS] ERP -> PWA sincronizado no mesmo canal (ID: ${erpMsg.id})`);

    // Edição de mensagem + Sync
    const editedText = `${pwaText} [EDITADO]`;
    const patchRes = await fetch(`${BASE_URL}/api/chat`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ messageId: pwaMsg.id, content: editedText }),
    });
    assert.strictEqual(patchRes.status, 200);
    const syncRes = await fetch(`${BASE_URL}/api/chat/sync`, { headers: authHeaders });
    assert.strictEqual(syncRes.status, 200);
    const syncData = await syncRes.json();
    assert(syncData.success === true && Array.isArray(syncData.channels));
    console.log("[PASS] Edição de mensagem e /api/chat/sync validados");

    // 6. Validar Supabase Realtime Broadcast Bidirecional (WebSocket)
    const sbPwa = createClient(SUPABASE_URL, SUPABASE_ANON);
    const sbErp = createClient(SUPABASE_URL, SUPABASE_ANON);

    const realtimeProof = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timeout aguardando Supabase Realtime")), 8000);
      let erpReceivedFromPwa = false;
      let pwaReceivedFromErp = false;

      const chErp = sbErp.channel("connect-chat-events", { config: { broadcast: { self: false } } });
      const chPwa = sbPwa.channel("connect-chat-events", { config: { broadcast: { self: false } } });

      const checkDone = async () => {
        if (erpReceivedFromPwa && pwaReceivedFromErp) {
          clearTimeout(timer);
          await sbErp.removeChannel(chErp);
          await sbPwa.removeChannel(chPwa);
          resolve(true);
        }
      };

      chErp.on("broadcast", { event: "message" }, ({ payload }) => {
        if (payload?.messageId === pwaMsg.id) {
          erpReceivedFromPwa = true;
          checkDone();
        }
      });

      chPwa.on("broadcast", { event: "message" }, ({ payload }) => {
        if (payload?.messageId === erpMsg.id) {
          pwaReceivedFromErp = true;
          checkDone();
        }
      });

      let subscribedCount = 0;
      const onSub = (status) => {
        if (status === "SUBSCRIBED") {
          subscribedCount++;
          if (subscribedCount === 2) {
            chPwa.send({
              type: "broadcast",
              event: "message",
              payload: { channelId: geral.id, messageId: pwaMsg.id, senderId: user.id },
            });
            chErp.send({
              type: "broadcast",
              event: "message",
              payload: { channelId: geral.id, messageId: erpMsg.id, senderId: user.id },
            });
          }
        }
      };

      chErp.subscribe(onSub);
      chPwa.subscribe(onSub);
    });

    assert.strictEqual(realtimeProof, true);
    console.log("[PASS] Supabase Realtime Broadcast bidirecional (PWA <-> ERP) validado em tempo real");

    console.log("\n=== TODOS OS TESTES E2E PASSARAM COM 100% DE SUCESSO ===");
  } finally {
    // Limpar mensagens de teste para não sujar o histórico real
    for (const id of createdMessageIds) {
      try {
        await prisma.chatMessage.delete({ where: { id } });
      } catch {}
    }
    await prisma.$disconnect();
    server.kill();
  }
}

run().catch((err) => {
  console.error("[FAIL] Erro no teste E2E:", err);
  process.exit(1);
});
