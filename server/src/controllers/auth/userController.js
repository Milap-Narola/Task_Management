import User from "../../models/auth/UserModel.js";
import generateToken from "../../helpers/generateToken.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Token from "../../models/auth/Token.js";
import crypto from "node:crypto";
import hashToken from "../../helpers/hashToken.js";
import sendEmail from "../../helpers/sendEmail.js";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  //validation
  if (!name || !email || !password) {
    res.status(400).json({ message: "All fields are required" });
  }
  // check password length
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  // check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }
  // create new user
  const user = await User.create(req.body);
  // generate token with user id
  const token = generateToken(user._id);

  // send back the user and token in the response to the client
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: "none", // cross-site access --> allow all third-party cookies
    secure: false,
  });

  if (user) {
    const { _id, name, email, role, photo, bio, isVerified } = user;

    res.status(201).json({
      _id,
      name,
      email,
      role,
      photo,
      bio,
      isVerified,
      token,
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// user login
export const loginUser = async (req, res) => {
  // get email and password from req.body
  const { email, password } = req.body;
  // validation
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // check if user exists
  const userExists = await User.findOne({ email });
  if (!userExists) {
    return res.status(404).json({ message: "User not found, sign up!" });
  }
  // check id the password match the hashed password in the database
  const isMatch = await bcrypt.compare(password,userExists.password,);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // generate token with user id
  const token = generateToken(userExists._id);
  if (userExists && isMatch) {
    const { _id, name, email, role, photo, bio, isVerified } = userExists;
    // set the token in the cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "none", // cross-site access --> allow all third-party cookies
      secure: true,
    });
    res.status(200).json({
      _id,
      name,
      email,
      role,
      photo,
      bio,
      isVerified,
      token,
    });
  } else {
    res.status(400).json({ message: "Invalid email or password" });
  }
};

// logout user
export const logoutUser = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
  });
  res.status(200).json({ message: "User logged out" });
};

// get user
export const getUser = async (req, res) => {
  // let { id } = req.params 
  // get user details from the token ----> exclude password
  const user = await User.find({}).select("-password");
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
};
// update user
export const updateUser = async (req, res) => {
  let { id } = req.params
  // get user details from the token ----> protect middleware
  const user = await User.findById(id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User Not Found" })
  }
  // update user details
  let updatedUsers = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
    .select("-password");
  if (!updatedUsers) {
    return res.status(404).json({ message: "Failed to update user" });
  }
  // send back the updated user detail
  res.status(200).json({
    _id: updatedUsers._id,
    name: updatedUsers.name,
    email: updatedUsers.email,
    role: updatedUsers.role,
    photo: updatedUsers.photo,
    bio: updatedUsers.bio,
    isVerified: updatedUsers.isVerified,
  });
};
// login status
export const checkUserLoginStatus = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    // 401 Unauthorized
    res.status(401).json({ message: "Not authorized, please login!" });
  }
  // verify the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded) {
    return res.status(200).json(true);
  } else {
    return res.status(401).json(false);
  }
};

// email verification
export const verifyEmail = async (req, res) => {
  let { id } = req.params
  const user = await User.findById(id);
  // if user exists
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // check if user is already verified
  if (user.isVerified) {
    return res.status(400).json({ message: "User is already verified" });
  }
  let token = await Token.findOne({ userId: user._id });
  // if token exists --> delete the token
  if (token) {
    await token.deleteOne();
  }
  // create a verification token using the user id --->
  const verificationToken = crypto.randomBytes(64).toString("hex") + user._id;
  // hast the verification token
  const hashedToken = hashToken(verificationToken);
  await new Token({
    userId: user._id,
    verificationToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }).save();

  // verification link
  const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  // send email
  const subject = "Email Verification - AuthKit";
  const send_to = user.email;
  const reply_to = "noreply@gmail.com";
  const template = "emailVerification";
  const send_from = process.env.USER_EMAIL;
  const name = user.name;
  const url = verificationLink;

  try {
    // order matters ---> subject, send_to, send_from, reply_to, template, name, url
    await sendEmail(subject, send_to, send_from, reply_to, template, name, url);
    return res.json({ message: "Email sent" });
  } catch (error) {
    console.log("Error sending email: ", error);
    return res.status(500).json({ message: "Email could not be sent" });
  }
};

// verify user
export const verifyUser = async (req, res) => {
  const { verificationToken } = req.params;
  if (!verificationToken) {
    return res.status(400).json({ message: "Invalid verification token" });
  }
  // hash the verification token --> because it was hashed before saving
  const hashedToken = hashToken(verificationToken);
  // find user with the verification token
  const userToken = await Token.findOne({
    verificationToken: hashedToken,
    // check if the token has not expired
    expiresAt: { $gt: Date.now() },
  });
  if (!userToken) {
    return res
      .status(400)
      .json({ message: "Invalid or expired verification token" });
  }
  //find user with the user id in the token
  const user = await User.findById(userToken.userId);
  if (user.isVerified) {
    // 400 Bad Request
    return res.status(400).json({ message: "User is already verified" });
  }
  // update user to verified
  user.isVerified = true;
  await user.save();
  res.status(200).json({ message: "User verified" });
};

// forgot password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  // check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    // 404 Not Found
    return res.status(404).json({ message: "User not found" });
  }
  // see if reset token exists
  let token = await Token.findOne({ userId: user._id });
  // if token exists --> delete the token
  if (token) {
    await token.deleteOne();
  }
  // create a reset token using the user id ---> expires in 1 hour
  const passwordResetToken = crypto.randomBytes(64).toString("hex") + user._id;
  // hash the reset token
  const hashedToken = hashToken(passwordResetToken);
  await new Token({
    userId: user._id,
    passwordResetToken: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
  }).save();

  // reset link
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${passwordResetToken}`;

  // send email to user
  const subject = "Password Reset - AuthKit";
  const send_to = user.email;
  const send_from = process.env.USER_EMAIL;
  const reply_to = "noreply@noreply.com";
  const template = "forgotPassword";
  const name = user.name;
  const url = resetLink;

  try {
    await sendEmail(subject, send_to, send_from, reply_to, template, name, url);
    res.json({ message: "Email sent" });
  } catch (error) {
    console.log("Error sending email: ", error);
    return res.status(500).json({ message: "Email could not be sent" });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  const { resetPasswordToken } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  // hash the reset token
  const hashedToken = hashToken(resetPasswordToken);

  // check if token exists and has not expired
  const userToken = await Token.findOne({
    passwordResetToken: hashedToken,
    // check if the token has not expired
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  // find user with the user id in the token
  const user = await User.findById(userToken.userId);

  // update user password
  user.password = password;
  await user.save();
  res.status(200).json({ message: "Password reset successfully" });
};

// change password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  //find user by id
  const user = await User.findById(req.user._id);

  // compare current password with the hashed password in the database
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password!" });
  }

  // reset password
  if (isMatch) {
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } else {
    return res.status(400).json({ message: "Password could not be changed!" });
  }

};
