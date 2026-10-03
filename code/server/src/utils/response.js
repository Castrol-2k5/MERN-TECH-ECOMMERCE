export const sendSuccess = (res, { statusCode = 200, message = 'Thao tác thành công', data = {}, meta } = {}) => {
  const payload = {
    success: true,
    statusCode,
    message,
    data
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }
  
  return res.status(statusCode).json(payload);
};

export const sendError = (res, { statusCode = 400, errorCode = 'BAD_REQUEST', message = 'Lỗi yêu cầu', errors = [] } = {}) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    errorCode,
    message,
    errors
  });
};
