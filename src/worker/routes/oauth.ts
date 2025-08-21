import { Hono } from 'hono';
import { DatabaseService, ErrorHandler } from '../utils/database';
import { AuthService, getAuthenticatedUser, createAuthMiddleware } from '../utils/auth';

export function createOAuthRoutes(db: DatabaseService, auth: AuthService) {
  const app = new Hono<{ Bindings: Env }>();

  // Auth middleware
  app.use('*', createAuthMiddleware(auth, db));

  // Start Google OAuth (authorization request)
  app.get('/google/authorize', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const clientId = (c.env as any).GOOGLE_CLIENT_ID as string;
      const configuredRedirect = (c.env as any).GOOGLE_REDIRECT_URI as string | undefined;
      const accountId = c.req.query('accountId') || '';
      const returnUrl = c.req.query('returnUrl') || '';
      const manual = c.req.query('manual');

      const origin = new URL(c.req.url).origin;
      const redirectUri = configuredRedirect || `${origin}/api/oauth/google/callback`;
      const scope = encodeURIComponent('https://mail.google.com/');
      const statePayload = { u: user.id, a: accountId, r: returnUrl, t: Date.now() };
      const state = btoa(JSON.stringify(statePayload));

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

      if (manual) {
        return c.json({ authUrl, state });
      }
      return c.redirect(authUrl);
    } catch (error) {
      console.error('Failed to start OAuth', error);
      return c.json({ error: 'Failed to start OAuth' }, 500);
    }
  });

  // Google OAuth callback: exchange code for tokens and store for the account
  app.get('/google/callback', async (c) => {
    try {
      const url = new URL(c.req.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (!code) return c.json({ error: 'Missing code' }, 400);
      if (!state) return c.json({ error: 'Missing state' }, 400);

      const stateObj = JSON.parse(atob(state));
      const accountId = stateObj.a as string | undefined;
      const userId = stateObj.u as number | undefined;
      const returnUrl = stateObj.r as string | undefined;

      if (!accountId || !userId) return c.json({ error: 'Invalid state' }, 400);

      // Verify account ownership
      const accountRow = await c.env.DB.prepare(`
        SELECT * FROM email_accounts WHERE id = ? AND user_id = ?
      `).bind(accountId, userId).first();
      if (!accountRow) {
        return c.json({ error: 'Account not found or not owned by user' }, 404);
      }

      const clientId = (c.env as any).GOOGLE_CLIENT_ID as string;
      const clientSecret = (c.env as any).GOOGLE_CLIENT_SECRET as string;
      const configuredRedirect = (c.env as any).GOOGLE_REDIRECT_URI as string | undefined;
      const origin = new URL(c.req.url).origin;
      const redirectUri = configuredRedirect || `${origin}/api/oauth/google/callback`;

      // Exchange code for tokens
      const body = new URLSearchParams();
      body.set('code', code);
      body.set('client_id', clientId);
      body.set('client_secret', clientSecret);
      body.set('redirect_uri', redirectUri);
      body.set('grant_type', 'authorization_code');

      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });

      if (!tokenResp.ok) {
        const errText = await tokenResp.text();
        console.error('Token exchange failed:', errText);
        return c.json({ error: 'Token exchange failed', details: errText }, 400);
      }

      const tokenData = await tokenResp.json() as {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
        scope?: string;
        token_type?: string;
        id_token?: string;
      };

      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 0) * 1000).toISOString();

      // Save tokens
      await c.env.DB.prepare(`
        UPDATE email_accounts SET
          incoming_auth_method = 'oauth2',
          incoming_oauth_provider = 'google',
          incoming_oauth_access_token = ?,
          incoming_oauth_refresh_token = COALESCE(?, incoming_oauth_refresh_token),
          incoming_oauth_expires_at = ?,
          incoming_oauth_scope = ?,
          incoming_oauth_token_type = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `).bind(
        tokenData.access_token,
        tokenData.refresh_token || null,
        expiresAt,
        tokenData.scope || null,
        tokenData.token_type || 'Bearer',
        accountId,
        userId
      ).run();

      // Redirect back to the app
      const dest = returnUrl || '/';
      return new Response(null, { status: 302, headers: { Location: dest } });
    } catch (error) {
      console.error('OAuth callback error:', error);
      return c.json({ error: 'OAuth callback failed' }, 500);
    }
  });

  // Save incoming OAuth tokens for an email account (e.g., Gmail IMAP XOAUTH2)
  app.post('/tokens/:accountId', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const accountId = c.req.param('accountId');
      const body = await c.req.json<{ provider: string; access_token: string; refresh_token?: string; expires_at?: string; scope?: string; token_type?: string }>();

      if (!body.provider || !body.access_token) {
        const { response, status } = ErrorHandler.validationError('provider and access_token are required');
        return c.json(response, status);
      }

      // Verify account ownership
      const accountRow = await c.env.DB.prepare(`
        SELECT * FROM email_accounts WHERE id = ? AND user_id = ?
      `).bind(accountId, user.id).first();

      if (!accountRow) {
        const { response, status } = ErrorHandler.notFoundError('Account not found');
        return c.json(response, status);
      }

      // Update OAuth columns and set auth method to oauth2
      await c.env.DB.prepare(`
        UPDATE email_accounts SET 
          incoming_auth_method = 'oauth2',
          incoming_oauth_provider = ?,
          incoming_oauth_access_token = ?,
          incoming_oauth_refresh_token = ?,
          incoming_oauth_expires_at = ?,
          incoming_oauth_scope = ?,
          incoming_oauth_token_type = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `).bind(
        body.provider,
        body.access_token,
        body.refresh_token || null,
        body.expires_at || null,
        body.scope || null,
        body.token_type || 'Bearer',
        accountId,
        user.id
      ).run();

      return c.json({ success: true });
    } catch (error) {
      console.error('OAuth token save error:', error);
      const { response, status } = ErrorHandler.internalError('Failed to save OAuth tokens');
      return c.json(response, status);
    }
  });

  // Minimal endpoint to clear tokens and revert to plain auth
  app.post('/tokens/:accountId/clear', async (c) => {
    try {
      const user = getAuthenticatedUser(c);
      const accountId = c.req.param('accountId');

      await c.env.DB.prepare(`
        UPDATE email_accounts SET 
          incoming_auth_method = 'plain',
          incoming_oauth_provider = NULL,
          incoming_oauth_access_token = NULL,
          incoming_oauth_refresh_token = NULL,
          incoming_oauth_expires_at = NULL,
          incoming_oauth_scope = NULL,
          incoming_oauth_token_type = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `).bind(accountId, user.id).run();

      return c.json({ success: true });
    } catch (error) {
      console.error('OAuth token clear error:', error);
      const { response, status } = ErrorHandler.internalError('Failed to clear OAuth tokens');
      return c.json(response, status);
    }
  });

  return app;
}

