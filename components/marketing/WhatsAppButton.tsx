'use client';

/**
 * Floating "chat on WhatsApp" button for the marketing pages. In Egypt most
 * buyers want to ask one question before paying by InstaPay; this answers
 * it in their own app. Renders nothing until NEXT_PUBLIC_SUPPORT_WHATSAPP
 * is set (the href is built server-side and passed in).
 */
import { track } from '@/lib/track';

export function WhatsAppButton({ href, locale }: { href: string | null; locale: string }) {
  if (!href) return null;
  const ar = locale === 'ar';
  const text = ar ? 'أهلاً، عندي سؤال عن Congrats' : 'Hi, I have a question about Congrats';
  return (
    <a
      href={`${href}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('whatsapp_click')}
      aria-label={ar ? 'كلمنا على واتساب' : 'Chat with us on WhatsApp'}
      className="fixed bottom-token-4 end-token-4 z-40 inline-flex items-center gap-token-2 rounded-full bg-[#25D366] px-token-4 py-token-3 text-sm font-bold text-white shadow-lg transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
      </svg>
      {ar ? 'كلمنا واتساب' : 'WhatsApp us'}
    </a>
  );
}
