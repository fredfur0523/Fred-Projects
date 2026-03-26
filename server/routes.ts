import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";

// ── Helpers ───────────────────────────────────────────────────────────────────
const PUBLIC_DIR = path.join(process.cwd(), "client", "public");

function serveJsonFile(filePath: string, res: any, label: string) {
  const t0 = Date.now();
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[API] ${label}: file not found — run: node scripts/fetch-packaging-data.js`);
      res.status(404).json({
        error: "Data file not generated yet",
        hint: "Run: node scripts/fetch-packaging-data.js",
        file: path.basename(filePath),
      });
      return;
    }
    const raw     = fs.readFileSync(filePath, "utf-8");
    const data    = JSON.parse(raw);
    const elapsed = Date.now() - t0;
    console.log(`[API] ${label} → 200 in ${elapsed}ms (${(raw.length / 1024).toFixed(1)} KB)`);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(data);
  } catch (err: any) {
    console.error(`[API] ${label} ERROR:`, err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
}

// ── Route registration ────────────────────────────────────────────────────────
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  /**
   * GET /api/packaging/waterfall
   * Time-loss waterfall for the latest complete month, aggregated by zone.
   * Source: waterfall.json  (run: npx tsx scripts/fetch-kpis.ts to refresh)
   * Response schema:
   *   { period, zones[], data: { Global|AFR|APAC|...:
   *     { TT, NST, ST, DPA, LT, EC, LET, IC, EPT, OST,
   *       OSE, GLY, OAE, OEE, LEF, volume_hl } } }
   */
  app.get("/api/packaging/waterfall", (_req, res) => {
    serveJsonFile(
      path.join(PUBLIC_DIR, "waterfall.json"),
      res,
      "packaging/waterfall"
    );
  });

  /**
   * GET /api/packaging/kpi-history
   * Last 12 complete months of Packaging KPIs, by zone.
   * Source: kpi-history.json  (run: npx tsx scripts/fetch-kpis.ts to refresh)
   * Response schema:
   *   { latest_period, periods[], months: [
   *     { period, zone, OSE, GLY, OAE, OEE, LEF,
   *       EPT, ST, TT, OST, volume_hl, DPA, EC, IC } ] }
   */
  app.get("/api/packaging/kpi-history", (_req, res) => {
    serveJsonFile(
      path.join(PUBLIC_DIR, "kpi-history.json"),
      res,
      "packaging/kpi-history"
    );
  });

  return httpServer;
}
