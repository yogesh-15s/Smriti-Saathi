import { Response } from 'express';
import { ApiResponse } from '@ner/types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  syncId?: string
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(syncId ? { syncId } : {}),
      version: '1.0.0',
    },
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };
  return res.status(statusCode).json(response);
}
