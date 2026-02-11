import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import {
  successResponse,
  errorResponse,
  toNextResponse,
  handleApiError,
} from './api-response';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  DatabaseError,
} from './errors';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      body,
      status: init?.status || 200,
      headers: init?.headers || {},
    })),
  },
}));

describe('successResponse', () => {
  it('should create success response with data only', () => {
    const data = { id: 1, name: 'Test' };
    const response = successResponse(data);

    expect(response.data).toEqual(data);
    expect(response.error).toBeNull();
  });

  it('should create success response with data and meta', () => {
    const data = { id: 1, name: 'Test' };
    const meta = { page: 1, total: 100 };
    const response = successResponse(data, meta);

    expect(response.data).toEqual(data);
    expect(response.error).toBeNull();
    expect(response.meta).toEqual(meta);
  });

  it('should handle null data', () => {
    const response = successResponse(null);

    expect(response.data).toBeNull();
    expect(response.error).toBeNull();
  });

  it('should handle empty object data', () => {
    const response = successResponse({});

    expect(response.data).toEqual({});
    expect(response.error).toBeNull();
  });

  it('should handle array data', () => {
    const data = [1, 2, 3, 4, 5];
    const response = successResponse(data);

    expect(response.data).toEqual(data);
    expect(response.error).toBeNull();
  });

  it('should handle complex nested data', () => {
    const data = {
      user: { id: 1, profile: { name: 'Test' } },
      settings: { theme: 'dark' },
    };
    const response = successResponse(data);

    expect(response.data).toEqual(data);
  });
});

describe('errorResponse', () => {
  it('should create error response with message only', () => {
    const response = errorResponse('Something went wrong');

    expect(response.data).toBeNull();
    expect(response.error).toBe('Something went wrong');
  });

  it('should create error response with message and meta', () => {
    const meta = { timestamp: '2024-01-01T00:00:00Z' };
    const response = errorResponse('Error occurred', meta);

    expect(response.data).toBeNull();
    expect(response.error).toBe('Error occurred');
    expect(response.meta).toEqual(meta);
  });

  it('should handle empty error message', () => {
    const response = errorResponse('');

    expect(response.data).toBeNull();
    expect(response.error).toBe('');
  });
});

describe('toNextResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create NextResponse for success with default status 200', () => {
    const apiResponse = successResponse({ id: 1 });
    const nextResponse = toNextResponse(apiResponse);

    expect(NextResponse.json).toHaveBeenCalledWith(apiResponse, { status: 200 });
    expect(nextResponse.status).toBe(200);
  });

  it('should create NextResponse for success with custom status', () => {
    const apiResponse = successResponse({ id: 1 });
    const nextResponse = toNextResponse(apiResponse, 201);

    expect(NextResponse.json).toHaveBeenCalledWith(apiResponse, { status: 201 });
    expect(nextResponse.status).toBe(201);
  });

  it('should default to 400 for error responses', () => {
    const apiResponse = errorResponse('Error occurred');
    const nextResponse = toNextResponse(apiResponse);

    expect(NextResponse.json).toHaveBeenCalledWith(apiResponse, { status: 400 });
    expect(nextResponse.status).toBe(400);
  });

  it('should use custom status for error responses', () => {
    const apiResponse = errorResponse('Not found');
    const nextResponse = toNextResponse(apiResponse, 404);

    expect(NextResponse.json).toHaveBeenCalledWith(apiResponse, { status: 404 });
    expect(nextResponse.status).toBe(404);
  });

  it('should handle 204 No Content status', () => {
    const apiResponse = successResponse(null);
    toNextResponse(apiResponse, 204);

    expect(NextResponse.json).toHaveBeenCalledWith(apiResponse, { status: 204 });
  });

  it('should handle various HTTP status codes', () => {
    const testCases = [200, 201, 400, 401, 403, 404, 409, 500];

    testCases.forEach((status) => {
      vi.clearAllMocks();
      const apiResponse = successResponse({});
      toNextResponse(apiResponse, status);

      expect(NextResponse.json).toHaveBeenCalledWith(apiResponse, { status });
    });
  });
});

