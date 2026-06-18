import { Router } from 'express';
import { getGstDashboard } from './dashboardController.js';
import { getGstr1, saveGstr1, fileGstr1 } from './gstr1Controller.js';
import { getGstr3b, saveGstr3b, fileGstr3b } from './gstr3bController.js';
import { getReconciliation, saveReconciliation, updateEntry } from './reconciliationController.js';
import { getReport } from './reportsController.js';
import { getGstr9 } from './gstr9Controller.js';

export const gstRouter = Router();

// Dashboard
gstRouter.get('/dashboard',            getGstDashboard);

// GSTR-1 — file must precede /:id-style routes (none here, but good practice)
gstRouter.get('/gstr1',                getGstr1);
gstRouter.put('/gstr1',                saveGstr1);
gstRouter.post('/gstr1/file',          fileGstr1);

// GSTR-3B
gstRouter.get('/gstr3b',               getGstr3b);
gstRouter.put('/gstr3b',               saveGstr3b);
gstRouter.post('/gstr3b/file',         fileGstr3b);

// Reconciliation
gstRouter.get('/reconciliation',                         getReconciliation);
gstRouter.put('/reconciliation',                         saveReconciliation);
gstRouter.patch('/reconciliation/entry/:entryId',        updateEntry);

// Reports
gstRouter.get('/reports',              getReport);

// GSTR-9 (Annual Return)
gstRouter.get('/gstr9',                getGstr9);
