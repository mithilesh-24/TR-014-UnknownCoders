/**
 * utils/logger.js
 * ----------------
 * Lightweight request logger middleware.
 * Logs method, path, status code, and response time for every request.
 * Compatible with Railway's stdout log aggregation.
 */

/**
 * Middleware: log each request on response finish.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const ms      = Date.now() - start;
    const status  = res.statusCode;
    const color   = status >= 500 ? '31' : status >= 400 ? '33' : status >= 300 ? '36' : '32';
    const reset   = '\x1b[0m';
    const colored = `\x1b[${color}m${status}${reset}`;

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${colored} (${ms}ms)`);
  });

  next();
}

module.exports = { requestLogger };
