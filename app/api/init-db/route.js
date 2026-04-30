import { initDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  // Simple secret check so random people can't call this
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.INIT_DB_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initDB();
    return NextResponse.json({ success: true, message: "Database initialized!" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}