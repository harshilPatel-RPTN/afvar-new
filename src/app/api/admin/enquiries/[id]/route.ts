import { NextResponse } from "next/server";
import { currentAdmin } from "@/modules/company/server/admin-session";
import { deleteEnquiry } from "@/modules/company/server/enquiries";
import { MongoNotConfiguredError } from "@/modules/company/server/mongo";

export const runtime = "nodejs";

// Called by DeleteEnquiryButton on /admin. Only a signed-in admin may delete.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin: string | null;
  try {
    admin = await currentAdmin();
  } catch (error) {
    if (error instanceof MongoNotConfiguredError) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    console.error("[admin] could not confirm admin session", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const deleted = await deleteEnquiry(id);
    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch (error) {
    if (error instanceof MongoNotConfiguredError) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    console.error("[admin] failed to delete enquiry", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
