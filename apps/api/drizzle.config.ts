import { defineConfig } from "drizzle-kit";
import fs from "fs";
import path from "path";

function getLocalD1DB() {
  try {
    const basePath = path.resolve(".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
    if (!fs.existsSync(basePath)) return null;
    const files = fs.readdirSync(basePath);
    const dbFile = files.find((f) => f.endsWith(".sqlite"));
    if (dbFile) {
      return path.join(basePath, dbFile);
    }
  } catch (err) {
    return null;
  }
  return null;
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: getLocalD1DB() || "",
  },
});
