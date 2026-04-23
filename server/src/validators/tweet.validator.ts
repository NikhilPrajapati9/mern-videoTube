import mongoose from "mongoose";
import { z } from "zod";

export const createTweetSchema = z.object({
  body: z.object({
    content: z
      .string()
      .min(1, "Tweet content cannot be empty")
      .max(300, "Tweet content cannot exceed 300 characters"),
  }),
});

export const getUserTweetsSchema = z.object({
  params: z.object({
    userId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid user ID",
    }),
  }),
});


export const updateTweetSchema = z.object({
  params: z.object({
    tweetId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid tweet ID",
    }),
  }),
  body: z.object({
    content: z
      .string()
      .min(1, "Tweet content cannot be empty")
      .max(300, "Tweet content cannot exceed 300 characters"),
  }),
});
  

export const deleteTweetSchema = z.object({
  params: z.object({
    tweetId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid tweet ID",
    }),
  }),
})


