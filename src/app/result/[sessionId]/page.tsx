import type { Metadata } from "next";
import ResultView from "../ResultView";
import { dbGetMbtiResult } from "@/server/db";

export async function generateMetadata({ params }: { params: { sessionId: string } }): Promise<Metadata> {
  const row = dbGetMbtiResult(params.sessionId);
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

export default function ResultSessionPage({ params }: { params: { sessionId: string } }) {
  return <ResultView initialSessionId={params.sessionId} />;
}
