import mongoose from "mongoose";
import { z } from "zod";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024;

const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const getAllVideosSchema = z.object({
  query: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    query: z.string().optional(),
    sortBy: z.string().optional(),
    userId: z.string().optional(),
    sortType: z.enum(["asc", "desc"]).optional(),
  }),
});

export const getAllDeletedVideosSchema = z.object({
  query: z.object({
    page: z.number().default(1),
    limit: z.number().default(10),
    sortBy: z.string().default("deletedAt"),
    sortType: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const uploadVideoSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
  }),

  files: z.object({
    videoFile: z
      .array(z.any())
      .nonempty("Video file is required")
      .refine(
        (files) => files[0]?.size <= MAX_VIDEO_SIZE,
        "Video must be less than 100MB"
      )
      .refine(
        (files) => ACCEPTED_VIDEO_TYPES.includes(files[0]?.mimetype),
        "Invalid video format"
      ),

    thumbnail: z
      .array(z.any())
      .optional()
      .refine(
        (files) =>
          !files || files.length === 0 || files[0]?.size <= MAX_THUMBNAIL_SIZE,
        "Thumbnail must be less than 5MB"
      )
      .refine(
        (files) =>
          !files ||
          files.length === 0 ||
          ACCEPTED_IMAGE_TYPES.includes(files[0]?.mimetype),
        "Invalid thumbnail format"
      ),
  }),
});

export const getVideoByIdSchema = z.object({
  params: z.object({
    videoId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid video ID",
    }),
  }),
});

export const deleteVideoSchema = z.object({
  params: z.object({
    videoId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid video ID",
    }),
  }),
});

export const updateVideoSchema = z.object({
  params: z.object({
    videoId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid video ID",
    }),
  }),
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().min(10).optional(),
  }),

  file: z
    .any()
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_THUMBNAIL_SIZE,
      "Max image size is 5MB."
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.mimetype),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

export const recoverVideoSchema = z.object({
  params: z.object({
    videoId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid video ID",
    }),
  }),
});

export const togglePublishStatusSchema = z.object({
  params: z.object({
    videoId: z.string().refine((id) => mongoose.isValidObjectId(id), {
      message: "Invalid video ID",
    }),
  }),
});
