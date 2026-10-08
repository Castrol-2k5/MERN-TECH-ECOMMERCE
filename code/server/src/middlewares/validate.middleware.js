import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export const validateDto = (schema, source = 'body') => (req, res, next) => {
  try {
    const dataToValidate = req[source];
    const parsedData = schema.parse(dataToValidate);
    req[source] = parsedData;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return sendError(res, {
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
        message: formattedErrors[0]?.message || 'Dữ liệu yêu cầu không hợp lệ',
        errors: formattedErrors
      });
    }
    next(error);
  }
};
