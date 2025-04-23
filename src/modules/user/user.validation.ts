import { z } from "zod";

const userRegisterValidation = z.object({
  body: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
  }),
});


const toggleAvailabilityValidation = z.object({
  body: z.object({
    isDeleted: z.boolean().optional(),
  }),
})



export const userValidation = {
  userRegisterValidation,
  toggleAvailabilityValidation,
};
