import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  createConversation,
  getUserConversations,
  getConversationById,
  hideConversation,
} from "../services/conversations.service.js";
import { prisma } from "../lib/prisma.js";
import { createMessage } from "../services/messages.service.js";
import { createNotification } from "../services/notification.service.js";

export async function startConversation(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({
        error: "bookId is required"
      });
    }

    const conversation = await createConversation(
      req.userId,
      bookId
    );

    return res.status(201).json({
      conversation
    });

  } catch (error) {
        console.error("CREATE CONVERSATION ERROR:", error);

        if (error instanceof Error) {
            if (error.message === "Book is already borrowed") {
            return res.status(409).json({
                error: error.message
            });
            }

            if (error.message === "Book not found") {
            return res.status(404).json({
                error: error.message
            });
            }

            if (error.message === "You cannot request your own book") {
            return res.status(403).json({
                error: error.message
            });
            }
        }

        return res.status(500).json({
            error: "Failed to create conversation"
        });
    }
}

export async function getConversations(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const conversations = await getUserConversations(
      req.userId
    );

    return res.json({
      conversations
    });

  } catch (error) {
    console.error("GET CONVERSATIONS ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch conversations"
    });
  }
}

export async function getConversation(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const conversationId = req.params.id as string;

    const conversation = await getConversationById(
      conversationId,
      req.userId
    );

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    // Marquer comme lues les notifications
    // liées à cette conversation
    await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        conversationId: conversationId,
        type: "MESSAGE",
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return res.json({
      conversation
    });

  } catch (error) {
    console.error("GET CONVERSATION ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch conversation"
    });
  }
}

export async function sendMessage(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const conversationId = req.params.id as string;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        error: "Message content is required"
      });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userAId: req.userId },
          { userBId: req.userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        deletedByAAt: null,
        deletedByBAt: null,
      },
    });

    const message = await createMessage(
      conversationId,
      req.userId,
      content.trim()
    );

    const recipientId =
    conversation.userAId === req.userId
      ? conversation.userBId
      : conversation.userAId;

  await createNotification({
    userId: recipientId,
    conversationId,
    type: "MESSAGE",
    title: "Nouveau message",
    message: content.trim(),
  });

    return res.status(201).json({
      message
    });

  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);

    return res.status(500).json({
      error: "Failed to send message"
    });
  }
}

export async function finalizeBorrow(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const conversationId = req.params.id as string;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
      },
      include: {
        book: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    // Seul le propriétaire du livre peut finaliser
    if (conversation.book.ownerId !== req.userId) {
      return res.status(403).json({
        error: "Only the book owner can finalize the borrow",
      });
    }

    if (conversation.book.status === "borrowed") {
      return res.status(409).json({
        error: "Book is already borrowed",
      });
    }

    const book = await prisma.book.update({
      where: {
        id: conversation.bookId,
      },
      data: {
        status: "borrowed",
      },
    });

    const borrowerId =
      conversation.userAId === conversation.book.ownerId
        ? conversation.userBId
        : conversation.userAId;

    const borrower = await prisma.user.findUnique({
      where: {
        id: borrowerId,
      },
      select: {
        username: true,
      },
    });

    const systemMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: req.userId,
        content: `📚 Le livre a été donné à ${borrower?.username ?? "l'emprunteur"}.`,
        type: "SYSTEM",
      },
    });

    return res.json({
      book,
      message: systemMessage,
    });

  } catch (error) {
    console.error("FINALIZE BORROW ERROR:", error);

    return res.status(500).json({
      error: "Failed to finalize borrow",
    });
  }
}

export async function returnBook(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const conversationId = req.params.id as string;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
      },
      include: {
        book: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    // Seul le propriétaire du livre peut remettre le livre disponible
    if (conversation.book.ownerId !== req.userId) {
      return res.status(403).json({
        error: "Only the book owner can return the book",
      });
    }

    const book = await prisma.book.update({
  where: {
    id: conversation.bookId,
  },
  data: {
    status: "available",
  },
});

const borrowerId =
  conversation.userAId === conversation.book.ownerId
    ? conversation.userBId
    : conversation.userAId;

const borrower = await prisma.user.findUnique({
  where: {
    id: borrowerId,
  },
  select: {
    username: true,
  },
});

const systemMessage = await prisma.message.create({
  data: {
    conversationId,
    senderId: req.userId,
    content: `📚 Le livre a été retourné par ${borrower?.username ?? "l'emprunteur"}.`,
    type: "SYSTEM",
  },
});

return res.json({
  book,
  message: systemMessage,
});
  } catch (error) {
    console.error("RETURN BOOK ERROR:", error);

    return res.status(500).json({
      error: "Failed to return book",
    });
  }
}

export async function deleteConversation(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const conversationId = req.params.id as string;

    await hideConversation(
      conversationId,
      req.userId
    );

    return res.json({
      message: "Conversation deleted",
    });
  } catch (error) {
    console.error(
      "DELETE CONVERSATION ERROR:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "Conversation not found"
    ) {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to delete conversation",
    });
  }
}