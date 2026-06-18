import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { accountingRouter } from '../modules/accounting/routes.js';
import { aiRouter } from '../modules/ai/routes.js';
import { authRouter } from '../modules/auth/routes.js';
import { crmRouter } from '../modules/crm/routes.js';
import { dashboardRouter } from '../modules/dashboard/routes.js';
import { gstRouter } from '../modules/gst/routes.js';
import { hrPayrollRouter } from '../modules/hr-payroll/routes.js';
import { inventoryRouter } from '../modules/inventory/routes.js';
import { moreModulesRouter } from '../modules/more-modules/routes.js';
import { salesRouter } from '../modules/sales/routes.js';
import { searchRouter } from '../modules/search/routes.js';
import { settingsRouter } from '../modules/settings/routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);

apiRouter.use(requireAuth);

apiRouter.use('/ai', aiRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/sales', salesRouter);
apiRouter.use('/gst', gstRouter);
apiRouter.use('/accounting', accountingRouter);
apiRouter.use('/crm', crmRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/hr-payroll', hrPayrollRouter);
apiRouter.use('/more-modules', moreModulesRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/search', searchRouter);
