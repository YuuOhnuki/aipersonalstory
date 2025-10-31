"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function ResultPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const sid = (() => {
      try { return localStorage.getItem("sessionId"); } catch { return null; }
    })();
    if (!sid) { setChecked(true); return; }
    // Try to resolve saved result by id (result_id or session_id)
    fetch(`/api/result/${encodeURIComponent(sid)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        const id = data?.result_id || sid;
        router.replace(`/result/${encodeURIComponent(id)}`);
      })
      .catch(() => setChecked(true));
  }, [router]);

  if (!checked) return null;

  return (
    <div className="pb-20">
      <Section className="pt-10">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardBody>
              <div className="space-y-3">
                <div className="text-base font-semibold">結果がまだありません</div>
                <div className="text-sm text-black/70 dark:text-white/70">簡易診断または詳細診断を実行して、結果を生成してください。</div>
                <div className="flex gap-2 pt-2">
                  <Link href="/chat"><Button>簡易診断を始める</Button></Link>
                  <Link href="/detail/take"><Button variant="secondary">詳細診断を始める</Button></Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </Section>
    </div>
  );
}
