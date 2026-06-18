import { useEffect, useState } from 'react';

import { AppShell } from '../app/AppShell.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { RegisterPage } from '../features/auth/RegisterPage.jsx';
import { isAuthenticated } from '../services/authService.js';
import { BalanceSheetPage } from '../features/accounting/BalanceSheetPage.jsx';
import { BankBookPage } from '../features/accounting/BankBookPage.jsx';
import { CashBookPage } from '../features/accounting/CashBookPage.jsx';
import { JournalEntryPage } from '../features/accounting/JournalEntryPage.jsx';
import { LedgerPage } from '../features/accounting/LedgerPage.jsx';
import { PnlPage } from '../features/accounting/PnlPage.jsx';
import { TrialBalancePage } from '../features/accounting/TrialBalancePage.jsx';
import { GstDashboard } from '../features/gst/GstDashboard.jsx';
import { GstReconciliation } from '../features/gst/GstReconciliation.jsx';
import { GstReports } from '../features/gst/GstReports.jsx';
import { Gstr1Page } from '../features/gst/Gstr1Page.jsx';
import { Gstr3bPage } from '../features/gst/Gstr3bPage.jsx';
import { Gstr9Page } from '../features/gst/Gstr9Page.jsx';
import { CustomerLifecyclePage } from '../features/crm/CustomerLifecyclePage.jsx';
import { CustomersPage } from '../features/crm/CustomersPage.jsx';
import { FollowUpsPage } from '../features/crm/FollowUpsPage.jsx';
import { LeadsPage } from '../features/crm/LeadsPage.jsx';
import { CreateDocumentPage } from '../features/sales/shared/CreateDocumentPage.jsx';
import { InvoicePage } from '../features/sales/InvoicePage.jsx';
import { QuotationPage } from '../features/sales/QuotationPage.jsx';
import { InvoiceViewPage } from '../features/sales/shared/InvoiceViewPage.jsx';
import { PurchaseOrderPage } from '../features/sales/PurchaseOrderPage.jsx';
import { CreditNotePage } from '../features/sales/CreditNotePage.jsx';
import { DebitNotePage } from '../features/sales/DebitNotePage.jsx';
import { DeliveryChallanPage } from '../features/sales/DeliveryChallanPage.jsx';
import { EInvoicePage } from '../features/sales/EInvoicePage.jsx';
import { EWayBillPage, EWayBillFormPage } from '../features/sales/EWayBillPage.jsx';
import { documentConfigs } from '../features/sales/documentConfigs.js';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { EmployeesPage } from '../features/hr-payroll/EmployeesPage.jsx';
import { AttendancePage } from '../features/hr-payroll/AttendancePage.jsx';
import { PayrollPage } from '../features/hr-payroll/PayrollPage.jsx';
import { LeaveManagementPage } from '../features/hr-payroll/LeaveManagementPage.jsx';
import { DocumentsPage } from '../features/hr-payroll/DocumentsPage.jsx';
import { SalesManagementPage } from '../features/more-modules/SalesManagementPage.jsx';
import { VendorManagementPage } from '../features/more-modules/VendorManagementPage.jsx';
import { WhatsAppBusinessPage } from '../features/more-modules/WhatsAppBusinessPage.jsx';
import { EmailMarketingPage } from '../features/more-modules/EmailMarketingPage.jsx';
import { ReportsPage } from '../features/more-modules/ReportsPage.jsx';
import { ProductsPage } from '../features/inventory/ProductsPage.jsx';
import { StockInPage } from '../features/inventory/StockInPage.jsx';
import { StockOutPage } from '../features/inventory/StockOutPage.jsx';
import { WarehousePage } from '../features/inventory/WarehousePage.jsx';
import { BarcodePage } from '../features/inventory/BarcodePage.jsx';
import { StockAlertsPage } from '../features/inventory/StockAlertsPage.jsx';
import { MultiBranchPage } from '../features/settings/MultiBranchPage.jsx';
import { UsersRolesPage } from '../features/settings/UsersRolesPage.jsx';
import { BusinessSettingsPage } from '../features/settings/BusinessSettingsPage.jsx';

function getCurrentRoute() {
  return window.location.hash.replace('#', '') || '/dashboard';
}

const GST_ROUTES = {
  'gst-dashboard':    GstDashboard,
  'gstr-1':           Gstr1Page,
  'gstr-3b':          Gstr3bPage,
  'gstr-9':           Gstr9Page,
  'gst-reconciliation': GstReconciliation,
  'gst-reports':      GstReports,
};

const ACCOUNTING_ROUTES = {
  'ledger':         LedgerPage,
  'journal-entry':  JournalEntryPage,
  'trial-balance':  TrialBalancePage,
  'pnl':            PnlPage,
  'balance-sheet':  BalanceSheetPage,
  'cash-book':      CashBookPage,
  'bank-book':      BankBookPage,
};

