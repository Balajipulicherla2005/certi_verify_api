const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const payload = { success: true, message, timestamp: new Date().toISOString() };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

const created   = (res, data = null, message = 'Created successfully') => success(res, data, message, 201);
const error     = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const payload = { success: false, message, timestamp: new Date().toISOString() };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};
const badRequest    = (res, message = 'Bad Request', errors = null) => error(res, message, 400, errors);
const unauthorized  = (res, message = 'Unauthorized')               => error(res, message, 401);
const forbidden     = (res, message = 'Forbidden')                  => error(res, message, 403);
const notFound      = (res, message = 'Not found')                  => error(res, message, 404);
const conflict      = (res, message = 'Already exists')             => error(res, message, 409);

module.exports = { success, created, error, badRequest, unauthorized, forbidden, notFound, conflict };
