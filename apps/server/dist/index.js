"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const prisma_js_1 = require("./lib/prisma.js");
const users_routes_js_1 = __importDefault(require("./routes/users.routes.js"));
const books_routes_js_1 = __importDefault(require("./routes/books.routes.js"));
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const conversations_routes_js_1 = __importDefault(require("./routes/conversations.routes.js"));
const favorites_routes_js_1 = __importDefault(require("./routes/favorites.routes.js"));
const avatar_routes_js_1 = __importDefault(require("./routes/avatar.routes.js"));
const notifications_routes_js_1 = __importDefault(require("./routes/notifications.routes.js"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use("/users", users_routes_js_1.default);
app.use("/books", books_routes_js_1.default);
app.use("/auth", auth_routes_js_1.default);
app.use("/conversations", conversations_routes_js_1.default);
app.use("/favorites", favorites_routes_js_1.default);
app.use("/users", avatar_routes_js_1.default);
app.use("/notifications", notifications_routes_js_1.default);
// Static files
app.use("/uploads", express_1.default.static(path_1.default.resolve(process.cwd(), "uploads")));
// Root
app.get("/", (_req, res) => {
    res.json({
        message: "LivretApp API is running 🚀"
    });
});
// Health check
app.get("/health", async (_req, res) => {
    try {
        await prisma_js_1.prisma.$queryRaw `SELECT 1`;
        res.json({
            status: "ok",
            database: "connected"
        });
    }
    catch (error) {
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
