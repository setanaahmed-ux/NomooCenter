import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";

export const communityRouter = Router();

const authorSelect = { id: true, name: true, avatarUrl: true, role: true } as const;

// Feed: newest posts first, each with its comments and author.
communityRouter.get(
  "/posts",
  asyncHandler(async (req, res) => {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const take = 20;
    const posts = await prisma.communityPost.findMany({
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: authorSelect },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: authorSelect } },
        },
      },
    });
    const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;
    res.json({ posts, nextCursor });
  })
);

const createPostSchema = z.object({ body: z.string().min(1).max(5000) });

communityRouter.post(
  "/posts",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { body } = createPostSchema.parse(req.body);
    const post = await prisma.communityPost.create({
      data: { body, authorId: req.user!.sub },
      include: { author: { select: authorSelect }, comments: true },
    });
    res.status(201).json({ post });
  })
);

communityRouter.delete(
  "/posts/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.authorId !== req.user!.sub && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Not your post" });
    }
    await prisma.communityPost.delete({ where: { id: post.id } });
    res.status(204).end();
  })
);

const createCommentSchema = z.object({ body: z.string().min(1).max(2000) });

communityRouter.post(
  "/posts/:id/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { body } = createCommentSchema.parse(req.body);
    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = await prisma.communityComment.create({
      data: { body, postId: post.id, authorId: req.user!.sub },
      include: { author: { select: authorSelect } },
    });
    res.status(201).json({ comment });
  })
);

// Members directory (drives the design's "comm-members" list).
communityRouter.get(
  "/members",
  asyncHandler(async (req, res) => {
    const members = await prisma.user.findMany({
      select: { id: true, name: true, avatarUrl: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    res.json({ members });
  })
);
