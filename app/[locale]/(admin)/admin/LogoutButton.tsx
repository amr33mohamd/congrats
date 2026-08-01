import { signOut } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';

/**
 * Server-action logout. Posts to NextAuth signOut and returns to /login.
 * Rendered inside the (server) admin layout and passed into the client sidebar.
 */
export async function LogoutButton() {
  const t = await getTranslations('admin');
  return (
    <form
      action={async () => {
        'use server';
        await signOut({ redirectTo: '/login' });
      }}
    >
      <button
        type="submit"
        className="text-sm text-danger underline-offset-2 hover:underline"
      >
        {t('shell.logout')}
      </button>
    </form>
  );
}
