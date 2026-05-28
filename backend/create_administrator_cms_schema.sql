-- Administrator Persona and Content Management System Database Schema
-- This script creates the necessary tables for the Administrator persona and CMS functionality

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Content Management System Tables

-- Content items with versioning support
CREATE TABLE IF NOT EXISTS cms_content (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'page', 'article', 'announcement', 'resource'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'review', 'published', 'archived'
    language VARCHAR(5) DEFAULT 'en', -- 'en', 'ar'
    content_data JSONB NOT NULL, -- Flexible content structure
    meta_data JSONB, -- SEO and additional metadata
    featured_image_id INTEGER,
    excerpt TEXT,
    tags TEXT[], -- Array of tags for categorization
    category VARCHAR(100),
    publish_date TIMESTAMP,
    expire_date TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content versions for revision history
CREATE TABLE IF NOT EXISTS cms_content_versions (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES cms_content(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_data JSONB NOT NULL,
    meta_data JSONB,
    change_summary TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, version_number)
);

-- Media assets with metadata
CREATE TABLE IF NOT EXISTS cms_media (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    cdn_url VARCHAR(500),
    alt_text VARCHAR(255),
    caption TEXT,
    description TEXT,
    tags TEXT[],
    dimensions JSONB, -- {width: 1920, height: 1080}
    is_public BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content and media relationships
CREATE TABLE IF NOT EXISTS cms_content_media (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES cms_content(id) ON DELETE CASCADE,
    media_id INTEGER REFERENCES cms_media(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'featured', 'gallery', 'attachment'
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, media_id, relationship_type)
);

-- Content categories and taxonomy
CREATE TABLE IF NOT EXISTS cms_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES cms_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Administrator Management Tables

-- System configuration settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json', 'array'
    category VARCHAR(50) NOT NULL, -- 'general', 'security', 'email', 'notifications'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Whether setting can be accessed by non-admins
    validation_rules JSONB, -- Validation rules for the setting
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail for administrative actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
    resource_type VARCHAR(50) NOT NULL, -- 'user', 'content', 'media', 'setting'
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System notifications and alerts
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    notification_type VARCHAR(50) NOT NULL, -- 'system', 'security', 'content', 'user'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    target_user_id UUID REFERENCES users(id), -- NULL for system-wide notifications
    action_url VARCHAR(500),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User management enhancements
CREATE TABLE IF NOT EXISTS admin_user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-based access control
CREATE TABLE IF NOT EXISTS admin_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL, -- Array of permission strings
    is_system_role BOOLEAN DEFAULT FALSE, -- Cannot be deleted if true
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User role assignments
CREATE TABLE IF NOT EXISTS admin_user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES admin_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- System monitoring and metrics
CREATE TABLE IF NOT EXISTS admin_system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit VARCHAR(20), -- 'count', 'percentage', 'bytes', 'seconds'
    metric_category VARCHAR(50) NOT NULL, -- 'performance', 'usage', 'security'
    tags JSONB, -- Additional metadata
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content workflow management
CREATE TABLE IF NOT EXISTS cms_workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    workflow_steps JSONB NOT NULL, -- Array of workflow step definitions
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content workflow instances
CREATE TABLE IF NOT EXISTS cms_content_workflows (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES cms_content(id) ON DELETE CASCADE,
    workflow_id INTEGER REFERENCES cms_workflows(id),
    current_step INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    assigned_to UUID REFERENCES users(id),
    comments TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_cms_content_status ON cms_content(status);
CREATE INDEX IF NOT EXISTS idx_cms_content_language ON cms_content(language);
CREATE INDEX IF NOT EXISTS idx_cms_content_created_at ON cms_content(created_at);
CREATE INDEX IF NOT EXISTS idx_cms_content_publish_date ON cms_content(publish_date);
CREATE INDEX IF NOT EXISTS idx_cms_content_category ON cms_content(category);
CREATE INDEX IF NOT EXISTS idx_cms_content_tags ON cms_content USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_cms_media_mime_type ON cms_media(mime_type);
CREATE INDEX IF NOT EXISTS idx_cms_media_uploaded_at ON cms_media(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_cms_media_tags ON cms_media USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user_id ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource_type ON admin_audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_target_user ON admin_notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_severity ON admin_notifications(severity);

CREATE INDEX IF NOT EXISTS idx_admin_user_sessions_user_id ON admin_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_sessions_token ON admin_user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_user_sessions_active ON admin_user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_system_metrics_name ON admin_system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_admin_system_metrics_category ON admin_system_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_admin_system_metrics_recorded_at ON admin_system_metrics(recorded_at);

-- Insert default system roles
INSERT INTO admin_roles (name, display_name, description, permissions, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', 
 '["*"]', TRUE),
('content_admin', 'Content Administrator', 'Full content management permissions',
 '["content.*", "media.*", "categories.*"]', TRUE),
('user_admin', 'User Administrator', 'User management permissions',
 '["users.*", "roles.*", "sessions.*"]', TRUE),
('content_editor', 'Content Editor', 'Content creation and editing permissions',
 '["content.create", "content.edit", "content.view", "media.upload", "media.view"]', TRUE),
('content_reviewer', 'Content Reviewer', 'Content review and approval permissions',
 '["content.view", "content.review", "content.approve", "workflows.*"]', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert default system settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('site_name', '"Emirati Journey Platform"', 'string', 'general', 'The name of the platform', TRUE),
('site_description', '"UAE Nationals Career Development Platform"', 'string', 'general', 'Platform description', TRUE),
('default_language', '"en"', 'string', 'general', 'Default platform language', TRUE),
('supported_languages', '["en", "ar"]', 'array', 'general', 'Supported platform languages', TRUE),
('max_file_upload_size', '52428800', 'number', 'general', 'Maximum file upload size in bytes (50MB)', FALSE),
('session_timeout', '3600', 'number', 'security', 'Session timeout in seconds', FALSE),
('password_min_length', '8', 'number', 'security', 'Minimum password length', FALSE),
('enable_2fa', 'true', 'boolean', 'security', 'Enable two-factor authentication', FALSE),
('content_auto_save_interval', '30', 'number', 'content', 'Auto-save interval in seconds', FALSE),
('content_revision_limit', '50', 'number', 'content', 'Maximum number of content revisions to keep', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_cms_content_updated_at BEFORE UPDATE ON cms_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON admin_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to log administrative actions
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO admin_audit_log (user_id, action, resource_type, resource_id, new_values)
        VALUES (NEW.created_by, 'create', TG_TABLE_NAME, NEW.id::text, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO admin_audit_log (user_id, action, resource_type, resource_id, old_values, new_values)
        VALUES (NEW.updated_by, 'update', TG_TABLE_NAME, NEW.id::text, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO admin_audit_log (user_id, action, resource_type, resource_id, old_values)
        VALUES (OLD.created_by, 'delete', TG_TABLE_NAME, OLD.id::text, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit triggers for important tables
CREATE TRIGGER audit_cms_content AFTER INSERT OR UPDATE OR DELETE ON cms_content
    FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER audit_admin_settings AFTER INSERT OR UPDATE OR DELETE ON admin_settings
    FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER audit_admin_roles AFTER INSERT OR UPDATE OR DELETE ON admin_roles
    FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO admin_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO admin_user;
