export const sidebarSections = [
  {
    title: 'Main',
    items: [{ label: 'Dashboard', href: '#/dashboard', icon: 'LayoutDashboard' }],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Bill', href: '#/billing/invoice/new', icon: 'FileText', children: [
        { label: 'Invoice', href: '#/billing/invoice' },
      ] },
      { label: 'Quotation', href: '#/billing/quotation', icon: 'ClipboardList' },
      { label: 'Purchase Order', href: '#/billing/purchase-order', icon: 'ShoppingCart' },
      { label: 'Credit Note', href: '#/billing/credit-note', icon: 'FileMinus' },
      { label: 'Debit Note', href: '#/billing/debit-note', icon: 'FilePlus' },
      { label: 'Delivery Challan', href: '#/billing/delivery-challan', icon: 'Truck' },
      { label: 'E-Invoice', href: '#/billing/e-invoice', icon: 'Zap' },
      { label: 'E-Way Bill', href: '#/billing/e-way-bill', icon: 'Route' },
    ],
  },
  {
    title: 'GST',
    items: [
      { label: 'GST Dashboard', href: '#gst-dashboard', icon: 'PieChart' },
      { label: 'GSTR-1', href: '#gstr-1', icon: 'FileText' },
      { label: 'GSTR-3B', href: '#gstr-3b', icon: 'FileSpreadsheet' },
      { label: 'GSTR-9', href: '#gstr-9', icon: 'FileCheck' },
      { label: 'GST Reconciliation', href: '#gst-reconciliation', icon: 'RefreshCw' },
      { label: 'GST Reports', href: '#gst-reports', icon: 'BarChart3' },
    ],
  },
  {
    title: 'Accounting',
    items: [
      { label: 'Ledger', href: '#ledger', icon: 'BookOpen' },
      { label: 'Journal Entry', href: '#journal-entry', icon: 'PenLine' },
      { label: 'Trial Balance', href: '#trial-balance', icon: 'Scale' },
      { label: 'P&L Statement', href: '#pnl', icon: 'TrendingUp' },
      { label: 'Balance Sheet', href: '#balance-sheet', icon: 'LayoutGrid' },
      { label: 'Cash Book', href: '#cash-book', icon: 'Wallet' },
      { label: 'Bank Book', href: '#bank-book', icon: 'Building2' },
    ],
  },
  {
    title: 'CRM',
    items: [
      { label: 'Customers', href: '#customers', icon: 'Users' },
      { label: 'Leads', href: '#leads', icon: 'UserPlus' },
      { label: 'Follow Ups', href: '#follow-ups', icon: 'Bell' },
      { label: 'Customer Lifecycle', href: '#customer-lifecycle', icon: 'Activity' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Products', href: '#products', icon: 'Package' },
      { label: 'Stock In', href: '#stock-in', icon: 'PackagePlus' },
      { label: 'Stock Out', href: '#stock-out', icon: 'PackageMinus' },
      { label: 'Warehouse', href: '#warehouse', icon: 'Warehouse' },
      { label: 'Barcode / QR Code', href: '#barcode', icon: 'QrCode' },
      { label: 'Stock Alerts', href: '#stock-alerts', icon: 'AlertTriangle' },
    ],
  },
  {
    title: 'HR & Payroll',
    items: [
      { label: 'Employees', href: '#employees', icon: 'Users' },
      { label: 'Attendance', href: '#attendance', icon: 'CalendarCheck' },
      { label: 'Payroll', href: '#payroll', icon: 'DollarSign' },
      { label: 'Leave Management', href: '#leave-management', icon: 'CalendarOff' },
      { label: 'Documents', href: '#documents', icon: 'FolderOpen' },
    ],
  },
  {
    title: 'More Modules',
    items: [
      { label: 'Sales Management', href: '#sales-management', icon: 'TrendingUp' },
      { label: 'Vendor Management', href: '#vendor-management', icon: 'UserCheck' },
      { label: 'WhatsApp Business', href: '#whatsapp-business', icon: 'MessageCircle' },
      { label: 'Email Marketing', href: '#email-marketing', icon: 'Mail' },
      { label: 'Reports', href: '#reports', icon: 'BarChart2' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Multi Branch', href: '#multi-branch', icon: 'GitBranch' },
      { label: 'Users & Roles', href: '#users-roles', icon: 'Shield' },
      { label: 'Business Settings', href: '#business-settings', icon: 'Settings' },
    ],
  },
];
