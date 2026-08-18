import { Router } from "express";
import {getme , updateUser , sendPasswordChangeOTP , changePasswordWithOTP} from "../user/user.controller.js";
import { ValidateOTP, VerifyUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/me", VerifyUser, getme);
router.put("/update-user", VerifyUser, updateUser);
router.post("/send-password-change-otp", VerifyUser, sendPasswordChangeOTP);
router.post("/change-password-otp", ValidateOTP, changePasswordWithOTP);