describe('handleApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle AppError', () => {
    const error = new AppError(418, 'I am a teapot', 'TEAPOT');
    const response = handleApiError(error);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        error: 'I am a teapot',
      }),
      { status: 418 }
    );
    expect(response.status).toBe(418);
  });

  it('should handle ValidationError', () => {
    const error = new ValidationError('Validation failed');
    const response = handleApiError(error);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        error: 'Validation failed',
      }),
      { status: 400 }
    );
    expect(response.status).toBe(400);
  });

  it('should handle AuthenticationError', () => {
    const error = new AuthenticationError('Invalid token');
    const response = handleApiError(error);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        error: 'Invalid token',
      }),
      { status: 401 }
    );
    expect(response.status).toBe(401);
  });

  it('should handle NotFoundError', () => {
    const error = new NotFoundError('User not found');
    const response = handleApiError(error);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        error: 'User not found',
      }),
      { status: 404 }
    );
    expect(response.status).toBe(404);
  });

  it('should handle DatabaseError', () => {
    const error = new DatabaseError('Connection failed');
    const response = handleApiError(error);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        error: 'Connection failed',
      }),
      { status: 500 }
    );
    expect(response.status).toBe(500);
  });

  it('should handle standard Error', () => {
    const error = new Error('Standard error message');
    const response = handleApiError(error);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        error: 'Standard error message',
      }),
      { status: 500 }
    );
    expect(response.status).toBe(500);
  });

  it('should handle unknown error type (string)', () => {
    const error = 'string error';
    const response = handleApiError(error);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        error: 'An unexpected error occurred',
      }),
      { status: 500 }
    );
    expect(response.status).toBe(500);
  });

  it('should handle null error', () => {
    handleApiError(null);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        error: 'An unexpected error occurred',
      }),
      { status: 500 }
    );
  });

  it('should handle undefined error', () => {
    handleApiError(undefined);

    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: null,
        error: 'An unexpected error occurred',
      }),
      { status: 500 }
    );
  });

  it('should log errors to console', () => {
    const error = new Error('Test error');
    handleApiError(error);

    expect(console.error).toHaveBeenCalledWith('[API Error]', error);
  });
});

describe('API response integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete success flow', () => {
    const data = { id: 1, points: 100 };
    const meta = { timestamp: Date.now() };

    const apiResponse = successResponse(data, meta);
    const nextResponse = toNextResponse(apiResponse, 200);

    expect(apiResponse.error).toBeNull();
    expect(apiResponse.data).toEqual(data);
    expect(apiResponse.meta).toEqual(meta);
    expect(nextResponse.status).toBe(200);
  });

  it('should handle pagination metadata', () => {
    const data = { items: [1, 2, 3] };
    const meta = {
      pagination: {
        page: 1,
        perPage: 10,
        total: 100,
        totalPages: 10,
      },
    };

    const apiResponse = successResponse(data, meta);
    const nextResponse = toNextResponse(apiResponse);

    expect(apiResponse.meta).toEqual(meta);
    expect(nextResponse.status).toBe(200);
  });

  it('should handle empty result sets', () => {
    const data = { items: [] };
    const meta = { pagination: { page: 1, total: 0 } };

    const apiResponse = successResponse(data, meta);

    expect(apiResponse.data?.items).toHaveLength(0);
    expect((apiResponse.meta?.pagination as { total: number })?.total).toBe(0);
  });
});

describe('Edge cases', () => {
  it('should handle very large data objects', () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      value: `item-${i}`,
    }));

    const response = successResponse(largeData);

    expect(response.data).toHaveLength(1000);
  });

  it('should handle special characters in error messages', () => {
    const message = 'Error with "quotes", \'apostrophes\', and <html>';
    const response = errorResponse(message);

    expect(response.error).toBe(message);
  });

  it('should handle unicode in responses', () => {
    const data = { message: '你好世界 🌍' };
    const response = successResponse(data);

    expect(response.data?.message).toBe('你好世界 🌍');
  });
});
