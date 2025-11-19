/**
 * Comprehensive D1 Logging System
 * Logs all application events, API calls, errors, and AI interactions to D1
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  ipAddress?: string;
  userAgent?: string;
  errorStack?: string;
  metadata?: Record<string, any>;
}

export interface APILogData {
  requestId: string;
  method: string;
  endpoint: string;
  statusCode?: number;
  durationMs?: number;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  requestBody?: string;
  responseBody?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLogData {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  endpoint?: string;
  method?: string;
  userId?: string;
  requestId?: string;
  context?: Record<string, any>;
}

export interface PerformanceMetric {
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  endpoint?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface AILogData {
  chatId?: string;
  model: string;
  provider: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  userMessage?: string;
  aiResponse?: string;
  toolsUsed?: string[];
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Main Logger class
 */
export class Logger {
  private db: D1Database;
  private context: LogContext;

  constructor(db: D1Database, context: LogContext = {}) {
    this.db = db;
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(this.db, { ...this.context, ...additionalContext });
  }

  /**
   * Log a message with specified level
   */
  async log(level: LogLevel, message: string, additionalContext?: LogContext): Promise<void> {
    const context = { ...this.context, ...additionalContext };

    try {
      await this.db
        .prepare(
          `INSERT INTO app_logs (
            level, message, context, user_id, session_id, request_id,
            endpoint, method, status_code, duration_ms, ip_address,
            user_agent, error_stack, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          level,
          message,
          context ? JSON.stringify(context) : null,
          context.userId || 'anonymous',
          context.sessionId || null,
          context.requestId || null,
          context.endpoint || null,
          context.method || null,
          context.statusCode || null,
          context.durationMs || null,
          context.ipAddress || null,
          context.userAgent || null,
          context.errorStack || null,
          context.metadata ? JSON.stringify(context.metadata) : null
        )
        .run();

      // Also log to console for real-time debugging
      console.log(`[${level.toUpperCase()}]`, message, context);
    } catch (err) {
      // Fallback to console if D1 logging fails
      console.error('[LOGGER ERROR]', 'Failed to write to D1:', err);
      console.log(`[${level.toUpperCase()}]`, message, context);
    }
  }

  debug(message: string, context?: LogContext): Promise<void> {
    return this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): Promise<void> {
    return this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): Promise<void> {
    return this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): Promise<void> {
    return this.log('error', message, context);
  }

  fatal(message: string, context?: LogContext): Promise<void> {
    return this.log('fatal', message, context);
  }

  /**
   * Log API request/response
   */
  async logAPI(data: APILogData): Promise<void> {
    try {
      // Truncate large bodies
      const truncateBody = (body: string | undefined, maxLength = 5000) => {
        if (!body) return null;
        return body.length > maxLength ? body.substring(0, maxLength) + '...[truncated]' : body;
      };

      await this.db
        .prepare(
          `INSERT INTO api_logs (
            request_id, method, endpoint, status_code, duration_ms,
            ip_address, user_agent, user_id, request_body, response_body,
            error_message, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          data.requestId,
          data.method,
          data.endpoint,
          data.statusCode || null,
          data.durationMs || null,
          data.ipAddress || null,
          data.userAgent || null,
          data.userId || 'anonymous',
          truncateBody(data.requestBody),
          truncateBody(data.responseBody),
          data.errorMessage || null,
          data.metadata ? JSON.stringify(data.metadata) : null
        )
        .run();

      console.log('[API]', data.method, data.endpoint, data.statusCode, `${data.durationMs}ms`);
    } catch (err) {
      console.error('[LOGGER ERROR]', 'Failed to log API:', err);
    }
  }

  /**
   * Log error with tracking
   */
  async logError(data: ErrorLogData): Promise<void> {
    try {
      await this.db
        .prepare(
          `INSERT INTO error_logs (
            error_type, error_message, error_stack, endpoint, method,
            user_id, request_id, context
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          data.errorType,
          data.errorMessage,
          data.errorStack || null,
          data.endpoint || null,
          data.method || null,
          data.userId || 'anonymous',
          data.requestId || null,
          data.context ? JSON.stringify(data.context) : null
        )
        .run();

      console.error('[ERROR]', data.errorType, data.errorMessage);
    } catch (err) {
      console.error('[LOGGER ERROR]', 'Failed to log error:', err);
    }
  }

  /**
   * Log performance metric
   */
  async logMetric(metric: PerformanceMetric): Promise<void> {
    try {
      await this.db
        .prepare(
          `INSERT INTO performance_metrics (
            metric_name, metric_value, metric_unit, endpoint, operation, metadata
          ) VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(
          metric.metricName,
          metric.metricValue,
          metric.metricUnit || null,
          metric.endpoint || null,
          metric.operation || null,
          metric.metadata ? JSON.stringify(metric.metadata) : null
        )
        .run();

      console.log('[METRIC]', metric.metricName, metric.metricValue, metric.metricUnit);
    } catch (err) {
      console.error('[LOGGER ERROR]', 'Failed to log metric:', err);
    }
  }

  /**
   * Log AI interaction
   */
  async logAI(data: AILogData): Promise<void> {
    try {
      await this.db
        .prepare(
          `INSERT INTO ai_logs (
            chat_id, model, provider, prompt_tokens, completion_tokens,
            total_tokens, duration_ms, user_message, ai_response,
            tools_used, error_message, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          data.chatId || null,
          data.model,
          data.provider,
          data.promptTokens || null,
          data.completionTokens || null,
          data.totalTokens || null,
          data.durationMs || null,
          data.userMessage || null,
          data.aiResponse || null,
          data.toolsUsed ? JSON.stringify(data.toolsUsed) : null,
          data.errorMessage || null,
          data.metadata ? JSON.stringify(data.metadata) : null
        )
        .run();

      console.log('[AI]', data.provider, data.model, `${data.totalTokens} tokens`, `${data.durationMs}ms`);
    } catch (err) {
      console.error('[LOGGER ERROR]', 'Failed to log AI:', err);
    }
  }
}

/**
 * Create logger instance
 */
export function createLogger(db: D1Database, context?: LogContext): Logger {
  return new Logger(db, context);
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract IP address from request
 */
export function getIPAddress(request: Request): string | undefined {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || undefined;
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}
