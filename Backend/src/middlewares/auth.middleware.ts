import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string | string[];
  };
}
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const cookieToken = (req as any).cookies?.token as string | undefined;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.split(" ")[1];
    const token = cookieToken || bearerToken;

    if (!token) {
      res.status(401).json({ success: false, message: "Token tidak ditemukan" });
      return;
    }

    const secret = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, secret) as { id: string; role: string };

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    console.error("JWT Verification Error:", error.message);
    res.status(403).json({ success: false, message: "Token tidak valid atau expired" });
  }
}

export function requireCustomerRole(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const userRole = req.user.role;
  const hasCustomerRole = 
    (typeof userRole === "string" && userRole === "CUSTOMERS") ||
    (Array.isArray(userRole) && userRole.includes("CUSTOMERS"));

  if (!hasCustomerRole) {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya CUSTOMERS yang dapat melakukan booking" });
    return;
  }

  next();
}

export function requireOrganizerRole(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const userRole = req.user.role;
  const hasOrganizerRole = 
    (typeof userRole === "string" && userRole === "ORGANIZER") ||
    (Array.isArray(userRole) && userRole.includes("ORGANIZER"));

  if (!hasOrganizerRole) {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya ORGANIZER yang dapat melakukan aksi ini" });
    return;
  }

  next();
}

