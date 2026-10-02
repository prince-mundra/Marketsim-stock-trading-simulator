export function notFoundMiddleware(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error?.code === 11000) {
    return res.status(409).json({ message: 'That record already exists.' });
  }
  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  const status = Number(error?.statusCode) || 500;
  if (status >= 500) console.error('[api-error]', error?.message || 'Unknown server error');
  return res.status(status).json({
    message: status >= 500 ? 'Something went wrong. Please try again.' : error.message,
  });
}
