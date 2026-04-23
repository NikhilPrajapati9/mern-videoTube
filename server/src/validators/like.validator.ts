import { z } from "zod";
import mongoose from "mongoose";

export const toggleVideoLikeSchema = z.object({
  params: z.object({
    videoId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid video ID",
    }),
  }),
});

export const toggleCommentLikeSchema = z.object({
  params: z.object({
    commentId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid comment ID",
    }),
  }),
});

export const toggleTweetLikeSchema = z.object({
  params: z.object({
    tweetId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid tweet ID",
    }),
  }),
});

export const getLikedVideosSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getLikedCommentsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getLikedTweetsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
