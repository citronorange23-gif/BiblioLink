import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  createUser,
  getUserProfile,
} from "../services/users.service.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export async function registerUser(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email and password are required"
      });
    }

    const user = await createUser(username, email, password);

    return res.status(201).json({
      user
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    if (
      error instanceof Error &&
      error.message === "Username or email already exists"
    ) {
      return res.status(409).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: "Failed to create user"
    });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.params.id as string;

    const user = await getUserProfile(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    return res.json({
      user
    });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch profile"
    });
  }
}

export async function getCurrentUser(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        neighborhood: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error("GET CURRENT USER ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch current user",
    });
  }
}