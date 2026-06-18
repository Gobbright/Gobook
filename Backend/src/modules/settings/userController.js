import { AppUser } from '../../models/AppUser.js';
import { httpError } from '../../utils/httpError.js';

const ROLE_STYLES = {
  'Super Admin':       { bg: '#1e293b', text: '#f1f5f9' },
  'Branch Manager':    { bg: '#dbeafe', text: '#1d4ed8' },
  'Accountant':        { bg: '#d1fae5', text: '#065f46' },
  'Sales Executive':   { bg: '#fef3c7', text: '#92400e' },
  'Inventory Manager': { bg: '#fce7f3', text: '#9d174d' },
};

// GET /api/settings/users?search=&role=
export async function listUsers(req, res, next) {
  try {
    const { search, role } = req.query;
    const filter = {};
    if (role && role !== 'All Roles') filter.role = role;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }
    const users = await AppUser.find(filter).sort({ name: 1 }).lean();
    const total    = users.length;
    const active   = users.filter((u) => u.status === 'Active').length;

    // Role distribution
    const roleDist = {};
    for (const u of users) {
      roleDist[u.role] = (roleDist[u.role] || 0) + 1;
    }
    const rolesOverview = Object.entries(roleDist).map(([label, count]) => ({
      label,
      count,
      pct: `${Math.round((count / (total || 1)) * 100)}%`,
      ...(ROLE_STYLES[label] ?? {}),
    }));

    res.json({ users, stats: { total, active, inactive: total - active }, rolesOverview });
  } catch (err) {
    next(err);
  }
}

// POST /api/settings/users
export async function createUser(req, res, next) {
  try {
    const user = await AppUser.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, 'Email already exists'));
    next(err);
  }
}

// PUT /api/settings/users/:id
export async function updateUser(req, res, next) {
  try {
    const user = await AppUser.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true },
    ).lean();
    if (!user) return next(httpError(404, 'User not found'));
    res.json(user);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/settings/users/:id
export async function deleteUser(req, res, next) {
  try {
    const user = await AppUser.findByIdAndDelete(req.params.id).lean();
    if (!user) return next(httpError(404, 'User not found'));
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}
