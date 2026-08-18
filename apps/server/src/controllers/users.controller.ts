import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  createUser,
  getUserProfile
} from "../services/users.service.js";

export async function registerUser(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email and password are required"
      });
    }

    const user = await createUser(username, email, password);

    return res.status(201).json({
      user
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    if (
      error instanceof Error &&
      error.message === "Username or email already exists"
    ) {
      return res.status(409).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: "Failed to create user"
    });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.params.id as string;

    const user = await getUserProfile(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    return res.json({
      user
    });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      error: "Failed to fetch profile"
    });
  }
}

// // Exemple dans ton contrôleur back-end pour PATCH /auth/me
// export async function updateMyProfile(req: any, res: any) {
//   const userId = req.user.id;
//   const { username, bio, neighborhood, avatarUrl } = req.body;

//   let latitude = null;
//   let longitude = null;

//   // Si l'utilisateur a rempli/modifié son quartier, on récupère ses coordonnées GPS
//   if (neighborhood) {
//     try {
//       const query = encodeURIComponent(neighborhood + ", Canada");
//       const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
//         headers: {
//           "User-Agent": "LivretApp/1.0"
//         }
//       });
//       const data = await response.json();

//       if (data && data.length > 0) {
//         latitude = parseFloat(data[0].lat);
//         longitude = parseFloat(data[0].lon);
//       }
//     } catch (err) {
//       console.error("Erreur de géocodage Nominatim:", err);
//     }
//   }

//   // Mise à jour de l'utilisateur dans la base de données Prisma
//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       username,
//       bio,
//       neighborhood,
//       avatarUrl,
//       latitude,
//       longitude,
//     },
//   });

//   return res.json({ success: true, user: updatedUser });
// }