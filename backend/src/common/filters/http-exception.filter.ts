import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { MongoServerError } from "mongodb";
import { Error as MongooseError } from "mongoose";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const mapped = this.mapException(exception);

    if (mapped.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} failed`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(mapped.status).json({
      statusCode: mapped.status,
      message: mapped.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private mapException(exception: unknown): {
    status: number;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === "string") {
        return { status, message: response };
      }

      const body = response as { message?: string | string[] };
      return {
        status,
        message: body.message ?? exception.message,
      };
    }

    if (exception instanceof MongoServerError && exception.code === 11000) {
      return {
        status: HttpStatus.CONFLICT,
        message: "A record already exists",
      };
    }

    if (
      exception instanceof MongooseError.CastError ||
      exception instanceof MongooseError.ValidationError
    ) {
      return { status: HttpStatus.BAD_REQUEST, message: exception.message };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    };
  }
}
