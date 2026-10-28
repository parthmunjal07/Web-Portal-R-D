import { z } from "zod";

export const profileFieldsSchema = z.object({
  department: z.string().trim().min(2, "Enter a department.").max(100),
  institutionId: z.string().trim().min(2, "Enter an institution ID.").max(40),
  phoneNumber: z
    .string()
    .trim()
    .refine(
      (value) =>
        /^\+?[0-9\s()-]+$/.test(value) &&
        value.replace(/\D/g, "").length >= 7 &&
        value.replace(/\D/g, "").length <= 15,
      "Enter a valid phone number.",
    ),
});

export type ProfileFields = z.infer<typeof profileFieldsSchema>;
