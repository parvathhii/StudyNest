export function notFound(req, res, _next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(err, _req, res, _next) {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  const message = status >= 500 ? 'Something went wrong. Please try again.' : err.message;
  if (status >= 500) console.error(err);
  res.status(status).json({ message });
}
