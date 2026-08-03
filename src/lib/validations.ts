import { z } from "zod";
import { TASK_STATUSES } from "@/lib/task-status";
import { hexColorSchema } from "@/lib/mission-color";

export const loginSchema = z.object({
  festivalCode: z.string().min(1, "Code festival requis"),
  pin: z.string().regex(/^\d{4,6}$/, "PIN de 4 à 6 chiffres"),
});

const festivalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ)");

export const festivalSchema = z
  .object({
    name: z.string().min(1, "Nom requis"),
    code: z
      .string()
      .min(1, "Code requis")
      .regex(/^[A-Za-z0-9_-]+$/, "Lettres, chiffres, tirets et underscores uniquement"),
    startDate: festivalDateSchema,
    endDate: festivalDateSchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être après ou égale à la date de début",
    path: ["endDate"],
  });

export const locationSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  type: z.enum(["scene", "point_de_vente", "autre"]),
  description: z.string().optional(),
  gridX: z.number().int().min(0).default(0),
  gridY: z.number().int().min(0).default(0),
  gridW: z.number().int().min(1).default(2),
  gridH: z.number().int().min(1).default(2),
});

export const userSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phone: z.string().optional(),
  pin: z.string().regex(/^\d{4,6}$/, "PIN de 4 à 6 chiffres").optional(),
  isAdmin: z.boolean().default(false),
});

export const artistSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  phone: z.string().optional(),
  description: z.string().optional(),
});

export const volunteerRoleSchema = z.object({
  name: z.string().min(1, "Nom requis"),
});

export const volunteerAssignmentSchema = z.object({
  userId: z.string(),
  role: z.string().optional().nullable(),
});

export const animationSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  locationId: z.string().min(1, "Lieu requis"),
  artistId: z.string().optional().nullable(),
  volunteers: z.array(volunteerAssignmentSchema).optional(),
  startAt: z.string().min(1, "Date de début requise"),
  endAt: z.string().min(1, "Date de fin requise"),
  color: hexColorSchema.optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  volunteers: z.array(volunteerAssignmentSchema).optional(),
  locationId: z.string().optional().nullable(),
  startAt: z.string().min(1, "Date de début requise"),
  endAt: z.string().min(1, "Date de fin requise"),
  status: z.enum(TASK_STATUSES).optional(),
  color: hexColorSchema.optional(),
});

export const taskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export const postSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  locationId: z.string().min(1, "Lieu requis"),
  color: hexColorSchema.optional(),
});

export const slotSchema = z.object({
  postId: z.string().min(1, "Poste requis"),
  volunteers: z.array(volunteerAssignmentSchema).optional(),
  startAt: z.string().min(1, "Date de début requise"),
  endAt: z.string().min(1, "Date de fin requise"),
});

export const slotGenerateSchema = z.object({
  postId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  dailyStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  dailyEndTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDurationMinutes: z.number().int().min(15).max(480),
  days: z.array(z.number().int().min(0).max(6)).min(1),
});

export const pdfExportSchema = z.object({
  type: z.enum(["location", "volunteer"]),
  scope: z.enum(["day", "global"]),
  targetId: z.string().optional(),
  date: z.string().optional(),
});

export type FestivalInput = z.infer<typeof festivalSchema>;
export type VolunteerRoleInput = z.infer<typeof volunteerRoleSchema>;
export type VolunteerAssignmentInput = z.infer<typeof volunteerAssignmentSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type ArtistInput = z.infer<typeof artistSchema>;
export type AnimationInput = z.infer<typeof animationSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type SlotInput = z.infer<typeof slotSchema>;
export type SlotGenerateInput = z.infer<typeof slotGenerateSchema>;
export type PdfExportInput = z.infer<typeof pdfExportSchema>;
