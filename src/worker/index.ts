import { Hono } from "hono";
import { cors } from 'hono/cors';
import { DatabaseService } from './utils/database';
import { AuthService } from './utils/auth';
import { StorageService } from './utils/storage';
import { DatabaseMigrations } from './utils/migrations';
import { createUserRoutes } from './routes/users';
import { createContactRoutes } from './routes/contacts';
import { createGroupRoutes } from './routes/groups';
import { createImportExportRoutes } from './routes/import-export';
import { createEmailRoutes } from './routes/emails';
import { createEmailAccountRoutes } from './routes/emailAccounts';
import { createRobustEmailRoutes } from './routes/robustEmails';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://luji-contacts.info-eac.workers.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check endpoint
app.get("/api/health", (c) => c.json({
  status: "ok",
  timestamp: new Date().toISOString(),
  service: "luji-contacts"
}));

// Manual migration endpoint
app.post("/api/migrate", async (c) => {
  try {
    const migrations = new DatabaseMigrations(c.env.DB);
    await migrations.runMigrations();

    const hasNickname = await migrations.checkNicknameColumn();

    return c.json({
      status: "success",
      message: "Migrations completed",
      nickname_column_exists: hasNickname,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Migration error:', error);
    return c.json({
      status: "error",
      message: "Migration failed",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Initialize services and mount routes
app.all('/api/*', async (c) => {
  // Initialize services
  const db = new DatabaseService(c.env.DB);
  const auth = new AuthService(c.env.JWT_SECRET || 'default-secret-key');
  const storage = new StorageService(c.env.STORAGE);

  // Run database migrations on first request
  try {
    const migrations = new DatabaseMigrations(c.env.DB);
    await migrations.runMigrations();
  } catch (error) {
    console.error('Migration error:', error);
    // Continue anyway - migrations are not critical for basic functionality
  }

  // Route to appropriate handler
  const path = c.req.path;

  if (path.startsWith('/api/users')) {
    const userRoutes = createUserRoutes(db, auth);
    const newReq = new Request(c.req.raw.url.replace('/api/users', ''), c.req.raw);
    return userRoutes.fetch(newReq, c.env, c.executionCtx);
  }

  if (path.startsWith('/api/contacts')) {
    const contactRoutes = createContactRoutes(db, auth, storage);
    const newReq = new Request(c.req.raw.url.replace('/api/contacts', ''), c.req.raw);
    return contactRoutes.fetch(newReq, c.env, c.executionCtx);
  }

  if (path.startsWith('/api/groups')) {
    const groupRoutes = createGroupRoutes(db, auth);
    const newReq = new Request(c.req.raw.url.replace('/api/groups', ''), c.req.raw);
    return groupRoutes.fetch(newReq, c.env, c.executionCtx);
  }

  if (path.startsWith('/api/import-export')) {
    const importExportRoutes = createImportExportRoutes(db, auth, storage);
    const newReq = new Request(c.req.raw.url.replace('/api/import-export', ''), c.req.raw);
    return importExportRoutes.fetch(newReq, c.env, c.executionCtx);
  }

  if (path.startsWith('/api/emails')) {
    const emailRoutes = createEmailRoutes(db, auth);
    const newReq = new Request(c.req.raw.url.replace('/api/emails', ''), c.req.raw);
    return emailRoutes.fetch(newReq, c.env, c.executionCtx);
  }

  if (path.startsWith('/api/email-accounts')) {
    const emailAccountRoutes = createEmailAccountRoutes(db, auth);
    const newReq = new Request(c.req.raw.url.replace('/api/email-accounts', ''), c.req.raw);
    return emailAccountRoutes.fetch(newReq, c.env, c.executionCtx);
  }

  if (path.startsWith('/api/robust-emails')) {
    const robustEmailRoutes = createRobustEmailRoutes(db, auth);
    const newReq = new Request(c.req.raw.url.replace('/api/robust-emails', ''), c.req.raw);
    return robustEmailRoutes.fetch(newReq, c.env, c.executionCtx);
  }

  if (path.startsWith('/api/files/')) {
    try {
      const filePath = path.replace('/api/files/', '');

      const object = await storage.getFileMetadata(filePath);
      if (!object) {
        return c.json({ error: 'File not found' }, 404);
      }

      const blob = await storage.getFileBlob(filePath);

      return new Response(blob, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      });
    } catch (error) {
      console.error('File serving error:', error);
      return c.json({ error: 'File not found' }, 404);
    }
  }

  return c.json({ error: 'API endpoint not found' }, 404);
});

// 404 handler for API routes
app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'API endpoint not found' }, 404);
  }
  // Let other routes (static files) be handled by the assets
  return c.notFound();
});

// Error handler
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
