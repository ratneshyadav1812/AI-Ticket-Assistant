import mongoose from "mongoose";

export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid request data",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  req.validatedBody = result.data;
  next();
};

export const validateObjectId = (parameter = "id") => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[parameter])) {
    return res.status(400).json({ message: "Invalid ticket ID" });
  }

  next();
};

