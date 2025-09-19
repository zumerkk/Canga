'use strict';

// New Relic license key kontrolü
if (!process.env.NEW_RELIC_LICENSE_KEY) {
  console.log('🔧 New Relic: License key bulunamadı, APM devre dışı');
  // New Relic'i devre dışı bırak
  module.exports = {
    config: {
      agent_enabled: false,
      app_name: ['Disabled'],
      license_key: 'disabled'
    }
  };
  return;
}

console.log('✅ New Relic: APM aktif');

/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Agent enabled/disabled
   */
  agent_enabled: true,
  
  /**
   * Array of application names.
   */
  app_name: [process.env.NEW_RELIC_APP_NAME || 'Canga HR System'],
  
  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  
  /**
   * Logging configuration
   */
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    
    /**
     * Where to put the log file -- by default just uses process.cwd() +
     * 'newrelic_agent.log'
     */
    filepath: process.env.NEW_RELIC_LOG_FILEPATH || require('path').join(__dirname, 'logs', 'newrelic_agent.log'),
    
    /**
     * Whether to write to a log file at all
     */
    enabled: process.env.NEW_RELIC_LOG_ENABLED !== 'false'
  },
  
  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,
  
  /**
   * Attributes configuration
   */
  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows * as wildcard
     * at end.
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },
  
  /**
   * Transaction tracer configuration
   */
  transaction_tracer: {
    /**
     * Whether to enable transaction tracing.
     */
    enabled: true,
    
    /**
     * Threshold in milliseconds. When the response time of a web transaction
     * exceeds this threshold, a trace will be collected.
     */
    transaction_threshold: process.env.NEW_RELIC_TRACER_THRESHOLD || 'apdex_f',
    
    /**
     * Whether to collect a trace when transaction_threshold is exceeded.
     */
    top_n: 20,
    
    /**
     * Whether to record SQL in traces
     */
    record_sql: process.env.NEW_RELIC_RECORD_SQL || 'obfuscated',
    
    /**
     * Threshold for SQL queries in milliseconds. Queries slower than this
     * will be recorded in transaction traces.
     */
    explain_threshold: process.env.NEW_RELIC_EXPLAIN_THRESHOLD || 500
  },
  
  /**
   * Error collector configuration
   */
  error_collector: {
    /**
     * Whether to enable error collection.
     */
    enabled: true,
    
    /**
     * List of HTTP error status codes to ignore.
     */
    ignore_status_codes: [400, 401, 403, 404, 405, 409, 422],
    
    /**
     * Whether to capture attributes from error events.
     */
    capture_events: true,
    
    /**
     * Maximum number of error events to send per minute.
     */
    max_event_samples_stored: 100
  },
  
  /**
   * Browser monitoring configuration
   */
  browser_monitoring: {
    /**
     * Whether to enable browser monitoring.
     */
    enabled: false
  },
  
  /**
   * Application performance index configuration
   */
  apdex_t: process.env.NEW_RELIC_APDEX_T || 0.5,
  
  /**
   * Distributed tracing configuration
   */
  distributed_tracing: {
    /**
     * Whether to enable distributed tracing.
     */
    enabled: true
  },
  
  /**
   * Slow SQL configuration
   */
  slow_sql: {
    /**
     * Whether to enable slow SQL collection.
     */
    enabled: true,
    
    /**
     * Maximum number of slow SQL queries to collect per minute.
     */
    max_samples_per_minute: 10
  },
  
  /**
   * Custom insights events configuration
   */
  custom_insights_events: {
    /**
     * Whether to enable custom insights events.
     */
    enabled: true,
    
    /**
     * Maximum number of custom events to send per minute.
     */
    max_samples_stored: 1000
  },
  
  /**
   * Rules for naming or ignoring transactions.
   */
  rules: {
    /**
     * Rules for naming transactions
     */
    name: [
      {
        pattern: '/api/employees/*',
        name: '/api/employees/*'
      },
      {
        pattern: '/api/shifts/*',
        name: '/api/shifts/*'
      },
      {
        pattern: '/api/dashboard/*',
        name: '/api/dashboard/*'
      },
      {
        pattern: '/api/excel/*',
        name: '/api/excel/*'
      },
      {
        pattern: '/api/services/*',
        name: '/api/services/*'
      }
    ],
    
    /**
     * Rules for ignoring transactions
     */
    ignore: [
      '/api/health',
      '/favicon.ico',
      '/*.css',
      '/*.js',
      '/*.png',
      '/*.jpg',
      '/*.gif'
    ]
  },
  
  /**
   * Environment-specific settings
   */
  ...(process.env.NODE_ENV === 'production' ? {
    // Production-specific settings
    high_security: false,
    labels: {
      environment: 'production',
      team: 'canga-hr',
      version: '2.0.0'
    }
  } : {
    // Development/staging settings
    labels: {
      environment: process.env.NODE_ENV || 'development',
      team: 'canga-hr',
      version: '2.0.0'
    }
  })
};

// New Relic'i sadece license key varsa başlat
if (!process.env.NEW_RELIC_LICENSE_KEY) {
  console.log('🔧 New Relic: License key bulunamadı, APM devre dışı');
  exports.config.agent_enabled = false;
} else {
  console.log('✅ New Relic: APM monitoring aktif');
  exports.config.agent_enabled = true;
}