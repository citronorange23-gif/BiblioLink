import { Request, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.middleware.js";
import {
  loginUser,
  registerUser
} from "../services/auth.service.js";
import { prisma } from "../lib/prisma.js";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "email and password are required"
      });
    }

    const result = await loginUser(email, password);

    return res.json(result);
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    if (
      error instanceof Error &&
      error.message === "Invalid email or password"
    ) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    return res.status(500).json({
      error: "Login failed"
    });
  }
}

export async function getMe(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        neighborhood: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json({
      user,
    });
  } catch (error) {
    console.error("GET ME ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch profile",
    });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters"
      });
    }

    const result = await registerUser(
      username,
      email,
      password
    );

    return res.status(201).json(result);

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (
      error instanceof Error &&
      (
        error.message === "Email already in use" ||
        error.message === "Username already in use"
      )
    ) {
      return res.status(409).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: "Registration failed"
    });
  }
}

export async function updateMe(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const {
      username,
      bio,
      neighborhood,
      latitude,
      longitude,
      avatarUrl,
    } = req.body;

    const data: {
      username?: string;
      bio?: string | null;
      neighborhood?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      avatarUrl?: string | null;
    } = {};

    if (username !== undefined) {
      if (!username.trim()) {
        return res.status(400).json({
          error: "Username cannot be empty",
        });
      }

      data.username = username.trim();
    }

    if (bio !== undefined) {
      data.bio = bio?.trim() || null;
    }

    if (neighborhood !== undefined) {
      data.neighborhood = neighborhood?.trim() || null;
    }

    if (latitude !== undefined) {
      data.latitude =
        latitude === null ? null : Number(latitude);
    }

    if (longitude !== undefined) {
      data.longitude =
        longitude === null ? null : Number(longitude);
    }

    if (avatarUrl !== undefined) {
      data.avatarUrl = avatarUrl?.trim() || null;
    }

    const user = await prisma.user.update({
      where: {
        id: req.userId,
      },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        neighborhood: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      user,
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      error: "Failed to update profile",
    });
  }
}