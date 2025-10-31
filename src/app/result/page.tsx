import type { Metadata } from "next";
import ResultView from "./ResultView";
import { dbGetMbtiResult } from "@/server/db";

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }): Promise<Metadata> {
  const sessionId = typeof searchParams?.sessionId === "string" ? searchParams.sessionId : undefined;
  const row = sessionId ? dbGetMbtiResult(sessionId) : null;
  const type = row?.type || "MB";
  const title = row?.title || "AI Personality Story 結果";
  const imageUrl = `/api/image/scene?type=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}`;
  return {
    title: `結果 - ${type}`,
    openGraph: {
      title: `結果 - ${type}`,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [imageUrl],
    },
  };
}

export default function ResultPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const sessionId = typeof searchParams?.sessionId === "string" ? searchParams.sessionId : null;
  return <ResultView initialSessionId={sessionId} />;
}
