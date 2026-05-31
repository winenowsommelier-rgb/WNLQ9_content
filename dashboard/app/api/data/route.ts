import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseGA4, parseGSC } from "@/lib/csv";

/**
 * GET /api/data
 * Returns parsed GA4 + GSC data from the local sample CSVs.
 * Week 3: swap the file reads for live GA4 / GSC API calls.
 */
export async function GET() {
  try {
    const dir = path.join(process.cwd(), "data");
    const [gaText, gscText] = await Promise.all([
      readFile(path.join(dir, "sample-ga4-data.csv"), "utf8").catch(() => ""),
      readFile(path.join(dir, "sample-gsc-data.csv"), "utf8").catch(() => ""),
    ]);

    return NextResponse.json({
      ga4: parseGA4(gaText),
      gsc: parseGSC(gscText),
      source: "sample-csv",
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, ga4: [], gsc: [] },
      { status: 500 },
    );
  }
}
