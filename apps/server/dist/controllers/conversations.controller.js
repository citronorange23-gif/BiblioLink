"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startConversation = startConversation;
exports.getConversations = getConversations;
exports.getConversation = getConversation;
exports.sendMessage = sendMessage;
exports.finalizeBorrow = finalizeBorrow;
exports.returnBook = returnBook;
exports.deleteConversation = deleteConversation;
const conversations_service_js_1 = require("../services/conversations.service.js");
const prisma_js_1 = require("../lib/prisma.js");
const messages_service_js_1 = require("../services/messages.service.js");
const notification_service_js_1 = require("../services/notification.service.js");
async function startConversation(req, res) {
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
        const conversation = await (0, conversations_service_js_1.createConversation)(req.userId, bookId);
        return res.status(201).json({
            conversation
        });
    }
    catch (error) {
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
async function getConversations(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }
        const conversations = await (0, conversations_service_js_1.getUserConversations)(req.userId);
        return res.json({
            conversations
        });
    }
    catch (error) {
        console.error("GET CONVERSATIONS ERROR:", error);
        return res.status(500).json({
            error: "Failed to fetch conversations"
        });
    }
}
async function getConversation(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }
        const conversationId = req.params.id;
        const conversation = await (0, conversations_service_js_1.getConversationById)(conversationId, req.userId);
        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }
        // Marquer comme lues les notifications
        // liées à cette conversation
        await prisma_js_1.prisma.notification.updateMany({
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
    }
    catch (error) {
        console.error("GET CONVERSATION ERROR:", error);
        return res.status(500).json({
            error: "Failed to fetch conversation"
        });
    }
}
async function sendMessage(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }
        const conversationId = req.params.id;
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({
                error: "Message content is required"
            });
        }
        const conversation = await prisma_js_1.prisma.conversation.findFirst({
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
        await prisma_js_1.prisma.conversation.update({
            where: {
                id: conversationId,
            },
            data: {
                deletedByAAt: null,
                deletedByBAt: null,
            },
        });
        const message = await (0, messages_service_js_1.createMessage)(conversationId, req.userId, content.trim());
        const recipientId = conversation.userAId === req.userId
            ? conversation.userBId
            : conversation.userAId;
        await (0, notification_service_js_1.createNotification)({
            userId: recipientId,
            conversationId,
            type: "MESSAGE",
            title: "Nouveau message",
            message: content.trim(),
        });
        return res.status(201).json({
            message
        });
    }
    catch (error) {
        console.error("SEND MESSAGE ERROR:", error);
        return res.status(500).json({
            error: "Failed to send message"
        });
    }
}
async function finalizeBorrow(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }
        const conversationId = req.params.id;
        const conversation = await prisma_js_1.prisma.conversation.findFirst({
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
        const book = await prisma_js_1.prisma.book.update({
            where: {
                id: conversation.bookId,
            },
            data: {
                status: "borrowed",
            },
        });
        const borrowerId = conversation.userAId === conversation.book.ownerId
            ? conversation.userBId
            : conversation.userAId;
        const borrower = await prisma_js_1.prisma.user.findUnique({
            where: {
                id: borrowerId,
            },
            select: {
                username: true,
            },
        });
        const systemMessage = await prisma_js_1.prisma.message.create({
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
    }
    catch (error) {
        console.error("FINALIZE BORROW ERROR:", error);
        return res.status(500).json({
            error: "Failed to finalize borrow",
        });
    }
}
async function returnBook(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }
        const conversationId = req.params.id;
        const conversation = await prisma_js_1.prisma.conversation.findFirst({
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
        const book = await prisma_js_1.prisma.book.update({
            where: {
                id: conversation.bookId,
            },
            data: {
                status: "available",
            },
        });
        const borrowerId = conversation.userAId === conversation.book.ownerId
            ? conversation.userBId
            : conversation.userAId;
        const borrower = await prisma_js_1.prisma.user.findUnique({
            where: {
                id: borrowerId,
            },
            select: {
                username: true,
            },
        });
        const systemMessage = await prisma_js_1.prisma.message.create({
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
    }
    catch (error) {
        console.error("RETURN BOOK ERROR:", error);
        return res.status(500).json({
            error: "Failed to return book",
        });
    }
}
async function deleteConversation(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }
        const conversationId = req.params.id;
        await (0, conversations_service_js_1.hideConversation)(conversationId, req.userId);
        return res.json({
            message: "Conversation deleted",
        });
    }
    catch (error) {
        console.error("DELETE CONVERSATION ERROR:", error);
        if (error instanceof Error &&
            error.message === "Conversation not found") {
            return res.status(404).json({
                error: error.message,
            });
        }
        return res.status(500).json({
            error: "Failed to delete conversation",
        });
    }
}
