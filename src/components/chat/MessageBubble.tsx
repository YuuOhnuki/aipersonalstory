import { Message } from '@/types/conversation';

export default function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';
    const isQuestion = !isUser && message.content.trim().startsWith('質問：');
    return (
        <div
            className={['flex', isUser ? 'justify-end' : 'justify-start'].join(
                ' '
            )}
        >
            <div
                className={[
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    isUser
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : isQuestion
                          ? 'bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-200'
                          : 'bg-white/70 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/10 text-foreground',
                ].join(' ')}
            >
                {message.content}
            </div>
        </div>
    );
}
