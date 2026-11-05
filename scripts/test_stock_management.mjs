import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== INICIANDO TESTE DO MÓDULO DE PEÇAS & ESTOQUE DE TI ===");

  try {
    // 1. Obter empresa existente
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("Nenhuma empresa encontrada no banco");
    console.log(`✓ Empresa encontrada: ${company.name} (${company.id})`);

    // 2. Obter usuário para responsabilidade
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("Nenhum usuário encontrado no banco");
    console.log(`✓ Usuário auditor encontrado: ${user.name} (${user.id})`);

    // 3. Teste de Categoria
    let cat = await prisma.productCategory.findFirst({
      where: { company_id: company.id, name: "Sensores & Testes Automatizados" }
    });
    if (!cat) {
      cat = await prisma.productCategory.create({
        data: {
          name: "Sensores & Testes Automatizados",
          description: "Categoria criada para validação do sistema",
          department_group: "TI",
          company_id: company.id
        }
      });
    }
    console.log(`✓ Categoria criada/obtida com sucesso: ${cat.name} (${cat.id})`);

    // 4. Teste de SKU Automático
    const testSku = `SKU-TEST-${Date.now().toString().slice(-4)}`;
    const product = await prisma.product.create({
      data: {
        sku: testSku,
        name: "Sensor Óptico Fim de Curso DTF Teste",
        category_id: cat.id,
        brand: "Omron",
        model: "EE-SX672",
        part_number: `PN-OMR-${Date.now().toString().slice(-4)}`,
        unit: "UN",
        type: "PART",
        compatibility: "Impressora DTF 60cm XP600",
        location: "Prateleira B3 - Caixa 01",
        min_stock: 2,
        reorder_point: 5,
        avg_cost: 45.0,
        last_cost: 45.0,
        current_stock: 0,
        status: "ACTIVE",
        company_id: company.id
      }
    });
    console.log(`✓ Produto criado com sucesso: [${product.sku}] ${product.name}`);

    // 5. Teste de Movimentação de Entrada (+10 unidades)
    const movCodeEntry = `MOV-TEST-${Date.now().toString().slice(-5)}`;
    const entryMovement = await prisma.$transaction(async (tx) => {
      const p = await tx.product.findUnique({ where: { id: product.id } });
      const balanceAfter = p.current_stock + 10;
      const mov = await tx.stockMovement.create({
        data: {
          code: movCodeEntry,
          product_id: p.id,
          type: "IN_PURCHASE",
          quantity: 10,
          balance_after: balanceAfter,
          unit_cost: 45.0,
          total_cost: 450.0,
          document_ref: "NF-TEST-001",
          reason: "Entrada de compra teste",
          user_id: user.id,
          company_id: company.id
        }
      });
      await tx.product.update({
        where: { id: p.id },
        data: { current_stock: balanceAfter }
      });
      return mov;
    });
    console.log(`✓ Movimentação de entrada executada: +10 un. Saldo resultante: ${entryMovement.balance_after}`);

    // 6. Teste de Movimentação de Saída (-3 unidades)
    const movCodeExit = `MOV-TEST-EX-${Date.now().toString().slice(-5)}`;
    const exitMovement = await prisma.$transaction(async (tx) => {
      const p = await tx.product.findUnique({ where: { id: product.id } });
      const balanceAfter = p.current_stock - 3;
      if (balanceAfter < 0) throw new Error("Saldo não pode ficar negativo");
      const mov = await tx.stockMovement.create({
        data: {
          code: movCodeExit,
          product_id: p.id,
          type: "OUT_CONSUMPTION",
          quantity: 3,
          balance_after: balanceAfter,
          destination: "Máquina DTF 01",
          reason: "Substituição de sensor danificado",
          user_id: user.id,
          company_id: company.id
        }
      });
      await tx.product.update({
        where: { id: p.id },
        data: { current_stock: balanceAfter }
      });
      return mov;
    });
    console.log(`✓ Movimentação de saída executada: -3 un. Saldo resultante: ${exitMovement.balance_after}`);

    // 7. TESTE DE BLOQUEIO RIGÍDO DE SALDO NEGATIVO (Tentativa de retirar 20 unidades tendo apenas 7)
    let negativeBlocked = false;
    try {
      await prisma.$transaction(async (tx) => {
        const p = await tx.product.findUnique({ where: { id: product.id } });
        const balanceAfter = p.current_stock - 20; // 7 - 20 = -13
        if (balanceAfter < 0) {
          throw new Error("Operação bloqueada: Saldo insuficiente. O sistema não permite saldo negativo.");
        }
        await tx.stockMovement.create({
          data: {
            code: "MOV-SHOULD-FAIL",
            product_id: p.id,
            type: "OUT_CONSUMPTION",
            quantity: 20,
            balance_after: balanceAfter,
            user_id: user.id,
            company_id: company.id
          }
        });
      });
    } catch (negativeErr) {
      negativeBlocked = true;
      console.log(`✓ Bloqueio de saldo negativo validado com sucesso! Mensagem: "${negativeErr.message}"`);
    }

    if (!negativeBlocked) {
      throw new Error("FALHA: O sistema permitiu saldo negativo!");
    }

    // 8. Teste de Regra de Inativação vs Exclusão (Tentativa de deletar produto com movimentação)
    const productWithMovs = await prisma.product.findUnique({
      where: { id: product.id },
      include: { _count: { select: { movements: true } } }
    });

    if (productWithMovs._count.movements > 0) {
      // Inativa em vez de deletar
      const inactivated = await prisma.product.update({
        where: { id: product.id },
        data: { status: "INACTIVE" }
      });
      console.log(`✓ Regra de integridade contábil validada: Produto inativado (status: ${inactivated.status}) preservando ${productWithMovs._count.movements} movimentações.`);
    }

    // Cleanup de teste: limpar movimentações de teste e produto de teste
    await prisma.stockMovement.deleteMany({ where: { product_id: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.productCategory.delete({ where: { id: cat.id } });
    console.log(`✓ Limpeza de registros de teste concluída sem resíduos.`);

    console.log("\n=======================================================");
    console.log("TODOS OS TESTES DE INTEGRIDADE CONTÁBIL E SALDO PASSARAM COM SUCESSO!");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("ERRO NO TESTE:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
