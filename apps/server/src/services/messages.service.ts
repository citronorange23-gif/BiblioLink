import { prisma } from "../lib/prisma.js";

export async function createMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  return prisma.message.create({
    data: {
      conversationId,
      senderId,
      content
    }
  });
}