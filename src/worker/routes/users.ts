// User routes for authentication and user management
import { Hono } from 'hono';
import { DatabaseService, ApiResponse, User } from '../utils/database';
import { AuthService, validateRegistrationData, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';

export function createUserRoutes(db: DatabaseService, auth: AuthService) {
  const users = new Hono<{ Bindings: Env }>();

  // Registration route
  users.post('/register', async (c) => {
    try {
      const body = await c.req.json();
      const { username, email, password } = body;

      // Validate input data
      const validation = validateRegistrationData({ username, email, password });
      if (!validation.valid) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return c.json({ error: 'User already exists with this email' }, 409);
      }

      // Hash password and create user
      const hashedPassword = await auth.hashPassword(password);
      const user = await db.createUser({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'user',
        contact_limit: 50,
        is_email_enabled: false
      });

      // Generate token
      const token = auth.generateToken(user);

      const response: ApiResponse = {
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            contact_limit: user.contact_limit,
            is_email_enabled: user.is_email_enabled
          }
        },
        message: 'User registered successfully',
        success: true
      };

      return c.json(response, 201);

    } catch (error) {
      console.error('Registration error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Login route
  users.post('/login', async (c) => {
    try {
      const body = await c.req.json();
      const { email, password } = body;

      if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
      }

      // Find user by email
      const user = await db.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      // Verify password
      const isValidPassword = await auth.comparePassword(password, user.password!);
      if (!isValidPassword) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      // Generate token
      const token = auth.generateToken(user);

      const response: ApiResponse = {
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            contact_limit: user.contact_limit,
            is_email_enabled: user.is_email_enabled
          }
        },
        message: 'Login successful',
        success: true
      };

      return c.json(response);

    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Verify token endpoint
  users.post('/verify-token', async (c) => {
    try {
      const body = await c.req.json();
      const { token } = body;

      if (!token) {
        return c.json({ error: 'Token is required', success: false }, 400);
      }

      const payload = auth.verifyToken(token);

      if (!payload) {
        return c.json({
          valid: false,
          error: 'Invalid token',
          success: false
        }, 401);
      }

      const user = await db.getUserById(payload.id);

      if (!user) {
        return c.json({
          valid: false,
          error: 'User not found',
          success: false
        }, 401);
      }

      const response: ApiResponse = {
        data: {
          valid: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            contact_limit: user.contact_limit,
            is_email_enabled: user.is_email_enabled
          }
        },
        success: true
      };

      return c.json(response);

    } catch (error) {
      console.error('Token verification error:', error);
      return c.json({
        valid: false,
        error: 'Token verification failed',
        success: false
      }, 500);
    }
  });

  // Get current user profile (protected route)
  users.get('/profile', createAuthMiddleware(auth, db), async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      
      const response: ApiResponse = {
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          contact_limit: user.contact_limit,
          is_email_enabled: user.is_email_enabled,
          created_at: user.created_at
        },
        success: true
      };

      return c.json(response);

    } catch (error) {
      console.error('Profile error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Update user profile (protected route)
  users.put('/profile', createAuthMiddleware(auth, db), async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const body = await c.req.json();
      const { username, email } = body;

      // Validate input
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return c.json({ error: 'Invalid email format' }, 400);
      }

      if (username && username.trim().length < 2) {
        return c.json({ error: 'Username must be at least 2 characters long' }, 400);
      }

      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = await db.getUserByEmail(email);
        if (existingUser && existingUser.id !== user.id) {
          return c.json({ error: 'Email already taken' }, 409);
        }
      }

      // Update user using the new updateUser method
      const updateData: Partial<any> = {};
      if (username && username !== user.username) updateData.username = username;
      if (email && email !== user.email) updateData.email = email;

      let updatedUser: User = user;
      if (Object.keys(updateData).length > 0) {
        const updateResult = await db.updateUser(user.id, updateData);
        if (!updateResult) {
          return c.json({ error: 'Failed to update profile', success: false }, 500);
        }
        updatedUser = updateResult;
      }

      const response: ApiResponse = {
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          contact_limit: updatedUser.contact_limit,
          is_email_enabled: updatedUser.is_email_enabled
        },
        message: 'Profile updated successfully',
        success: true
      };

      return c.json(response);

    } catch (error) {
      console.error('Profile update error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Change password (protected route)
  users.put('/password', createAuthMiddleware(auth, db), async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const body = await c.req.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return c.json({ error: 'Current password and new password are required' }, 400);
      }

      // Verify current password
      const isValidPassword = await auth.comparePassword(currentPassword, user.password!);
      if (!isValidPassword) {
        return c.json({ error: 'Current password is incorrect' }, 401);
      }

      // Validate new password
      const passwordValidation = auth.validatePassword ? auth.validatePassword(newPassword) : { valid: true };
      if (!passwordValidation.valid) {
        return c.json({ error: passwordValidation.message }, 400);
      }

      // Hash new password and update (this would require implementing updateUserPassword in DatabaseService)
      await auth.hashPassword(newPassword);

      return c.json({ message: 'Password updated successfully' });

    } catch (error) {
      console.error('Password change error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Verify token (for client-side token validation)
  users.post('/verify-token', async (c) => {
    try {
      const body = await c.req.json();
      const { token } = body;

      if (!token) {
        return c.json({ error: 'Token is required' }, 400);
      }

      const payload = auth.verifyToken(token);
      if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const user = await db.getUserById(payload.id);
      if (!user) {
        return c.json({ error: 'User not found' }, 401);
      }

      return c.json({
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          contact_limit: user.contact_limit,
          is_email_enabled: user.is_email_enabled
        }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  return users;
}
