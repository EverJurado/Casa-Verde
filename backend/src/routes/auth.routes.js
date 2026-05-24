import express from "express";
import { login, verifyMasterPassword, changePassword } from "../controllers/authcontroller.js";

const router = express.Router();

router.post("/login", login);
router.post("/verify-master-password", verifyMasterPassword);
router.post("/change-password", changePassword);

export default router;