import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';
import { AppUser } from '../../models/AppUser.js';
import { httpError } from '../../utils/httpError.js';

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

function toSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    branch: user.branch,
    phone: user.phone,
    businessName: user.businessName,
    status: user.status,
    lastLogin: user.lastLogin,
  };
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password, businessName = '', phone = '' } = req.body;

    if (!name || !email || !password) {
      return next(httpError(400, 'Name, email and password are required'));
    }
    if (password.length < 8) {
      return next(httpError(400, 'Password must be at least 8 characters'));
    }

    const existing = await AppUser.findOne({ email: email.toLowerCase() });
    if (existing) {
      return next(httpError(409, 'Email already registered'));
    }

    const isFirstUser = (await AppUser.countDocuments()) === 0;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await AppUser.create({
      name,
      email,
      password: passwordHash,
      businessName,
      phone,
      role: isFirstUser ? 'Super Admin' : 'Sales Executive',
      lastLogin: new Date().toISOString(),
    });

    const token = signToken(user);
    res.status(201).json({ token, user: toSafeUser(user) });
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, 'Email already registered'));
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(httpError(400, 'Email and password are required'));
    }

    const user = await AppUser.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return next(httpError(401, 'Invalid email or password'));
    }
    if (user.status === 'Inactive') {
      return next(httpError(403, 'Account is inactive'));
    }

    user.lastLogin = new Date().toISOString();
    await user.save();

    const token = signToken(user);
    res.json({ token, user: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
export async function getMe(req, res, next) {
  try {
    const user = await AppUser.findById(req.user.id).lean();
    if (!user) return next(httpError(404, 'User not found'));
    res.json(toSafeUser(user));
  } catch (err) {
    next(err);
  }
}
