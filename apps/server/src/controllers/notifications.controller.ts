import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

export async function getNotifications(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const notifications =
      await prisma.notification.findMany({
        where: {
          userId: req.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });

    return res.json({
      notifications,
    });
  } catch (error) {
    console.error(
      "GET NOTIFICATIONS ERROR:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch notifications",
    });
  }
}

export async function getUnreadNotificationCount(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const count =
      await prisma.notification.count({
        where: {
          userId: req.userId,
          readAt: null,
        },
      });

    return res.json({
      count,
    });
  } catch (error) {
    console.error(
      "GET UNREAD NOTIFICATIONS ERROR:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch unread notifications",
    });
  }
}

export async function markNotificationAsRead(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        error: "Invalid notification ID",
      });
    }

    const notification =
      await prisma.notification.findFirst({
        where: {
          id,
          userId: req.userId,
        },
      });

    if (!notification) {
      return res.status(404).json({
        error: "Notification not found",
      });
    }

    const updated =
      await prisma.notification.update({
        where: {
          id,
        },
        data: {
          readAt: new Date(),
        },
      });

    return res.json({
      notification: updated,
    });
  } catch (error) {
    console.error(
      "MARK NOTIFICATION READ ERROR:",
      error
    );

    return res.status(500).json({
      error: "Failed to mark notification as read",
    });
  }
}

export async function markAllNotificationsAsRead(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return res.json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(
      "MARK ALL NOTIFICATIONS READ ERROR:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to mark notifications as read",
    });
  }
}

export async function markConversationNotificationsAsRead(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { conversationId } = req.params;

    if (typeof conversationId !== "string") {
      return res.status(400).json({
        error: "Invalid conversation ID",
      });
    }

    // Vérifie que l'utilisateur fait bien partie de la conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userAId: req.userId },
          { userBId: req.userId },
        ],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        conversationId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return res.json({
      message: "Conversation notifications marked as read",
    });
  } catch (error) {
    console.error(
      "MARK CONVERSATION NOTIFICATIONS READ ERROR:",
      error
    );

    return res.status(500).json({
      error: "Failed to mark conversation notifications as read",
    });
  }
}