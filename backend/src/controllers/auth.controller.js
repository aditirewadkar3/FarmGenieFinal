import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import AgronomistProfile from '../models/agronomistProfile.model.js';
import AuthSession from '../models/authSession.model.js';
import Media from '../models/media.model.js';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import { generateTokens } from '../services/auth.service.js';

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const userObj = userDoc.toObject();
  delete userObj.passwordHash;
  return userObj;
};

// --- Registration (Every user is registered as a farmer) ---
export const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    mobileNumber,
    password,
    language,
    district,
    taluka,
    longitude,
    latitude,
  } = req.body;

  // Check if user already exists
  const existing = await User.findOne({ mobileNumber });
  if (existing) {
    return res.status(400).json({ message: 'Mobile number is already registered.' });
  }

  // Build location object if provided
  let locationObject;
  if (longitude && latitude) {
    locationObject = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
  }

  // Create user as farmer
  const user = await User.create({
    fullName,
    mobileNumber,
    passwordHash: password, // Will be hashed by pre-save hook
    role: 'farmer',
    language: language || 'en',
    location: locationObject,
    address: { district, taluka },
  });

  res.status(201).json({
    message: 'Registered successfully.',
    user: sanitizeUser(user),
  });
});

// --- Login (mobileNumber + password) ---
export const login = asyncHandler(async (req, res) => {
  const { mobileNumber, password } = req.body;

  const user = await User.findOne({ mobileNumber });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  // Compare password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  // Access control for agronomist
  if (user.role === 'agronomist') {
    const profile = await AgronomistProfile.findOne({ user: user._id });

    if (!profile || profile.status !== 'verified') {
      const message =
        profile?.status === 'rejected'
          ? 'Your application has been rejected. Please contact support.'
          : 'Your account is waiting for admin approval.';
      return res.status(403).json({ message });
    }
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  await AuthSession.create({
    user: user._id,
    refreshTokenHash: await bcrypt.hash(refreshToken, 10),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.json({ accessToken, refreshToken, user: sanitizeUser(user) });
});

// --- Refresh Token ---
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const session = await AuthSession.findOne({ user: payload.userId });
    if (!session) return res.status(401).json({ message: 'Session not found' });

    const valid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!valid) return res.status(401).json({ message: 'Invalid token' });

    const accessToken = jwt.sign(
      { userId: payload.userId },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// --- Logout ---
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    await AuthSession.deleteMany({ user: payload.userId });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
});
