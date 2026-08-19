"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    return secret;
}
function requireAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization;
        if (!authorization) {
            return res.status(401).json({
                error: "Authorization token required"
            });
        }
        const [type, token] = authorization.split(" ");
        if (type !== "Bearer" || !token) {
            return res.status(401).json({
                error: "Invalid authorization format"
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
        if (typeof decoded !== "object" ||
            decoded === null ||
            !("userId" in decoded)) {
            return res.status(401).json({
                error: "Invalid token"
            });
        }
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        console.error("AUTH ERROR:", error);
        return res.status(401).json({
            error: "Invalid or expired token"
        });
    }
}
