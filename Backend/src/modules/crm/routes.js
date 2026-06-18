import { Router } from 'express';

import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from './customerController.js';
import { createFollowUp, deleteFollowUp, listFollowUps, updateFollowUp } from './followUpController.js';
import { createLead, deleteLead, listLeads, updateLead } from './leadController.js';
import { getLifecycle } from './lifecycleController.js';

export const crmRouter = Router();

// Customers
crmRouter.get('/customers',      listCustomers);
crmRouter.post('/customers',     createCustomer);
crmRouter.put('/customers/:id',  updateCustomer);
crmRouter.delete('/customers/:id', deleteCustomer);

// Leads
crmRouter.get('/leads',      listLeads);
crmRouter.post('/leads',     createLead);
crmRouter.put('/leads/:id',  updateLead);
crmRouter.delete('/leads/:id', deleteLead);

// Follow-ups
crmRouter.get('/follow-ups',      listFollowUps);
crmRouter.post('/follow-ups',     createFollowUp);
crmRouter.put('/follow-ups/:id',  updateFollowUp);
crmRouter.delete('/follow-ups/:id', deleteFollowUp);

// Lifecycle
crmRouter.get('/lifecycle', getLifecycle);
