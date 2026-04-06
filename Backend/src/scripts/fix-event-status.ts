import "dotenv/config";
import prisma from "../configs/pool-coonection.config";

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "Events"
    SET status = 'PUBLISHED'
    WHERE status = 'ACTIVE'
  `;
  console.log(`Updated ${result} row(s) from ACTIVE -> PUBLISHED`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
