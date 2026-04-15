import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { NextFunction, Request } from "express";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyJWT = asyncHandler(async (req: Request, _, next:NextFunction) => {
  try {
    const token =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized request.");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { _id: string };

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;

    next();
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
