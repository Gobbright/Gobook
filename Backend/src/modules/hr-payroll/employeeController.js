import { Employee } from '../../models/Employee.js';
import { httpError } from '../../utils/httpError.js';

async function nextEmployeeId() {
  const last = await Employee.findOne({}, { employeeId: 1 }, { sort: { createdAt: -1 } });
  let seq = 1;
  if (last) {
    const parts = last.employeeId.split('-');
    const n = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return `EMP-${String(seq).padStart(3, '0')}`;
}

// GET /api/hr-payroll/employees/stats
export async function getEmployeeStats(req, res, next) {
  try {
    const [total, active, male, female, deptCount] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      Employee.countDocuments({ gender: 'Male' }),
      Employee.countDocuments({ gender: 'Female' }),
      Employee.distinct('dept').then((d) => d.filter(Boolean).length),
    ]);
    res.json({ total, active, inactive: total - active, male, female, deptCount });
  } catch (err) {
    next(err);
  }
}

// GET /api/hr-payroll/employees/departments
export async function getDepartments(req, res, next) {
  try {
    const depts = await Employee.distinct('dept');
    res.json(depts.filter(Boolean).sort());
  } catch (err) {
    next(err);
  }
}

// GET /api/hr-payroll/employees?search=&dept=&status=&page=&limit=
export async function listEmployees(req, res, next) {
  try {
    const { search, dept, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { employeeId: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    if (dept && dept !== 'All Departments') filter.dept = dept;
    if (status && status !== 'All Status') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Employee.countDocuments(filter),
    ]);
    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// GET /api/hr-payroll/employees/:id
export async function getEmployee(req, res, next) {
  try {
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return next(httpError(404, 'Employee not found'));
    res.json(employee);
  } catch (err) {
    next(err);
  }
}

// POST /api/hr-payroll/employees
export async function createEmployee(req, res, next) {
  try {
    const employeeId = await nextEmployeeId();
    const employee = await Employee.create({ ...req.body, employeeId });
    res.status(201).json(employee);
  } catch (err) {
    if (err.code === 11000) return next(httpError(409, 'Employee ID already exists'));
    next(err);
  }
}

// PUT /api/hr-payroll/employees/:id
export async function updateEmployee(req, res, next) {
  try {
    const { employeeId, ...rest } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: rest },
      { new: true, runValidators: true },
    ).lean();
    if (!employee) return next(httpError(404, 'Employee not found'));
    res.json(employee);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/hr-payroll/employees/:id
export async function deleteEmployee(req, res, next) {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id).lean();
    if (!employee) return next(httpError(404, 'Employee not found'));
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
}
