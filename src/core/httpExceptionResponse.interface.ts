export interface HttpExceptionResponse {
  statusCode: number;
  message: string;
}

export interface CustomHttpExceptionResponse extends HttpExceptionResponse {
  path: string;
  method: string;
  timeStamp: Date;
}
