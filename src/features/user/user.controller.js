import User from "../user/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import OTP from "../../features/auth/otp.model.js";
import SendOTPEmail from "../../services/email.service.js";


const getme = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });

    } catch (error) {
    error.statusCode = 500;
    error.message = "Error occurred while fetching user data";
    next(error);
  } 
}


const updateUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, email,password} = req.body;

    if(!password){
        return res.status(400).json({ message: "Password is required to update user information" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }

     if (email && email.toLowerCase().trim() !== user.email) {
      const trimmedEmail = email.toLowerCase().trim();

      // Check if new email is already in use by another user
      const existingUser = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email is already registered to another account" });
      }

      user.email = trimmedEmail;
    }

    // Update name / username if provided
    const newName = fullName;
    if (newName && newName.trim()) {
      user.fullName = newName.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};


const sendPasswordChangeOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newOTP = crypto.randomInt(100000, 999999).toString();

    // Store in OTP collection with 10-minute expiry
    await OTP.findOneAndUpdate(
      { email: user.email },
      { otp: newOTP, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      { upsert: true, new: true }
    );

    // Send email with OTP
    await SendOTPEmail(user.email, newOTP);

    res.status(200).json({
      success: true,
      message: "OTP sent to your registered email address",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password using OTP verification.
 * PUT /api/users/password
 */
const changePasswordWithOTP = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({ message: "OTP and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP from database
    const existingOTP = await OTP.findOne({ email: user.email });
    if (!existingOTP) {
      res.status(400).json({ message: "OTP expired or not found. Please request a new OTP" });
      return;
    }

    if (existingOTP.otp !== otp.trim()) {
      res.status(400).json({ message: "Invalid OTP code" });
      return;
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Delete used OTP
    await existingOTP.deleteOne();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};




export { getme , updateUser , sendPasswordChangeOTP, changePasswordWithOTP };