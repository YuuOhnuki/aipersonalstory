import type { Metadata } from "next";
import ResultView from "../ResultView";
import { dbGetMbtiResult } from "@/server/db";

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }): Promise<Metadata> {
  const p = await params;
  const row = await dbGetMbtiResult(p.sessionId);
  const type = row?.type || "MB";
  const title = row?.title || "AI Personality Story 結果";
  const avatarUrl = `/api/image/avatar?type=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}`;
  return {
    title: `結果 - ${type}`,
    openGraph: {
      title: `結果 - ${type}`,
      images: [{ url: avatarUrl, width: 800, height: 800 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [avatarUrl],
    },
  };
}

export default async function ResultSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const p = await params;
  // ensure DB row exists; client will still fetch via API for current UI
  await dbGetMbtiResult(p.sessionId);
  return <ResultView initialSessionId={p.sessionId} />;
}
