exports.success = (res, message, data = {}) => {
  return res.status(200).json({ status: 0, message, data });
};

exports.created = (res, message, data = {}) => {
  return res.status(201).json({ status: 0, message, data });
};

exports.error = (res, statusCode = 500, message = "Internal server error", data = null) => {
  if (!res) {
    const err = new Error(message);
    err.status = statusCode;
    err.data = data;
    throw err;
  }
  return res.status(statusCode).json({ status: 1, message, data });
};
