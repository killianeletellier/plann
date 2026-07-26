import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import { db, sqlite } from "../src/lib/db/client";
import { seedDatabase } from "../src/lib/db/seed";

const migrationsFolder = path.join(process.cwd(), "drizzle");

console.log("Initialisation de la base de données PLANN...");

try {
  migrate(db, { migrationsFolder });
  console.log("Migrations appliquées.");
} catch (err) {
  console.log("Note: migrations —", err instanceof Error ? err.message : err);
}

seedDatabase()
  .then(() => {
    sqlite.close();
    console.log("Terminé.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erreur:", err);
    sqlite.close();
    process.exit(1);
  });
