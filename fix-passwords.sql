-- Update user passwords with correct hash
UPDATE users SET password = '$2b$10$bYWmz.yOn.lNMKJDfoUx/OTK1WgiECtvJTSLOX/nCvIIl0ZQF8nJi' WHERE username = 'admin';
UPDATE users SET password = '$2b$10$bYWmz.yOn.lNMKJDfoUx/OTK1WgiECtvJTSLOX/nCvIIl0ZQF8nJi' WHERE username = 'demo_user';