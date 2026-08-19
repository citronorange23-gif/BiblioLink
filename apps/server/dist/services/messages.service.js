"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessage = createMessage;
const prisma_js_1 = require("../lib/prisma.js");
async function createMessage(conversationId, senderId, content) {
    return prisma_js_1.prisma.message.create({
        data: {
            conversationId,
            senderId,
            content
        }
    });
}
