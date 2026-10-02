import { describe, expect, it } from 'vitest';
import { adminNotifyEmail, renderAdminNotice } from './admin-notify';

describe('admin notifications', () => {
  it('sends to ADMIN_NOTIFY_EMAIL, else the seed admin, else nobody', () => {
    expect(adminNotifyEmail({ ADMIN_NOTIFY_EMAIL: 'a@x.com', SEED_ADMIN_EMAIL: 'b@x.com' })).toBe('a@x.com');
    expect(adminNotifyEmail({ SEED_ADMIN_EMAIL: 'b@x.com' })).toBe('b@x.com');
    expect(adminNotifyEmail({})).toBeNull();
  });

  it('escapes user-supplied values and links to the admin page', () => {
    const { html, text } = renderAdminNotice(
      { subject: 'New sign-up', rows: [['Name', '<img src=x onerror=alert(1)>']], actionPath: '/ar/admin/users' },
      'https://site.test',
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('https://site.test/ar/admin/users');
    expect(text).toContain('Name: <img');
  });
});
