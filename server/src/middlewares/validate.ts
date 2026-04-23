import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      file: req.file,
      files: req.files,
      query: req.query,
      params: req.params,
    });

    console.log("result =>", result);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        errors,
      });
    }

    (req as any).validated = result.data;

    next();
  };
