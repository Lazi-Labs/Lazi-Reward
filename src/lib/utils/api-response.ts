import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { ApiResponse } from '@/lib/types/rewards';

/**
 * Success response builder
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>
): ApiResponse<T> {
  return {
    data,
    error: null,
    ...(meta && { meta }),
  };
}

/**
 * Error response builder
 */
export function errorResponse(
  message: string,
  meta?: Record<string, unknown>
): ApiResponse<null> {
  return {
    data: null,
    error: message,
    ...(meta && { meta }),
  };
}

/**
 * Convert response to NextResponse with proper status codes
 */
export function toNextResponse<T>(
  response: ApiResponse<T>,
  statusCode: number = response.error ? 400 : 200
): NextResponse {
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle API error and return proper response
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (error instanceof AppError) {
    return toNextResponse(
      errorResponse(error.message, { code: error.code }),
      error.statusCode
    );
  }

  if (error instanceof Error) {
    return toNextResponse(
      errorResponse(error.message),
      500
    );
  }

  return toNextResponse(
    errorResponse('An unexpected error occurred'),
    500
  );
}
