import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, JWTPayload } from '@ner/types';
import { sendError } from '../utils/response.js';

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'ner-dementia-super-secure-jwt-secret-key-2026';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    sendError(res, 'INVALID_TOKEN', 'Session has expired or token is invalid. Please sign in again.', 401);
  }
}

export function requireRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        'FORBIDDEN_ROLE',
        `Access denied. Role '${req.user.role}' is not authorized for this resource. Required: [${allowedRoles.join(', ')}]`,
        403
      );
      return;
    }

    next();
  };
}
