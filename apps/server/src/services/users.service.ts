import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

export async function createUser(
  username: string,
  email: string,
  password: string
) {
  const existingUser = await prisma.user.findFirst({
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

  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
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

export async function getUserProfile(userId: string) {
  let user = await prisma.user.findUnique({
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
        user = await prisma.user.update({
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
    } catch (err) {
      console.error("Erreur lors du géocodage automatique dans getUserProfile:", err);
    }
  }

  return user;
}