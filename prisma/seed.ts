import { PrismaClient, Role, TransactionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash("Demo@12345", 12);
  const dean = await db.user.upsert({
    where: { email: "dean@demo.edu" },
    update: {},
    create: {
      name: "Prof. Meena Sharma",
      email: "dean@demo.edu",
      passwordHash,
      role: Role.DEAN,
    },
  });
  const admin = await db.user.upsert({
    where: { email: "admin@demo.edu" },
    update: {},
    create: {
      name: "Ravi Menon",
      email: "admin@demo.edu",
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  const inspector = await db.user.upsert({
    where: { email: "inspector@demo.edu" },
    update: {},
    create: {
      name: "Dr. Arvind Kumar",
      email: "inspector@demo.edu",
      passwordHash,
      role: Role.INSPECTOR,
    },
  });
  const funder = await db.fundingOrganization.upsert({
    where: { name: "DST-SERB" },
    update: {},
    create: { name: "DST-SERB" },
  });
  const project = await db.project.upsert({
    where: { code: "RND-2026-014" },
    update: {},
    create: {
      code: "RND-2026-014",
      name: "AI-Based Crop Disease Detection",
      description: "Computer vision research for early crop disease detection.",
      startDate: new Date("2023-04-01"),
      endDate: new Date("2026-03-31"),
      totalBudget: 1500000,
      ownerId: inspector.id,
      categories: {
        create: [
          { name: "Equipment", allocated: 700000 },
          { name: "Travel", allocated: 300000 },
          { name: "Research Personnel", allocated: 500000 },
        ],
      },
      funders: { create: { organizationId: funder.id, contributed: 1500000 } },
      coInspectors: { create: [{ name: "Dr. Neha Rao" }] },
    },
  });
  await db.transaction.upsert({
    where: { code: "TXN-1842" },
    update: {},
    create: {
      code: "TXN-1842",
      date: new Date("2026-08-28"),
      vendor: "TechNova Equipments Ltd.",
      description: "GPU servers for model training",
      status: TransactionStatus.PENDING_DEAN,
      projectId: project.id,
      createdById: inspector.id,
      lines: {
        create: {
          amount: 42500,
          categoryId: (
            await db.budgetCategory.findFirstOrThrow({
              where: { projectId: project.id, name: "Equipment" },
            })
          ).id,
        },
      },
      invoice: {
        create: {
          fileName: "invoice-1842.pdf",
          mimeType: "application/pdf",
          size: 184000,
          storageKey: "demo/invoice-1842.pdf",
        },
      },
    },
  });
  await db.auditEntry.create({
    data: {
      action: "SEED_DEMO",
      entity: "SYSTEM",
      entityId: "demo",
      actorId: admin.id,
      after: { dean: dean.email, inspector: inspector.email },
    },
  });
}
main().finally(() => db.$disconnect());
