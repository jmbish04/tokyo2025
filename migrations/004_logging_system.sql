-- Migration 004: Comprehensive Logging System
-- Creates tables for application logs, API logs, and error tracking

-- Application logs table
CREATE TABLE IF NOT EXISTS app_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  level TEXT NOT NULL CHECK(level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  context TEXT, -- JSON string with additional context
  user_id TEXT DEFAULT 'anonymous',
  session_id TEXT,
  request_id TEXT,
  endpoint TEXT,
  method TEXT,
  status_code INTEGER,
  duration_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  error_stack TEXT,
  metadata TEXT -- JSON string for flexible data
);

-- API request logs
CREATE TABLE IF NOT EXISTS api_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT UNIQUE NOT NULL,
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT DEFAULT 'anonymous',
  request_body TEXT, -- Truncated for large bodies
  response_body TEXT, -- Truncated for large responses
  error_message TEXT,
  metadata TEXT -- JSON string
);

-- Error tracking
CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  endpoint TEXT,
  method TEXT,
  user_id TEXT DEFAULT 'anonymous',
  request_id TEXT,
  context TEXT, -- JSON string
  resolved BOOLEAN DEFAULT 0,
  resolved_at DATETIME,
  resolved_by TEXT
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT, -- ms, bytes, count, etc.
  endpoint TEXT,
  operation TEXT,
  metadata TEXT -- JSON string
);

-- AI interaction logs (for debugging AI responses)
CREATE TABLE IF NOT EXISTS ai_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  chat_id TEXT,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  duration_ms INTEGER,
  user_message TEXT,
  ai_response TEXT,
  tools_used TEXT, -- JSON array of tool names
  error_message TEXT,
  metadata TEXT -- JSON string
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_logs_timestamp ON app_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_endpoint ON app_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_app_logs_request_id ON app_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON api_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_logs_request_id ON api_logs(request_id);

CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_ai_logs_timestamp ON ai_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_chat_id ON ai_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_model ON ai_logs(model);
