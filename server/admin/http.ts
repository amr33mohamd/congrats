/**
 * Admin HTTP helpers — shared JSON responses + a single error-to-response mapper
 * so every admin route handler stays a thin, consistent wrapper around a service.
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from '@/lib/auth';
import { OrderTransitionError } from '@/lib/orders/state-machine';

/** Service-level error with an explicit HTTP status (used for 404/409/422 etc.). */
export class ServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const notFound = (msg = 'not found') => new ServiceError(msg, 404, 'NOT_FOUND');
export const conflict = (msg: string) => new ServiceError(msg, 409, 'CONFLICT');
export const badRequest = (msg: string) => new ServiceError(msg, 400, 'BAD_REQUEST');
export const unprocessable = (msg: string) => new ServiceError(msg, 422, 'UNPROCESSABLE');

export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Map any thrown error to a JSON NextResponse with the right status code.
 * Keeps validation/auth/state-machine errors out of the generic 500 bucket.
 */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ServiceError) {
    return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', issues: err.flatten() },
      { status: 422 },
    );
  }
  if (err instanceof AuthError) {
    const status = err.code === 'UNAUTHENTICATED' ? 401 : 403;
    return NextResponse.json({ error: err.code, message: err.message }, { status });
  }
  if (err instanceof OrderTransitionError) {
    // INVALID_TRANSITION → 409 (state conflict); others → 400/422.
    const status =
      err.code === 'INVALID_TRANSITION' ? 409 : err.code === 'FORBIDDEN_ACTOR' ? 403 : 422;
    return NextResponse.json({ error: err.code, message: err.message }, { status });
  }
  console.error('[admin] unhandled error:', err);
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
}

/** Run an async handler body and convert thrown errors into JSON responses. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    return errorResponse(err);
  }
}

/** Parse a NextRequest JSON body, mapping malformed bodies to a 400. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw badRequest('invalid JSON body');
  }
}
