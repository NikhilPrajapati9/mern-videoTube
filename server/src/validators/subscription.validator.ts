import { z } from "zod";
import mongoose from "mongoose";

export const toggleSubscriptionSchema = z.object({
  params: z.object({
    cannelId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid channel ID",
    }),
  }),
});

export const getUserChannelSubscribersSchema = z.object({
  params: z.object({
    cannelId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid channel ID",
    }),
  }),
});

export const getSubscribedChannelsSchema = z.object({
  params: z.object({
    subscriberId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid subscriber ID",
    }),
  }),
});

