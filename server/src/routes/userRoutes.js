import Router from "express";
import {
  changePassword,
  forgotPassword,
  getUser,
  loginUser,
  userLoginStatus,
  logoutUser,
  registerUser,
  resetPassword,
  updateUser,
  verifyEmail,
  verifyUser,
} from "../controllers/auth/userController.js";
import {
  adminMiddleware,
  creatorMiddleware,
  protect,
} from "../middleware/authMiddleware.js";
import {
  deleteUser,
  getAllUsers,
} from "../controllers/auth/adminController.js";

const UserRouter = Router();

UserRouter.post("/register", registerUser);
UserRouter.post("/login", loginUser);
UserRouter.get("/logout", logoutUser);
UserRouter.get("/user", protect, getUser);
UserRouter.patch("/user", protect, updateUser);

// admin route
UserRouter.delete("/admin/users/:id", protect, adminMiddleware, deleteUser);

// get all users
UserRouter.get("/admin/users", protect, creatorMiddleware, getAllUsers);

// login status
UserRouter.get("/login-status", userLoginStatus);

// email verification
UserRouter.post("/verify-email", protect, verifyEmail);

// veriify user --> email verification
UserRouter.post("/verify-user/:verificationToken", verifyUser);

// forgot password
UserRouter.post("/forgot-password", forgotPassword);

//reset password
UserRouter.post("/reset-password/:resetPasswordToken", resetPassword);

// change password ---> user must be logged in
UserRouter.patch("/change-password", protect, changePassword);

export default UserRouter;
