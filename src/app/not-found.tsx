import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Search, Home, MessageSquare } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="pb-20">
      <Section className="pt-16">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardBody>
              <div className="space-y-4 text-center animate-fade-in">
                <div className="inline-flex items-center gap-2 text-xl font-semibold">
                  <Search className="h-5 w-5" /> ページが見つかりません
                </div>
                <div className="text-sm text-black/70 dark:text-white/70">
                  お探しのページは存在しないか、移動した可能性があります。
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <Link href="/"><Button><Home className="h-4 w-4 mr-1"/>ホームへ</Button></Link>
                  <Link href="/chat"><Button variant="secondary"><MessageSquare className="h-4 w-4 mr-1"/>簡易診断</Button></Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </Section>
    </div>
  );
}
