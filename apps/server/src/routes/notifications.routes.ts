import { Router } from "express";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markConversationNotificationsAsRead,
} from "../controllers/notifications.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  getNotifications
);

router.get(
  "/unread-count",
  requireAuth,
  getUnreadNotificationCount
);

router.patch(
  "/read-all",
  requireAuth,
  markAllNotificationsAsRead
);

router.patch(
  "/conversation/:conversationId/read",
  requireAuth,
  markConversationNotificationsAsRead
);

router.patch(
  "/:id/read",
  requireAuth,
  markNotificationAsRead
);

export default router;