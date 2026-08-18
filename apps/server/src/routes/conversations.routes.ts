import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  startConversation,
  getConversations,
  getConversation,
  sendMessage,
  finalizeBorrow,
  returnBook,
  deleteConversation,
} from "../controllers/conversations.controller.js";

const router = Router();

router.post("/", requireAuth, startConversation);
router.get("/", requireAuth, getConversations);
router.delete("/:id",requireAuth,deleteConversation);
router.get("/:id", requireAuth, getConversation);
router.post("/:id/messages", requireAuth, sendMessage);

router.post("/:id/finalize", requireAuth, finalizeBorrow);
router.post("/:id/return", requireAuth, returnBook);

export default router;