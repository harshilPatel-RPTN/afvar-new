import { NextResponse } from "next/server";
import { fetchHomeMarket } from "@/modules/home/server";

export async function GET() {
  try {
    return NextResponse.json(await fetchHomeMarket());
  } catch (error) {
    // The upstream detail (provider hosts, status codes) stays in the server log, not the response.
    console.error("home market fetch failed", error);
    return NextResponse.json({ error: "market_unavailable" }, { status: 502 });
  }
}
