import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Express middleware that validates req.body against a Zod schema.
 * On failure, responds 422 with a flat list of field errors.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      res.status(422).json({
        success: false,
        message: "Validasi gagal",
        errors,
      });
      return;
    }

    // Replace req.body with the parsed (coerced + transformed) data
    req.body = result.data;
    next();
  };
}
