import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "prisma", "schema.prisma");
const source = fs.readFileSync(sourcePath, "utf8");
const databaseUrl = process.env.DATABASE_URL ?? "";
const inferred = databaseUrl.startsWith("postgres") ? "postgresql" : "sqlite";
const provider = process.env.PRISMA_PROVIDER || inferred;

if (provider !== "sqlite" && provider !== "postgresql") {
  console.error(`Unsupported PRISMA_PROVIDER "${provider}". Use sqlite or postgresql.`);
  process.exit(1);
}

const next = source.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${provider}"`);
if (!next.includes(`provider = "${provider}"`)) {
  console.error("Could not set the Prisma datasource provider.");
  process.exit(1);
}

const outDir = path.join(root, "prisma", ".generated");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "schema.prisma");
fs.writeFileSync(outPath, next);
console.log(`Prisma schema (${provider}) -> ${path.relative(root, outPath)}`);
