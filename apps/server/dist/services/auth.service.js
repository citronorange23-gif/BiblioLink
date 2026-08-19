"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../lib/prisma.js");
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    return secret;
}
async function registerUser(username, email, password) {
    const existingUser = await prisma_js_1.prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { username }
            ]
        }
    });
    if (existingUser) {
        if (existingUser.email === email) {
            throw new Error("Email already in use");
        }
        throw new Error("Username already in use");
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_js_1.prisma.user.create({
        data: {
            username,
            email,
            passwordHash
        }
    });
    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            neighborhood: user.neighborhood,
            createdAt: user.createdAt
        }
    };
}
async function loginUser(email, password) {
    const user = await prisma_js_1.prisma.user.findUnique({
        where: {
            email
        }
    });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const passwordValid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!passwordValid) {
        throw new Error("Invalid email or password");
    }
    const token = jsonwebtoken_1.default.sign({
        userId: user.id
    }, getJwtSecret(), {
        expiresIn: "7d"
    });
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            neighborhood: user.neighborhood,
            createdAt: user.createdAt
        }
    };
}
