import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  InternalServerError,
} from './errors';

describe('AppError', () => {
  it('should create an error with all properties', () => {
    const error = new AppError(500, 'Test error', 'TEST_ERROR');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('AppError');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('TEST_ERROR');
  });

  it('should work without optional code', () => {
    const error = new AppError(400, 'Bad request');

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad request');
    expect(error.code).toBeUndefined();
  });

  it('should have proper stack trace', () => {
    const error = new AppError(500, 'Test error', 'TEST_ERROR');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });
});

describe('ValidationError', () => {
  it('should create error with message only', () => {
    const error = new ValidationError('Invalid input data');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid input data');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should include validation errors object', () => {
    const validationErrors = {
      email: ['Required', 'Invalid format'],
      name: ['Too long'],
    };
    const error = new ValidationError('Invalid data', validationErrors);

    expect(error.errors).toEqual(validationErrors);
  });

  it('should work without errors object', () => {
    const error = new ValidationError('Validation failed');

    expect(error.errors).toBeUndefined();
  });
});

describe('AuthenticationError', () => {
  it('should create error with default message', () => {
    const error = new AuthenticationError();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.name).toBe('AuthenticationError');
    expect(error.message).toBe('Unauthorized');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should create error with custom message', () => {
    const error = new AuthenticationError('Invalid credentials');

    expect(error.message).toBe('Invalid credentials');
    expect(error.statusCode).toBe(401);
  });
});

describe('AuthorizationError', () => {
  it('should create error with default message', () => {
    const error = new AuthorizationError();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.name).toBe('AuthorizationError');
    expect(error.message).toBe('Forbidden');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('AUTHORIZATION_ERROR');
  });

  it('should create error with custom message', () => {
    const error = new AuthorizationError('Insufficient permissions');

    expect(error.message).toBe('Insufficient permissions');
    expect(error.statusCode).toBe(403);
  });

  it('should distinguish from authentication error', () => {
    const authNError = new AuthenticationError();
    const authZError = new AuthorizationError();

    expect(authNError.statusCode).toBe(401);
    expect(authZError.statusCode).toBe(403);
    expect(authNError.code).toBe('AUTHENTICATION_ERROR');
    expect(authZError.code).toBe('AUTHORIZATION_ERROR');
  });
});

describe('NotFoundError', () => {
  it('should create error with default message', () => {
    const error = new NotFoundError();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.name).toBe('NotFoundError');
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should create error with custom message', () => {
    const error = new NotFoundError('User not found');

    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
  });
});

describe('ConflictError', () => {
  it('should create error with default message', () => {
    const error = new ConflictError();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ConflictError);
    expect(error.name).toBe('ConflictError');
    expect(error.message).toBe('Conflict');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });

  it('should create error with custom message', () => {
    const error = new ConflictError('Email already exists');

    expect(error.message).toBe('Email already exists');
    expect(error.statusCode).toBe(409);
  });
});

describe('DatabaseError', () => {
  it('should create error with default message', () => {
    const error = new DatabaseError();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.name).toBe('DatabaseError');
    expect(error.message).toBe('Database error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('DATABASE_ERROR');
  });

  it('should create error with custom message', () => {
    const error = new DatabaseError('Connection timeout');

    expect(error.message).toBe('Connection timeout');
    expect(error.statusCode).toBe(500);
  });

  it('should wrap original database error', () => {
    const dbError = new Error('ECONNREFUSED');
    const error = new DatabaseError('Failed to connect to database', dbError);

    expect(error.originalError).toBe(dbError);
    expect(error.message).toBe('Failed to connect to database');
  });
});

describe('InternalServerError', () => {
  it('should create error with default message', () => {
    const error = new InternalServerError();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(InternalServerError);
    expect(error.name).toBe('InternalServerError');
    expect(error.message).toBe('Internal server error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
  });

  it('should create error with custom message', () => {
    const error = new InternalServerError('Unexpected error occurred');

    expect(error.message).toBe('Unexpected error occurred');
    expect(error.statusCode).toBe(500);
  });

  it('should wrap unknown errors', () => {
    const unknownError = new Error('Something went wrong');
    const error = new InternalServerError('Server error', unknownError);

    expect(error.originalError).toBe(unknownError);
  });
});

describe('Error inheritance chain', () => {
  it('should maintain proper inheritance', () => {
    const validationError = new ValidationError('test');
    const authError = new AuthenticationError();
    const notFoundError = new NotFoundError();

    expect(validationError).toBeInstanceOf(Error);
    expect(validationError).toBeInstanceOf(AppError);
    expect(validationError).toBeInstanceOf(ValidationError);

    expect(authError).toBeInstanceOf(Error);
    expect(authError).toBeInstanceOf(AppError);
    expect(authError).toBeInstanceOf(AuthenticationError);

    expect(notFoundError).toBeInstanceOf(Error);
    expect(notFoundError).toBeInstanceOf(AppError);
    expect(notFoundError).toBeInstanceOf(NotFoundError);
  });

  it('should allow instanceof checks for type narrowing', () => {
    const error: Error = new ValidationError('test');

    if (error instanceof AppError) {
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    } else {
      throw new Error('Should be AppError instance');
    }
  });
});

describe('Edge cases', () => {
  it('should handle empty string message', () => {
    const error = new AppError(500, '');

    expect(error.message).toBe('');
  });

  it('should handle very long messages', () => {
    const longMessage = 'A'.repeat(1000);
    const error = new AppError(500, longMessage, 'LONG');

    expect(error.message).toBe(longMessage);
    expect(error.message.length).toBe(1000);
  });

  it('should handle special characters in messages', () => {
    const message = 'Error with "quotes", \'apostrophes\', and <html>';
    const error = new AppError(500, message, 'SPECIAL');

    expect(error.message).toBe(message);
  });

  it('should handle boundary status codes', () => {
    const error400 = new AppError(400, 'Bad Request', 'BAD_REQUEST');
    const error500 = new AppError(500, 'Server Error', 'SERVER_ERROR');
    const error599 = new AppError(599, 'Network Error', 'NETWORK_ERROR');

    expect(error400.statusCode).toBe(400);
    expect(error500.statusCode).toBe(500);
    expect(error599.statusCode).toBe(599);
  });
});
