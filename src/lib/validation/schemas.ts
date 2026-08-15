import { z } from "zod";

export const uuid = z.string().uuid();
export const languageEnum = z.enum(["he", "en", "ar", "fr"]);
export const urgencyEnum = z.enum(["low", "medium", "high"]);
export const importanceEnum = z.enum(["low", "medium", "high"]);
export const taskStatusEnum = z.enum([
  "pending",
  "in_progress",
  "waiting_for_approval",
  "completed",
  "overdue",
  "cancelled",
]);

export const parentSignUpSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(200),
  familyName: z.string().trim().min(1).max(120).optional(),
  preferredLanguage: languageEnum.default("he"),
});

export const parentSignInSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(200),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  preferredLanguage: languageEnum.optional(),
  avatarUrl: z.string().url().max(2000).nullable().optional(),
});

export const createChildSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  age: z.number().int().min(1).max(25).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_.]+$/, "letters, numbers, underscore and dot only"),
  pin: z
    .string()
    .trim()
    .min(4)
    .max(6)
    .regex(/^[0-9]+$/, "numeric only"),
  avatarColor: z.string().trim().max(20).optional(),
});

export const childSignInSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(32),
  pin: z
    .string()
    .trim()
    .min(4, "a child PIN is 4-6 digits")
    .max(6, "a child PIN is 4-6 digits")
    .regex(/^[0-9]+$/, "a child PIN is digits only"),
});

export const createTaskSchema = z.object({
  assignedChildId: uuid,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  instructions: z.string().trim().max(2000).optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  urgency: urgencyEnum.default("medium"),
  importance: importanceEnum.default("medium"),
  pointsValue: z.number().int().min(0).max(100000),
  requiresParentApproval: z.boolean().default(true),
  requiresPhoto: z.boolean().default(false),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  taskId: uuid,
  status: taskStatusEnum.optional(),
});

export const taskIdSchema = z.object({ taskId: uuid });

// The note a parent writes when sending a task back. Optional: sending back
// without a reason stays a one-tap action.
export const rejectTaskSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

export const createTaskStepSchema = z.object({
  taskId: uuid,
  text: z.string().trim().min(1).max(500),
  position: z.number().int().min(0).max(1000).default(0),
  source: z.enum(["parent", "child", "ai"]).default("parent"),
});

export const updateTaskStepSchema = z.object({
  stepId: uuid,
  completed: z.boolean().optional(),
  text: z.string().trim().min(1).max(500).optional(),
  position: z.number().int().min(0).max(1000).optional(),
});

export const createRewardSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  imageUrl: z.string().url().max(2000).optional().nullable(),
  pointsCost: z.number().int().min(0).max(1000000),
  quantityAvailable: z.number().int().min(0).max(100000).optional().nullable(),
  active: z.boolean().default(true),
});

export const updateRewardSchema = createRewardSchema.partial().extend({
  rewardId: uuid,
});

export const redeemRewardSchema = z.object({ rewardId: uuid });
export const redemptionIdSchema = z.object({ redemptionId: uuid });

export const aiTaskAssistantSchema = z.object({
  taskId: uuid,
  message: z.string().trim().min(1).max(2000),
  language: languageEnum.optional(),
});

export const imageUploadSchema = z.object({
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
  sizeBytes: z.number().int().min(1).max(5 * 1024 * 1024),
});

// Proof photos come straight off a phone camera, so the limits are looser
// than for parent-picked reward art: HEIC is what iOS hands over, and a
// full-resolution capture routinely passes 5MB.
export const taskPhotoUploadSchema = z.object({
  mimeType: z.enum([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/heic",
    "image/heif",
  ], { message: "please upload a photo (JPEG, PNG, WebP or HEIC)" }),
  sizeBytes: z.number().int().min(1).max(12 * 1024 * 1024, "photo must be under 12MB"),
});
