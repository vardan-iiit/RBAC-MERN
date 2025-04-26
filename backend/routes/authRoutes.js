const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();


const otpStore = {};
// Signup Route - send OTP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    const createdAt = Date.now();
    const otpExpiresIn = 2 * 60 * 1000; // 2 minutes in ms

    // Save to temporary store
    otpStore[email] = {
      name,
      password: hashedPassword,
      otp,
      createdAt,
    };

    const html = `<h2>Hello ${name}</h2><p>Your OTP is <strong>${otp}</strong>. It is valid for 2 minutes.</p>`;
    await sendEmail(email, "Verify Your Email with OTP", html);

    res.status(200).json({
      message: "OTP sent to your email. Please verify to complete registration.",
      otpExpiresIn // ms
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});


// OTP Verification Route
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore[email];

    if (!record) {
      return res.status(400).json({ message: "No OTP found. Please sign up again." });
    }

    const elapsed = Date.now() - record.createdAt;
    const otpExpiresIn = Math.max(0, 2 * 60 * 1000 - elapsed);

    if (otpExpiresIn === 0) {
      delete otpStore[email];
      return res.status(400).json({ message: "OTP expired. Please sign up again." });
    }

    if (parseInt(otp) !== record.otp) {
      return res.status(400).json({
        message: "Invalid OTP",
        otpExpiresIn
      });
    }

    // OTP valid, create user
    await User.create({
      name: record.name,
      email,
      password: record.password,
      isVerified: true,
    });

    delete otpStore[email];
    res.status(200).json({ message: "Email verified and user registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
});


// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (!user.isVerified) {
    return res.status(401).json({ message: "Please verify your email before logging in" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

 
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" } // or another suitable time
  );
  
  res.json({ token, role: user.role });
});

module.exports = router;
