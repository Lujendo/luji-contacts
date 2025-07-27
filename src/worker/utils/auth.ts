// Authentication utilities for Cloudflare Workers
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Context } from 'hono';
import { User } from './database';

export interface JWTPayload {
  id: number;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedContext extends Context {
  user: User;
}

export class AuthService {
  private jwtSecret: string;

  constructor(jwtSecret: string = 'default-secret') {
    this.jwtSecret = jwtSecret;
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, role: user.role },
      this.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    return { valid: true };
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

// Middleware factory for authentication
export function createAuthMiddleware(authService: AuthService, dbService: any) {
  return async (c: Context, next: () => Promise<void>) => {
    const authHeader = c.req.header('Authorization');
    const token = authService.extractTokenFromHeader(authHeader);

    if (!token) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    try {
      const user = await dbService.getUserById(payload.id);
      if (!user) {
        return c.json({ error: 'User not found' }, 401);
      }

      // Add user to context
      c.set('user', user);
      await next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return c.json({ error: 'Authentication failed' }, 500);
    }
  };
}

// Helper to get authenticated user from context
export function getAuthenticatedUser(c: Context): User {
  const user = c.get('user');
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
}

// Role-based access control middleware
export function requireRole(role: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = getAuthenticatedUser(c);
    
    if (user.role !== role && user.role !== 'admin') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    await next();
  };
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

// Add validatePassword method to AuthService class
declare module './auth' {
  interface AuthService {
    validatePassword(password: string): { valid: boolean; message?: string };
  }
}

export function validateRegistrationData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.message!);
    }
  }

  if (!data.username || data.username.trim().length < 2) {
    errors.push('Username must be at least 2 characters long');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
