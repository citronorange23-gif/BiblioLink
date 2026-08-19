"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.getUserProfile = getUserProfile;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_js_1 = require("../lib/prisma.js");
async function createUser(username, email, password) {
    const existingUser = await prisma_js_1.prisma.user.findFirst({
        where: {
            OR: [
                { username },
                { email }
            ]
        }
    });
    if (existingUser) {
        throw new Error("Username or email already exists");
    }
    const passwordHash = await bcrypt_1.default.hash(password, 12);
    return prisma_js_1.prisma.user.create({
        data: {
            username,
            email,
            passwordHash
        },
        select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            bio: true,
            neighborhood: true,
            latitude: true,
            longitude: true,
            createdAt: true
        }
    });
}
async function getUserProfile(userId) {
    let user = await prisma_js_1.prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            neighborhood: true,
            latitude: true,
            longitude: true,
            createdAt: true,
            books: {
                orderBy: {
                    createdAt: "desc"
                },
                select: {
                    id: true,
                    title: true,
                    author: true,
                    theme: true,
                    coverImageUrl: true,
                    condition: true,
                    status: true,
                    createdAt: true
                }
            }
        }
    });
    // Rattrapage automatique : si le quartier existe mais qu'il manque les coordonnées GPS
    if (user && user.neighborhood && (user.latitude === null || user.longitude === null)) {
        try {
            const query = encodeURIComponent(`${user.neighborhood}, Canada`);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
                headers: {
                    "User-Agent": "LivretApp/1.0"
                }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                // Mise à jour silencieuse dans la base de données
                user = await prisma_js_1.prisma.user.update({
                    where: { id: userId },
                    data: {
                        latitude: lat,
                        longitude: lon
                    },
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        bio: true,
                        neighborhood: true,
                        latitude: true,
                        longitude: true,
                        createdAt: true,
                        books: {
                            orderBy: { createdAt: "desc" },
                            select: {
                                id: true,
                                title: true,
                                author: true,
                                theme: true,
                                coverImageUrl: true,
                                condition: true,
                                status: true,
                                createdAt: true
                            }
                        }
                    }
                });
            }
        }
        catch (err) {
            console.error("Erreur lors du géocodage automatique dans getUserProfile:", err);
        }
    }
    return user;
}