const CRM_ROUTES = {
  'customers':          CustomersPage,
  'leads':              LeadsPage,
  'follow-ups':         FollowUpsPage,
  'customer-lifecycle': CustomerLifecyclePage,
};

const INVENTORY_ROUTES = {
  'products':     ProductsPage,
  'stock-in':     StockInPage,
  'stock-out':    StockOutPage,
  'warehouse':    WarehousePage,
  'barcode':      BarcodePage,
  'stock-alerts': StockAlertsPage,
};

const HR_ROUTES = {
  'employees':       EmployeesPage,
  'attendance':      AttendancePage,
  'payroll':         PayrollPage,
  'leave-management': LeaveManagementPage,
  'documents':       DocumentsPage,
};

const MORE_ROUTES = {
  'sales-management':  SalesManagementPage,
  'vendor-management': VendorManagementPage,
  'whatsapp-business': WhatsAppBusinessPage,
  'email-marketing':   EmailMarketingPage,
  'reports':           ReportsPage,
};

const SETTINGS_ROUTES = {
  'multi-branch':      MultiBranchPage,
  'users-roles':       UsersRolesPage,
  'business-settings': BusinessSettingsPage,
};

export function AppRouter() {
  const [route, setRoute] = useState(getCurrentRoute);
  const authed = isAuthenticated();

  useEffect(() => {
    function handleHashChange() {
      setRoute(getCurrentRoute());
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const isAuthRoute = route === '/login' || route === '/register';
    if (!authed && !isAuthRoute) {
      window.location.hash = '/login';
    } else if (authed && isAuthRoute) {
      window.location.hash = '/dashboard';
    }
  }, [authed, route]);

  if (route === '/login') {
    return authed ? null : <LoginPage />;
  }
  if (route === '/register') {
    return authed ? null : <RegisterPage />;
  }
  if (!authed) {
    return null;
  }

  const invoiceEditMatch    = route.match(/^\/billing\/invoice\/([^/]+)\/edit$/);
  const invoiceViewMatch    = route.match(/^\/billing\/invoice\/([^/]+)\/view$/);
  const invoiceEditId       = invoiceEditMatch?.[1];
  const invoiceViewId       = invoiceViewMatch?.[1];
  const quotationEditMatch  = route.match(/^\/billing\/quotation\/([^/]+)\/edit$/);
  const quotationViewMatch  = route.match(/^\/billing\/quotation\/([^/]+)\/view$/);
  const quotationEditId     = quotationEditMatch?.[1];
  const quotationViewId     = quotationViewMatch?.[1];
  const poEditMatch         = route.match(/^\/billing\/purchase-order\/([^/]+)\/edit$/);
  const poViewMatch         = route.match(/^\/billing\/purchase-order\/([^/]+)\/view$/);
  const poEditId            = poEditMatch?.[1];
  const poViewId            = poViewMatch?.[1];
  const cnEditMatch         = route.match(/^\/billing\/credit-note\/([^/]+)\/edit$/);
  const cnViewMatch         = route.match(/^\/billing\/credit-note\/([^/]+)\/view$/);
  const cnEditId            = cnEditMatch?.[1];
  const cnViewId            = cnViewMatch?.[1];
  const dnEditMatch         = route.match(/^\/billing\/debit-note\/([^/]+)\/edit$/);
  const dnViewMatch         = route.match(/^\/billing\/debit-note\/([^/]+)\/view$/);
  const dnEditId            = dnEditMatch?.[1];
  const dnViewId            = dnViewMatch?.[1];
  const dcEditMatch         = route.match(/^\/billing\/delivery-challan\/([^/]+)\/edit$/);
  const dcViewMatch         = route.match(/^\/billing\/delivery-challan\/([^/]+)\/view$/);
  const dcEditId            = dcEditMatch?.[1];
  const dcViewId            = dcViewMatch?.[1];
  const eiEditMatch         = route.match(/^\/billing\/e-invoice\/([^/]+)\/edit$/);
  const eiViewMatch         = route.match(/^\/billing\/e-invoice\/([^/]+)\/view$/);
  const eiEditId            = eiEditMatch?.[1];
  const eiViewId            = eiViewMatch?.[1];
  const ewbEditMatch        = route.match(/^\/billing\/e-way-bill\/([^/]+)\/edit$/);
  const ewbViewMatch        = route.match(/^\/billing\/e-way-bill\/([^/]+)\/view$/);
  const ewbEditId           = ewbEditMatch?.[1];
  const ewbViewId           = ewbViewMatch?.[1];
  const billingMatch        = route.match(/^\/billing\/([^/]+)$/);
  const billingDocumentType = billingMatch?.[1];

  let page;
  if (invoiceViewId) {
    page = <InvoiceViewPage invoiceId={invoiceViewId} documentType="invoice" />;
  } else if (invoiceEditId) {
    page = <CreateDocumentPage documentType="invoice" invoiceId={invoiceEditId} />;
  } else if (route === '/billing/invoice/new') {
    page = <CreateDocumentPage documentType="invoice" />;
  } else if (route === '/billing/invoice') {
    page = <InvoicePage />;
  } else if (quotationViewId) {
    page = <InvoiceViewPage invoiceId={quotationViewId} documentType="quotation" />;
  } else if (quotationEditId) {
    page = <CreateDocumentPage documentType="quotation" invoiceId={quotationEditId} />;
  } else if (route === '/billing/quotation/new') {
    page = <CreateDocumentPage documentType="quotation" />;
  } else if (route === '/billing/quotation') {
    page = <QuotationPage />;
  } else if (poViewId) {
    page = <InvoiceViewPage invoiceId={poViewId} documentType="purchase-order" />;
  } else if (poEditId) {
    page = <CreateDocumentPage documentType="purchase-order" invoiceId={poEditId} />;
  } else if (route === '/billing/purchase-order/new') {
    page = <CreateDocumentPage documentType="purchase-order" />;
  } else if (route === '/billing/purchase-order') {
    page = <PurchaseOrderPage />;
  } else if (cnViewId) {
    page = <InvoiceViewPage invoiceId={cnViewId} documentType="credit-note" />;
  } else if (cnEditId) {
    page = <CreateDocumentPage documentType="credit-note" invoiceId={cnEditId} />;
  } else if (route === '/billing/credit-note/new') {
    page = <CreateDocumentPage documentType="credit-note" />;
  } else if (route === '/billing/credit-note') {
    page = <CreditNotePage />;
  } else if (dnViewId) {
    page = <InvoiceViewPage invoiceId={dnViewId} documentType="debit-note" />;
  } else if (dnEditId) {
    page = <CreateDocumentPage documentType="debit-note" invoiceId={dnEditId} />;
  } else if (route === '/billing/debit-note/new') {
    page = <CreateDocumentPage documentType="debit-note" />;
  } else if (route === '/billing/debit-note') {
    page = <DebitNotePage />;
  } else if (dcViewId) {
    page = <InvoiceViewPage invoiceId={dcViewId} documentType="delivery-challan" />;
  } else if (dcEditId) {
    page = <CreateDocumentPage documentType="delivery-challan" invoiceId={dcEditId} />;
  } else if (route === '/billing/delivery-challan/new') {
    page = <CreateDocumentPage documentType="delivery-challan" />;
  } else if (route === '/billing/delivery-challan') {
    page = <DeliveryChallanPage />;
  } else if (eiViewId) {
    page = <InvoiceViewPage invoiceId={eiViewId} documentType="e-invoice" />;
  } else if (eiEditId) {
    page = <CreateDocumentPage documentType="e-invoice" invoiceId={eiEditId} />;
  } else if (route === '/billing/e-invoice/new') {
    page = <CreateDocumentPage documentType="e-invoice" />;
  } else if (route === '/billing/e-invoice') {
    page = <EInvoicePage />;
  } else if (ewbViewId) {
    page = <InvoiceViewPage invoiceId={ewbViewId} documentType="e-way-bill" />;
  } else if (ewbEditId) {
    page = <EWayBillFormPage ewbId={ewbEditId} />;
  } else if (route === '/billing/e-way-bill/new') {
    page = <EWayBillFormPage />;
  } else if (route === '/billing/e-way-bill') {
    page = <EWayBillPage />;
  } else if (billingDocumentType && documentConfigs[billingDocumentType]) {
    page = <CreateDocumentPage documentType={billingDocumentType} />;
  } else if (GST_ROUTES[route]) {
    const GstPage = GST_ROUTES[route];
    page = <GstPage />;
  } else if (ACCOUNTING_ROUTES[route]) {
    const AccPage = ACCOUNTING_ROUTES[route];
    page = <AccPage />;
  } else if (CRM_ROUTES[route]) {
    const CrmPage = CRM_ROUTES[route];
    page = <CrmPage />;
  } else if (INVENTORY_ROUTES[route]) {
    const InvPage = INVENTORY_ROUTES[route];
    page = <InvPage />;
  } else if (HR_ROUTES[route]) {
    const HrPage = HR_ROUTES[route];
    page = <HrPage />;
  } else if (MORE_ROUTES[route]) {
    const MorePage = MORE_ROUTES[route];
    page = <MorePage />;
  } else if (SETTINGS_ROUTES[route]) {
    const SettingsPage = SETTINGS_ROUTES[route];
    page = <SettingsPage />;
  } else {
    page = <DashboardPage />;
  }

  return (
    <AppShell>
      {page}
    </AppShell>
  );
}
