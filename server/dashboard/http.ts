/**
 * Thin HTTP helpers shared by every dashboard route handler.
 *
 * - `json` / `created` / `noContent` build typed JSON responses.
 * - `readJson` parses a request body, validating it against a zod schema and
 *   throwing a `DashboardError('VALIDATION')` on failure.
 * - `toHttpError` is the SINGLE place that maps every known error type
 *   (DashboardError, AuthError, OrderTransitionError, ZodError) to an HTTP
 *   status + stable body. Route handlers wrap their logic in `withErrors`.
 */
import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
import { AuthError } from '@/lib/auth';
import { OrderTransitionError } from '@/lib/orders/state-machine';
import { DashboardError, type DashboardErrorCode } from './errors';

export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

const STATUS_BY_CODE: Record<DashboardErrorCode, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  VALIDATION: 400,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL: 500,
};

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

/** Map any thrown error to a stable JSON HTTP response. */
export function toHttpError(err: unknown): NextResponse<ErrorBody> {
  if (err instanceof DashboardError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      { status: STATUS_BY_CODE[err.code] },
    );
  }
  if (err instanceof AuthError) {
    const status = err.code === 'UNAUTHENTICATED' ? 401 : 403;
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status });
  }
  if (err instanceof OrderTransitionError) {
    // INVALID_TRANSITION / FORBIDDEN_ACTOR → 409; MISSING_INPUT → 400.
    const status = err.code === 'MISSING_INPUT' ? 400 : 409;
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'invalid request body', details: err.flatten() } },
      { status: 400 },
    );
  }
  // Unknown / unexpected → 500, do NOT leak internals.
  console.error('[dashboard] unhandled error', err);
  return NextResponse.json(
    { error: { code: 'INTERNAL', message: 'internal server error' } },
    { status: 500 },
  );
}

/** Wrap a route handler body so any thrown domain error becomes a clean response. */
export async function withErrors(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    return toHttpError(err);
  }
}

/** Parse + validate a JSON request body, throwing VALIDATION on bad shape. */
export async function readJson<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw DashboardError.validation('request body must be valid JSON');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw DashboardError.validation('invalid request body', parsed.error.flatten());
  }
  return parsed.data;
}
