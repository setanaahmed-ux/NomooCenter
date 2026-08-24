import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

// Tutor "profiles" — a face + a text-to-speech voice — that instructors can
// create and then assign to lessons for avatar-tutor generation.
export const avatarProfilesRouter = Router();

avatarProfilesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const profiles = await prisma.avatarProfile.findMany({ orderBy: { createdAt: "asc" } });
    res.json({ profiles });
  })
);

const profileSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  presenterImageUrl: z.string().url(),
  voiceProvider: z.enum(["microsoft", "amazon", "elevenlabs"]).default("microsoft"),
  voiceId: z.string().min(1),
  language: z.string().min(2).max(10).default("en-US"),
});

avatarProfilesRouter.post(
  "/",
  requireAuth,
  requireRole("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const data = profileSchema.parse(req.body);
    const profile = await prisma.avatarProfile.create({
      data: { ...data, createdById: req.user!.sub },
    });
    res.status(201).json({ profile });
  })
);

avatarProfilesRouter.patch(
  "/:id",
  requireAuth,
  requireRole("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const data = profileSchema.partial().parse(req.body);
    const profile = await prisma.avatarProfile.update({ where: { id: req.params.id }, data });
    res.json({ profile });
  })
);

avatarProfilesRouter.delete(
  "/:id",
  requireAuth,
  requireRole("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    await prisma.avatarProfile.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);
