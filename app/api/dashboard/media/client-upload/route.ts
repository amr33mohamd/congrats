import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { userContext } from '@/server/db-context';
import { withErrors, json } from '@/server/dashboard/http';
import { DashboardError } from '@/server/dashboard/errors';
import { authorizeClientUpload } from '@/server/dashboard/media-service';
import { storageDriver } from '@/server/storage';

export const runtime = 'nodejs';

/**
 * POST /api/dashboard/media/client-upload — issues a short-lived Vercel Blob
 * token so the browser can upload a video or song straight to the store. A
 * Vercel function refuses request bodies over 4.5 MB, so these files cannot
 * go through the multipart route there.
 *
 * Flow: POST /media/sign (mints the key) → upload() from @vercel/blob/client
 * (calls this route for the token) → POST /media/confirm (checks the bytes and
 * records the media row). There is no upload-completed callback: confirm is
 * the only thing that records a row, exactly as for the other upload paths.
 */
export async function POST(req: Request) {
  return withErrors(async () => {
    if (storageDriver() !== 'vercel-blob') {
      throw DashboardError.conflict('direct upload is not available; use POST /api/dashboard/media');
    }
    const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
    if (!body || body.type !== 'blob.generate-client-token') {
      throw DashboardError.validation('expected a client-token request');
    }
    const ctx = await userContext();
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const limits = await authorizeClientUpload(ctx, pathname);
        return {
          ...limits,
          addRandomSuffix: false,
          allowOverwrite: false,
          validUntil: Date.now() + 15 * 60 * 1000,
        };
      },
    });
    return json(result);
  });
}
