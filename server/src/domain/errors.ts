export interface FieldError {
  field: string;
  message: string;
}

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends HttpError {
  constructor(
    message: string,
    public details: FieldError[]
  ) {
    super(400, message);
    this.name = "ValidationError";
  }
}
