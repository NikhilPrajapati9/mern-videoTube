import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response } from "express";


export const healthcheck = asyncHandler(async (req:Request, res:Response) => {
   return res.status(200).json(new ApiResponse(200, "", "Ok"));
});
