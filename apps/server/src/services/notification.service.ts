import { prisma } from "../lib/prisma.js";

type CreateNotificationParams = {
  userId: string;
  conversationId: string;
  type: string;
  title: string;
  message: string;
};

export async function createNotification({
  userId,
  conversationId,
  type,
  title,
  message,
}: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId,
      conversationId,
      type,
      title,
      message,
    },
  });
}