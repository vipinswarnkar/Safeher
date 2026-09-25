// An error with an HTTP status code. Throw it from any controller and the
// central error handler turns it into a JSON response.
export default class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Not authorized") {
    return new ApiError(401, message);
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }
}
