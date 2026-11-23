import { PrismaClient } from "@prisma/client";
import { demoTransactions } from "../src/lib/domain";

const db = new PrismaClient();
async function main() {
  await Promise.all(demoTransactions.map((transaction) =>
    db.demoTransaction.upsert({ where: { id: transaction.id }, create: transaction, update: {} }),
  ));
  console.log("Demo transactions seeded without changing existing decisions.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
