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

const allowedOrigins = [
  "http://localhost:3000",
  "https://biblio-link.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Autorise les requêtes sans Origin
      // (ex: certains appels serveur)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/users", usersRoutes);
app.use("/books", booksRoutes);
app.use("/auth", authRoutes);
app.use("/conversations", conversationsRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/users", avatarRoutes);
app.use("/notifications", notificationsRoutes);

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"))
);

app.get("/", (_req, res) => {
  res.json({
    message: "LivretApp API is running 🚀",
  });
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

export default app;