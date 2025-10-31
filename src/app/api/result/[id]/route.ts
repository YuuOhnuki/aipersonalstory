import { NextRequest, NextResponse } from "next/server";
import { dbGetMbtiResultByAny } from "@/server/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const row = await dbGetMbtiResultByAny(id);
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  const axes = {
    "E/I": row.e_i || "E",
    "S/N": row.s_n || "S",
    "T/F": row.t_f || "T",
    "J/P": row.j_p || "J",
  } as const;

  const resp = {
    axes,
    type: row.type || "",
    title: row.title || "",
    summary: row.summary || "",
    story: row.story || "",
    features: row.features || "",
    reasons: row.reasons || "",
    advice: row.advice || "",
    avatar_url: row.avatar_url || null,
    scene_url: row.scene_url || null,
    result_id: row.result_id || id,
    created_at: row.created_at,
  };
  return NextResponse.json(resp);
}
