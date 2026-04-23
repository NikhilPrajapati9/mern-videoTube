import { z } from "zod";
import mongoose from "mongoose";

export const getChannelVideosSchema = z.object({
  params: z.object({
    userId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid user ID",
    }),
  }),
  query: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    sortBy: z.string().optional(),
    sortType: z.enum(["asc", "desc"]).optional(),
  }),
});

