/**
 * Logger Utility - Environment-based logging
 * 
 * In Development (__DEV__ = true): All logs are printed to console
 * In Production (__DEV__ = false): No logs are printed (removed for performance)
 * 
 * Usage:
 * import { logger } from './utils/logger';
 * 
 * logger.log('This will only show in development');
 * logger.error('Errors are shown in both dev and production');
 * logger.warn('Warnings are shown in both dev and production');
 * logger.info('Info only in development');
 */

class Logger {
  /**
   * Log message (Development only)
   * @param  {...any} args - Arguments to log
   */
  log(...args) {
    if (__DEV__) {
      console.log(...args);
    }
  }

  /**
   * Log info message (Development only)
   * @param  {...any} args - Arguments to log
   */
  info(...args) {
    if (__DEV__) {
      console.info(...args);
    }
  }

  /**
   * Log debug message (Development only)
   * @param  {...any} args - Arguments to log
   */
  debug(...args) {
    if (__DEV__) {
      console.debug(...args);
    }
  }

  /**
   * Log warning (Both dev and production)
   * @param  {...any} args - Arguments to log
   */
  warn(...args) {
    console.warn(...args);
  }

  /**
   * Log error (Both dev and production)
   * @param  {...any} args - Arguments to log
   */
  error(...args) {
    console.error(...args);
  }

  /**
   * Log table (Development only)
   * @param {Array|Object} data - Data to display as table
   */
  table(data) {
    if (__DEV__) {
      console.table(data);
    }
  }

  /**
   * Log with group (Development only)
   * @param {string} groupName - Name of the group
   * @param {Function} fn - Function to execute within group
   */
  group(groupName, fn) {
    if (__DEV__) {
      console.group(groupName);
      fn();
      console.groupEnd();
    }
  }

  /**
   * Log time tracking (Development only)
   * @param {string} label - Label for timer
   */
  time(label) {
    if (__DEV__) {
      console.time(label);
    }
  }

  /**
   * End time tracking (Development only)
   * @param {string} label - Label for timer
   */
  timeEnd(label) {
    if (__DEV__) {
      console.timeEnd(label);
    }
  }

  /**
   * Log trace (Development only)
   * @param  {...any} args - Arguments to log
   */
  trace(...args) {
    if (__DEV__) {
      console.trace(...args);
    }
  }

  /**
   * Assert condition (Both dev and production)
   * @param {boolean} condition - Condition to check
   * @param {string} message - Message if assertion fails
   */
  assert(condition, message) {
    console.assert(condition, message);
  }

  /**
   * Clear console (Development only)
   */
  clear() {
    if (__DEV__) {
      console.clear();
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Also export for use as console replacement
export default logger;




