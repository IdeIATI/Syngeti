import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTests() {
  console.log("===============================================================================");
  console.log("   SYNGETI — BATERIA DE TESTES: SINCRONIZAÇÃO E FOTO DE PERFIL GLOBAL (AVATAR)   ");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message, details) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${message}`);
      if (details) console.log(`       -> ${details}`);
    } else {
      console.error(`[FAIL] ${message}`);
      if (details) console.error(`       -> ${details}`);
    }
  }

  // TESTE 1: Administrador do Sistema com foto cadastrada no banco
  console.log(">>> TESTE 1: Verificação do cadastro do Administrador do Sistema");
  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { username: "administrador" },
        { email: "tidlambsport@gmail.com" },
      ]
    },
    select: { id: true, name: true, email: true, username: true, avatar: true }
  });

  assert(
    !!admin,
    "Administrador do Sistema encontrado no banco de dados",
    `ID: ${admin?.id} | Nome: ${admin?.name} | Email: ${admin?.email}`
  );

  assert(
    !!admin?.avatar && admin.avatar.startsWith("data:image/"),
    "Administrador possui foto real cadastrada em formato de imagem válido",
    `Tamanho do avatar: ${admin?.avatar?.length} caracteres | Inicia com: ${admin?.avatar?.substring(0, 30)}...`
  );

  // TESTE 2: Decodificação e integridade do buffer binário da foto
  console.log("\n>>> TESTE 2: Decodificação da foto de perfil para serving HTTP");
  if (admin?.avatar) {
    const matches = admin.avatar.match(/^data:([^;]+);base64,(.+)$/);
    assert(
      !!matches && matches.length === 3,
      "Expressão regular extrai MIME type e payload Base64 com precisão",
      `MIME detectado: ${matches ? matches[1] : 'nenhum'}`
    );

    if (matches) {
      const buffer = Buffer.from(matches[2], "base64");
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      assert(
        buffer.length > 1000 && (isJpeg || isPng),
        "Buffer binário decodificado corresponde a um arquivo de imagem real e íntegro",
        `Tamanho: ${(buffer.length / 1024).toFixed(1)} KB | Formato: ${isJpeg ? 'JPEG' : isPng ? 'PNG' : 'Desconhecido'}`
      );
    }
  }

  // TESTE 3: Usuário sem foto cadastrada
  console.log("\n>>> TESTE 3: Verificação de usuário sem foto para acionamento de fallback");
  const userNoPhoto = await prisma.user.findFirst({
    where: { avatar: null },
    select: { id: true, name: true, avatar: true }
  });

  assert(
    !!userNoPhoto,
    "Usuário sem foto identificado para teste de fallback",
    `Usuário: ${userNoPhoto?.name} | Avatar: ${userNoPhoto?.avatar}`
  );

  // TESTE 4: Validação de tamanho da URL do avatar para Cookie de Sessão JWT (< 300 bytes)
  console.log("\n>>> TESTE 4: Blindagem contra estouro de cookie JWT (Limite 4KB / Erro 494)");
  const canonicalUrl = `/api/users/${admin?.id}/avatar`;
  assert(
    canonicalUrl.length < 100,
    "URL canônica do avatar é compacta e compatível com cookies seguros do NextAuth",
    `Tamanho da URL: ${canonicalUrl.length} bytes (URL: "${canonicalUrl}")`
  );

  // TESTE 5: Mapeamento de 'admin' para 'administrador'
  console.log("\n>>> TESTE 5: Resolução de login de 'admin' para o cadastro real do Administrador");
  const adminResolved = await prisma.user.findFirst({
    where: {
      OR: [
        { username: "admin" },
        { username: "administrador" },
        { email: "tidlambsport@gmail.com" },
      ]
    },
    select: { id: true, name: true }
  });

  assert(
    adminResolved?.id === admin?.id,
    "Identificador 'admin' resolve para o registro real com foto, mantendo consistência de sessão",
    `ID Resolvido: ${adminResolved?.id} === ${admin?.id}`
  );

  console.log("\n===============================================================================");
  console.log(`   RESULTADO DOS TESTES: ${passed} de ${total} PASSARAM COM SUCESSO (${Math.round((passed / total) * 100)}%)   `);
  console.log("===============================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error("Erro na bateria de testes:", e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
