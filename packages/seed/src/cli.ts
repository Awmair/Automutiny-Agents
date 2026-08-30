import { seedDatabase } from "./seed";

const counts = await seedDatabase();

console.log(
  `Seed complete: ${Object.entries(counts)
    .map(([table, count]) => `${table}=${count}`)
    .join(", ")}`,
);
