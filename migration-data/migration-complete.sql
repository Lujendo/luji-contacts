-- Insert users
INSERT OR REPLACE INTO users (id, username, email, password, role, contact_limit, is_email_enabled, created_at, updated_at) VALUES (1, 'admin', 'admin@luji-contacts.com', '$2b$10$JKbGQbRHRhJVq0Qm9hKqY.Sc9z5OLj1d7SkRnkA.j2D.3fCq0qyYe', 'admin', -1, 1, '2025-07-27T14:16:59.941Z', '2025-07-27T14:16:59.943Z');
INSERT OR REPLACE INTO users (id, username, email, password, role, contact_limit, is_email_enabled, created_at, updated_at) VALUES (2, 'demo_user', 'demo@luji-contacts.com', '$2b$10$JKbGQbRHRhJVq0Qm9hKqY.Sc9z5OLj1d7SkRnkA.j2D.3fCq0qyYe', 'user', 100, 0, '2025-07-27T14:16:59.943Z', '2025-07-27T14:16:59.943Z');

-- Insert contacts
INSERT OR REPLACE INTO contacts (id, user_id, first_name, last_name, email, phone, address_street, address_city, address_state, address_zip, address_country, birthday, website, facebook, twitter, linkedin, instagram, company, job_title, notes, profile_image_url, created_at, updated_at) VALUES (1, 1, 'John', 'Doe', 'john.doe@example.com', '+1-555-123-4567', '123 Main Street', 'San Francisco', 'CA', '94105', 'USA', NULL, 'https://johndoe.dev', NULL, NULL, 'https://linkedin.com/in/johndoe', NULL, 'Tech Corp', 'Software Engineer', 'Lead developer on the mobile app project', NULL, '2025-07-27T14:16:59.943Z', '2025-07-27T14:16:59.943Z');
INSERT OR REPLACE INTO contacts (id, user_id, first_name, last_name, email, phone, address_street, address_city, address_state, address_zip, address_country, birthday, website, facebook, twitter, linkedin, instagram, company, job_title, notes, profile_image_url, created_at, updated_at) VALUES (2, 1, 'Jane', 'Smith', 'jane.smith@example.com', '+1-555-987-6543', '456 Oak Avenue', 'New York', 'NY', '10001', 'USA', NULL, 'https://janesmith.design', NULL, NULL, NULL, NULL, 'Design Studio', 'UX Designer', 'Excellent designer, worked on our last three projects', NULL, '2025-07-27T14:16:59.943Z', '2025-07-27T14:16:59.943Z');
INSERT OR REPLACE INTO contacts (id, user_id, first_name, last_name, email, phone, address_street, address_city, address_state, address_zip, address_country, birthday, website, facebook, twitter, linkedin, instagram, company, job_title, notes, profile_image_url, created_at, updated_at) VALUES (3, 2, 'Mike', 'Johnson', 'mike@example.com', '+1-555-555-0123', NULL, 'Austin', 'TX', NULL, 'USA', NULL, NULL, NULL, NULL, NULL, NULL, 'Startup Inc', 'CEO', 'Potential business partner', NULL, '2025-07-27T14:16:59.943Z', '2025-07-27T14:16:59.943Z');

-- Insert groups
INSERT OR REPLACE INTO groups (id, user_id, name, description, created_at, updated_at) VALUES (1, 1, 'Work Colleagues', 'People I work with regularly', '2025-07-27T14:16:59.943Z', '2025-07-27T14:16:59.943Z');
INSERT OR REPLACE INTO groups (id, user_id, name, description, created_at, updated_at) VALUES (2, 1, 'Clients', 'Current and potential clients', '2025-07-27T14:16:59.943Z', '2025-07-27T14:16:59.943Z');
INSERT OR REPLACE INTO groups (id, user_id, name, description, created_at, updated_at) VALUES (3, 2, 'Business Network', 'Professional networking contacts', '2025-07-27T14:16:59.943Z', '2025-07-27T14:16:59.943Z');

-- Insert group-contact relationships
INSERT OR REPLACE INTO group_contacts (id, group_id, contact_id, created_at) VALUES (1, 1, 1, '2025-07-27T14:16:59.943Z');
INSERT OR REPLACE INTO group_contacts (id, group_id, contact_id, created_at) VALUES (2, 1, 2, '2025-07-27T14:16:59.943Z');
INSERT OR REPLACE INTO group_contacts (id, group_id, contact_id, created_at) VALUES (3, 3, 3, '2025-07-27T14:16:59.943Z');

-- Insert user preferences
INSERT OR REPLACE INTO user_preferences (id, user_id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_email, from_name, theme, language, timezone, created_at, updated_at) VALUES (1, 1, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'light', 'en', 'America/Los_Angeles', '2025-07-27T14:16:59.943Z', '2025-07-27T14:16:59.943Z');
INSERT OR REPLACE INTO user_preferences (id, user_id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_email, from_name, theme, language, timezone, created_at, updated_at) VALUES (2, 2, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'dark', 'en', 'America/Chicago', '2025-07-27T14:16:59.943Z', '2025-07-27T14:16:59.943Z');
