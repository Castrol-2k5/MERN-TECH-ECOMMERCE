import { AppError } from '../utils/appError.js';
import { sendError } from '../utils/response.js';
import { env } from '../config/environment.js';

export const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.stack = err.stack;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Không tìm thấy tài nguyên với ID: ${err.value}`;
    error = new AppError(message, 404, 'RESOURCE_NOT_FOUND');
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'trường dữ liệu';
    const value = err.keyValue ? err.keyValue[field] : '';
    const message = `Giá trị '${value}' cho '${field}' đã tồn tại trong hệ thống.`;
    error = new AppError(message, 409, 'DUPLICATE_KEY_ERROR', [{ field, message }]);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
    const message = 'Dữ liệu không đáp ứng quy tắc kiểm tra tính hợp lệ.';
    error = new AppError(message, 400, 'VALIDATION_ERROR', errors);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token không hợp lệ. Vui lòng đăng nhập lại.', 401, 'UNAUTHORIZED');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token đã hết hạn. Vui lòng đăng nhập lại.', 401, 'TOKEN_EXPIRED');
  }

  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = error.message || 'Lỗi máy chủ nội bộ';
  const errors = error.errors || [];

  if (env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('Unhandled Application Error:', err);
  }

  return sendError(res, {
    statusCode,
    errorCode,
    message,
    errors
  });
};
