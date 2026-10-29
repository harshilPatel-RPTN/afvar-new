import { NextResponse } from "next/server";
import { fetchHomeMarket } from "@/modules/home/server";

export async function GET() {
  try {
    return NextResponse.json(await fetchHomeMarket());
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
