import { z } from "zod";
import mongoose from "mongoose";

export const getVideoCommentsSchema = z.object({
  params: z.object({
    videoId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid video ID",
    }),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const addCommentSchema = z.object({
  params: z.object({
    videoId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid video ID",
    }),
  }),
  body: z.object({
    content: z
      .string()
      .min(1, "Comment content cannot be empty")
      .max(500, "Comment content cannot exceed 500 characters"),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    commentId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid comment ID",
    }),
  }),
  body: z.object({
    content: z
      .string()
      .min(1, "Comment content cannot be empty")
      .max(500, "Comment content cannot exceed 500 characters"),
  }),
});

export const deleteCommentSchema = z.object({
  params: z.object({
    commentId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid comment ID",
    }),
  }),
});
