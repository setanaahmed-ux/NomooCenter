import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { generateText } from "./gemini.service";

export const aiRouter = Router();

// General-purpose Gemini assistant endpoint. Any frontend feature (community
// helper, in-lesson Q&A, etc.) can hit this rather than talking to Google
// directly, keeping the API key server-side.
const askSchema = z.object({
  prompt: z.string().min(1).max(8000),
  systemInstruction: z.string().max(2000).optional(),
});

aiRouter.post(
  "/ask",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { prompt, systemInstruction } = askSchema.parse(req.body);
    const text = await generateText(prompt, systemInstruction);
    res.json({ text });
  })
);
