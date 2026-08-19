"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const favorites_controller_js_1 = require("../controllers/favorites.controller.js");
const router = (0, express_1.Router)();
// DOIT ÊTRE EN HAUT (avant /:bookId)
router.get("/map", auth_middleware_js_1.requireAuth, favorites_controller_js_1.getFavoriteHoldersMap);
router.get("/", auth_middleware_js_1.requireAuth, favorites_controller_js_1.getFavorites);
router.post("/:bookId", auth_middleware_js_1.requireAuth, favorites_controller_js_1.createFavorite);
router.delete("/:bookId", auth_middleware_js_1.requireAuth, favorites_controller_js_1.deleteFavorite);
exports.default = router;
