"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_js_1 = require("../controllers/users.controller.js");
const router = (0, express_1.Router)();
router.post("/", users_controller_js_1.registerUser);
router.get("/:id", users_controller_js_1.getProfile);
// // Route pour mettre à jour le profil de l'utilisateur connecté
// router.patch("/me", requireAuth, updateMyProfile);
exports.default = router;
