/**
 * Domain errors for the dashboard (user-side) backend.
 *
 * Services throw these; route handlers translate them to HTTP responses via
 * `toHttpError` in `server/dashboard/http.ts`. Keeping a small, explicit error
 * taxonomy (instead of leaking raw DB/zod errors) means callers get stable
 * status codes and machine-readable codes without detail leakage.
 */

export type DashboardErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'UNPROCESSABLE'
  | 'INTERNAL';

export class DashboardError extends Error {
  constructor(
    message: string,
    readonly code: DashboardErrorCode,
    /** Optional machine-readable details (e.g. zod issues, slot keys). */
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DashboardError';
  }

  static notFound(message = 'resource not found') {
    return new DashboardError(message, 'NOT_FOUND');
  }
  static forbidden(message = 'not permitted') {
    return new DashboardError(message, 'FORBIDDEN');
  }
  static validation(message: string, details?: unknown) {
    return new DashboardError(message, 'VALIDATION', details);
  }
  static conflict(message: string, details?: unknown) {
    return new DashboardError(message, 'CONFLICT', details);
  }
  static unprocessable(message: string, details?: unknown) {
    return new DashboardError(message, 'UNPROCESSABLE', details);
  }
}
