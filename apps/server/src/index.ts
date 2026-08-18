import express from "express";
import cors from "cors";
import path from "path";
import { prisma } from "./lib/prisma.js";

import usersRoutes from "./routes/users.routes.js";
import booksRoutes from "./routes/books.routes.js";
import authRoutes from "./routes/auth.routes.js";
import conversationsRoutes from "./routes/conversations.routes.js";
import favoritesRoutes from "./routes/favorites.routes.js";
import avatarRoutes from "./routes/avatar.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/users", usersRoutes);
app.use("/books", booksRoutes);
app.use("/auth", authRoutes);
app.use("/conversations", conversationsRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/users", avatarRoutes);
app.use("/notifications", notificationsRoutes);

// Static files
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"))
);

// Root
app.get("/", (_req, res) => {
  res.json({
    message: "LivretApp API is running 🚀"
  });
});

// Health check
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});