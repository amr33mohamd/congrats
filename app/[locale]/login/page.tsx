'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button, Input, Card, CardTitle } from '@/components/ui';

// Dev login page (F0). Uses the Auth.js dev Credentials provider — entering any
// email logs you in offline; the seeded admin email becomes an admin.
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-token-6">
      <Card className="w-full max-w-sm">
        <CardTitle className="mb-token-4">Log in</CardTitle>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            await signIn('dev-login', { email, callbackUrl: '/dashboard' });
          }}
          className="flex flex-col gap-token-3"
        >
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? '…' : 'Continue'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
