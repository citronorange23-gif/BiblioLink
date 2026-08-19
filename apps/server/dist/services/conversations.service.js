"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversation = createConversation;
exports.getUserConversations = getUserConversations;
exports.getConversationById = getConversationById;
exports.hideConversation = hideConversation;
const prisma_js_1 = require("../lib/prisma.js");
async function createConversation(userId, bookId) {
    const book = await prisma_js_1.prisma.book.findUnique({
        where: {
            id: bookId
        }
    });
    if (!book) {
        throw new Error("Book not found");
    }
    if (book.ownerId === userId) {
        throw new Error("You cannot request your own book");
    }
    if (book.status !== "available") {
        throw new Error("Book is already borrowed");
    }
    const conversation = await prisma_js_1.prisma.conversation.create({
        data: {
            userAId: userId,
            userBId: book.ownerId,
            bookId
        }
    });
    return conversation;
}
async function getUserConversations(userId) {
    const conversations = await prisma_js_1.prisma.conversation.findMany({
        where: {
            OR: [
                { userAId: userId, deletedByAAt: null },
                { userBId: userId, deletedByBAt: null },
            ],
        },
        include: {
            book: true,
            userA: {
                select: { id: true, username: true },
            },
            userB: {
                select: { id: true, username: true },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    // Ajout du comptage des notifications non lues pour chaque conversation
    const conversationsWithCounts = await Promise.all(conversations.map(async (conversation) => {
        const unreadNotificationCount = await prisma_js_1.prisma.notification.count({
            where: {
                conversationId: conversation.id,
                userId: userId,
                readAt: null,
            },
        });
        return {
            ...conversation,
            unreadNotificationCount, // 👈 Propriété lue par le frontend pour afficher le point rouge
        };
    }));
    return conversationsWithCounts;
}
async function getConversationById(conversationId, userId) {
    return prisma_js_1.prisma.conversation.findFirst({
        where: {
            id: conversationId,
            OR: [
                { userAId: userId },
                { userBId: userId }
            ]
        },
        include: {
            book: {
                select: {
                    id: true,
                    title: true,
                    author: true,
                    coverImageUrl: true,
                    status: true,
                    ownerId: true,
                },
            },
            messages: {
                orderBy: {
                    createdAt: "asc"
                }
            }
        }
    });
}
async function hideConversation(conversationId, userId) {
    const conversation = await prisma_js_1.prisma.conversation.findFirst({
        where: {
            id: conversationId,
            OR: [
                { userAId: userId },
                { userBId: userId },
            ],
        },
    });
    if (!conversation) {
        throw new Error("Conversation not found");
    }
    if (conversation.userAId === userId) {
        await prisma_js_1.prisma.conversation.update({
            where: {
                id: conversationId,
            },
            data: {
                deletedByAAt: new Date(),
            },
        });
    }
    else {
        await prisma_js_1.prisma.conversation.update({
            where: {
                id: conversationId,
            },
            data: {
                deletedByBAt: new Date(),
            },
        });
    }
    // Retire les notifications non lues de cette conversation
    await prisma_js_1.prisma.notification.updateMany({
        where: {
            userId,
            conversationId,
            readAt: null,
        },
        data: {
            readAt: new Date(),
        },
    });
}
