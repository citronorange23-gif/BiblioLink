"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
const prisma_js_1 = require("../lib/prisma.js");
async function createNotification({ userId, conversationId, type, title, message, }) {
    return prisma_js_1.prisma.notification.create({
        data: {
            userId,
            conversationId,
            type,
            title,
            message,
        },
    });
}
