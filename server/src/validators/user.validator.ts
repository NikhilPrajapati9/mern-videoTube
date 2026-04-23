import z from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const fileValidation = z
  .any()
  .refine((file) => !!file, "File is required.") // Check karein ki file exist karti hai
  .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 10MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file?.mimetype),
    "Only .jpg, .jpeg, .png and .webp formats are supported."
  );

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
  }),
  files: z.object({
    avatar: z
      .array(z.any())
      .nonempty("Avatar is required")
      .refine(
        (files) => files[0]?.size <= MAX_FILE_SIZE,
        "Avatar must be < 10MB"
      ),
    coverImage: z.array(z.any()).optional(),
  }),
});
export const loginSchema = z.object({
  body: z
    .object({
      username: z.string().min(3).optional(),
      email: z.string().email().optional(),
      password: z.string().min(6),
    })
    .refine((data) => data.email || data.username, {
      message: "username or email is required",
      path: ["email"], // 👈 error kis field pe show ho
    }),
});

export const refreshAccessTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const changeCurrentPasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(6, "Old password must be at least 6 chars"),
    newPassword: z.string().min(6, "New password must be at least 6 chars"),
  }),
});

export const updateAccountDetailsSchema = z.object({
  body: z.object({
    fullName: z.string().min(3, "Full name required").optional(),
    username: z.string().min(3, "Username too short").optional(),
  }),
});

export const checkUsernameAvailabilitySchema = z.object({
  query: z.object({
    username: z.string(),
  }),
});

export const updateUserAvatarSchema = z.object({
  file: fileValidation,
});

export const updateUserCoverImageSchema = z.object({
  file: fileValidation,
});

export const getUserChannelProfileSchema = z.object({
  params: z.object({
    username: z.string(),
  }),
});
