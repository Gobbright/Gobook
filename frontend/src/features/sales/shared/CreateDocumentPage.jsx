import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Calendar, CheckCircle2, Lock,
  Phone, Plus, RefreshCw, Search,
  Tag, Trash2, User, UserPlus, X,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { api, SERVER_ORIGIN } from '../../../services/api.js';
import { documentConfigs } from '../documentConfigs.js';
import { DocumentPreviewModal } from './DocumentPreviewModal.jsx';

// ── Constants ────────────────────────────────────────────────────────────────

const UNITS = ['Nos', 'Pcs', 'Kg', 'Gm', 'Mt', 'Ltr', 'Box', 'Bag', 'Set', 'Pair', 'Hrs', 'Days'];
const GST_RATES = [0, 5, 12, 18, 28];
const BUSINESS_STATE = 'Tamil Nadu';

const INDIAN_STATES = [
  'Andaman & Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra & Nagar Haveli', 'Daman & Diu', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

const TDS_SECTIONS = [
  { code: '194C', label: '194C — Payment to Contractors',              rate: 2  },
  { code: '194J', label: '194J — Professional / Technical Fee',        rate: 10 },
  { code: '194I', label: '194I — Rent',                                rate: 10 },
  { code: '194H', label: '194H — Commission / Brokerage',              rate: 5  },
  { code: '194A', label: '194A — Interest (non-securities)',            rate: 10 },
  { code: '194M', label: '194M — Contractor / Professional (Indiv.)',  rate: 5  },
];

const INVOICE_TYPES = [
  { value: 'regular',       label: 'Regular — B2B (Registered)' },
  { value: 'b2c',           label: 'B2C (Unregistered Buyer)' },
  { value: 'export-wop',    label: 'Export — Without Payment of Tax' },
  { value: 'export-wp',     label: 'Export — With Payment of Tax' },
  { value: 'sez-wp',        label: 'SEZ Supply — With Tax' },
  { value: 'sez-wop',       label: 'SEZ Supply — Without Tax' },
  { value: 'deemed-export', label: 'Deemed Export' },
];

const PAYMENT_TERMS_LIST = [
  { value: 'immediate', label: 'Due on Receipt' },
  { value: '7',         label: 'Net 7 Days' },
  { value: '15',        label: 'Net 15 Days' },
  { value: '30',        label: 'Net 30 Days' },
  { value: '45',        label: 'Net 45 Days' },
  { value: '60',        label: 'Net 60 Days' },
  { value: '90',        label: 'Net 90 Days' },
];

const CHARGE_PRESETS = [
  { label: 'Freight',           gstRate: 5  },
  { label: 'Packing',           gstRate: 18 },
  { label: 'Insurance',         gstRate: 18 },
  { label: 'Loading/Unloading', gstRate: 18 },
];

const RECURRING_FREQ = [
  { value: 'weekly',       label: 'Every Week' },
  { value: 'fortnightly',  label: 'Every 2 Weeks' },
  { value: 'monthly',      label: 'Every Month' },
  { value: 'quarterly',    label: 'Every Quarter' },
  { value: 'halfyearly',   label: 'Every 6 Months' },
  { value: 'yearly',       label: 'Every Year' },
];

const PAYMENT_METHODS = [
  { id: 'upi',      label: 'UPI',           badge: 'UPI',  color: '#2563eb', bg: '#eff6ff' },
  { id: 'razorpay', label: 'Razorpay',      badge: 'RZP',  color: '#4f46e5', bg: '#eef2ff' },
  { id: 'cash',     label: 'Cash',          badge: '₹',    color: '#16a34a', bg: '#f0fdf4' },
  { id: 'bank',     label: 'Bank Transfer', badge: 'NEFT', color: '#0891b2', bg: '#ecfeff' },
  { id: 'credit',   label: 'Credit',        badge: 'CR',   color: '#d97706', bg: '#fffbeb' },
];

const SHARE_OPTIONS = [
  {
    id: 'whatsapp', label: 'WhatsApp', desc: 'Send via WhatsApp', color: '#16a34a',
    icon: (
      <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    id: 'email', label: 'Email', desc: 'Send to customer email', color: '#2563eb',
    icon: (
      <svg fill="none" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    id: 'pdf', label: 'Download PDF', desc: 'Save as PDF file', color: '#dc2626',
    icon: (
      <svg fill="none" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" x2="12" y1="18" y2="12" /><line x1="9" x2="15" y1="15" y2="15" />
      </svg>
    ),
  },
  {
    id: 'sms', label: 'SMS', desc: 'Send link via SMS', color: '#7c3aed',
    icon: (
      <svg fill="none" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

// ── CSS helpers ──────────────────────────────────────────────────────────────

const cx = {
  field:       'flex flex-col gap-1',
  label:       'text-xs text-[#536173] font-medium',
  input:       'border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] text-[#111827] w-full outline-none focus:border-blue-500 font-[inherit]',
  inputError:  'border border-red-400 bg-red-50 rounded-md px-3 py-2 text-[13px] text-[#111827] w-full outline-none focus:border-red-500 font-[inherit]',
  select:      'border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] text-[#111827] w-full outline-none bg-white font-[inherit]',
  btnOutline:  'inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-gray-700 bg-white border border-[#dbe4ef] rounded-md cursor-pointer hover:bg-gray-50 font-[inherit]',
  btnPrimary:  'inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-blue-600 border border-blue-600 rounded-md cursor-pointer hover:bg-blue-700 font-[inherit]',
  sectionTitle:'text-xs font-semibold uppercase text-[#536173] tracking-wide',
  toggleBtn:   (on) => `flex-1 py-2 text-[13px] border-0 cursor-pointer font-[inherit] transition-colors ${on ? 'text-white bg-blue-600' : 'text-[#536173] bg-white hover:bg-gray-50'}`,
};

// ── Pure helpers ─────────────────────────────────────────────────────────────

function calcLine(item) {
  const gross       = item.qty * item.rate;
  const discountAmt = gross * (item.discount / 100);
  const taxable     = gross - discountAmt;
  const gstAmt      = taxable * (item.gstRate / 100);
  return { gross, discountAmt, taxable, gstAmt, total: taxable + gstAmt };
}

function normalizeCustomer(customer = {}) {
  return {
    _id: customer._id ?? customer.id,
    id: customer.id ?? customer._id,
    name: customer.name || '',
    gstin: customer.gstin || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || BUSINESS_STATE,
    pincode: customer.pincode || '',
  };
}

function phoneKey(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function customerPayload(customer) {
  const { _id, id, ...payload } = normalizeCustomer(customer);
  return payload;
}

function formatDateInput(date = new Date()) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function addDaysInput(dateInput, days) {
  const d = dateInput ? new Date(`${dateInput}T00:00:00`) : new Date();
  const offset = Number.isFinite(Number(days)) ? Number(days) : 0;
  d.setDate(d.getDate() + offset);
  return formatDateInput(d);
}

function normalizeProduct(product = {}) {
  const description = product.description || product.name || product.productName || '';
  return {
    ...product,
    _id: product._id ?? product.id ?? description,
    id: product.id ?? product._id ?? description,
    description,
    hsn: product.hsn ?? '',
    unit: product.unit || 'Nos',
    rate: Number(product.rate ?? product.sellingPrice ?? product.price ?? 0),
    gstRate: Number(product.gstRate ?? product.taxRate ?? 18),
  };
}

// ── Main component ───────────────────────────────────────────────────────────

export function CreateDocumentPage({ documentType = 'invoice', invoiceId }) {
  const config = documentConfigs[documentType] ?? documentConfigs.invoice;
  const defaultInvoiceDate = formatDateInput();
  const defaultPaymentTerms = '30';
  const defaultDueDate = addDaysInput(defaultInvoiceDate, defaultPaymentTerms);

  // ── Core state ──
  const [items, setItems]               = useState([{ id: 1000, description: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, gstRate: 18 }]);
  const [supplyType, setSupplyType]     = useState('intrastate');
  const [showShare, setShowShare]       = useState(false);
  const [showPayment, setShowPayment]   = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentData, setPaymentData]   = useState({
    amount: '', date: defaultInvoiceDate, notes: '',
    upiId: '', customerPhone: '', amountReceived: '',
    utrNumber: '', bankName: '', creditDays: defaultPaymentTerms,
  });

  const [customer, setCustomer] = useState({
    name: '', gstin: '', phone: '', email: '', address: '', city: '', state: BUSINESS_STATE, pincode: '',
  });

  const [docMeta, setDocMeta] = useState({
    number: `${config.prefix}-0001`,
    date: defaultInvoiceDate,
    dueDate: defaultDueDate,
    poRef: '',
    placeOfSupply: 'Tamil Nadu',
    invoiceType: 'regular',
    rcm: false,
    paymentTerms: defaultPaymentTerms,
  });

  const [docExtra, setDocExtra] = useState({
    validTill: '', expectedDelivery: '', deliveryAddress: '',
    originalInvoiceNo: '', originalInvoiceDate: '', reason: '',
    vehicleNumber: '', driverName: '', transporter: '',
    transporterId: '', distanceKm: '', ewbSupplyType: 'outward',
    irnNumber: '', ackNumber: '', ackDate: '',
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [bizSettings, setBizSettings] = useState({});
  const nextItemId = useRef(1001);
  const nextChargeId = useRef(2000);
  const [invoiceLoading, setInvoiceLoading] = useState(Boolean(invoiceId));
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loadError, setLoadError] = useState('');

  const [notes, setNotes]   = useState('Thank you for your business! Payment should be made within the due date.');
  const [terms, setTerms]   = useState(
    '1. Payment due within 30 days of invoice date.\n2. Late payment charges @ 2% per month applicable.\n3. Goods once sold will not be taken back.\n4. Subject to Mumbai jurisdiction.',
  );
  const [internalNotes, setInternalNotes] = useState('');

  // ── Shipping ──
  const [sameShipping, setSameShipping] = useState(true);
  const [shipping, setShipping]         = useState({ address: '', city: '', state: 'Tamil Nadu', pincode: '' });

  // ── Additional charges ──
  const [charges, setCharges] = useState([]);

  // ── Discounts / deductions ──
  const [addDiscount, setAddDiscount] = useState({ type: 'percent', value: '' });
  const [tds, setTds]                 = useState({ enabled: false, section: '194C', rate: 2 });
  const [tcs, setTcs]                 = useState({ enabled: false, rate: 1 });
  const [advanceAmt, setAdvanceAmt]   = useState('');

  // ── UI state ──
  const [showPreview, setShowPreview]           = useState(false);
  const [autoPrintPreview, setAutoPrintPreview] = useState(false);
  const [downloadPdfMode, setDownloadPdfMode]   = useState(false);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [previewRedirectOnClose, setPreviewRedirectOnClose] = useState(false);
  const [showEmailModal, setShowEmailModal]     = useState(false);
  const [emailTo, setEmailTo]                   = useState('');
  const [emailSending, setEmailSending]         = useState(false);
  const [emailResult, setEmailResult]           = useState(null);
  const [savedInvoiceId, setSavedInvoiceId]     = useState(invoiceId || null);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [customerQuery, setCustomerQuery]       = useState('');
  const [showPhoneDrop, setShowPhoneDrop]       = useState(false);
  const [showAddCustomer, setShowAddCustomer]   = useState(false);
  const [newCustomerForm, setNewCustomerForm]   = useState({
    name: '', gstin: '', phone: '', email: '', address: '', city: '', state: BUSINESS_STATE, pincode: '',
  });
  const [customerSaving, setCustomerSaving]       = useState(false);
  const [customerSaveError, setCustomerSaveError] = useState('');
const [customFields, setCustomFields]         = useState([]);
  const [recurring, setRecurring]               = useState({ enabled: false, frequency: 'monthly', endAfter: '', endDate: '' });
  const [showAddDiscount, setShowAddDiscount]   = useState(false);
  const [showTdsTcs, setShowTdsTcs]             = useState(false);
  const [errors, setErrors]                     = useState({});

  function clearError(key) {
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function getEffectiveCustomer() {
    const hasInvoiceCustomerDraft = documentType === 'invoice' && Object.entries(newCustomerForm).some(([key, value]) => {
      if (key === 'state' && value === BUSINESS_STATE) return false;
      return String(value || '').trim();
    });
    if (hasInvoiceCustomerDraft) {
      return {
        ...customer,
        ...newCustomerForm,
        state: newCustomerForm.state || customer.state || BUSINESS_STATE,
      };
    }
    return customer;
  }

  function validate() {
    const errs = {};
    const effectiveCustomer = getEffectiveCustomer();

    // ── Common (all document types) ──────────────────────────────────────────
    if (!effectiveCustomer.name.trim())
      errs.customerName = `${config.partyNameLabel.replace(' *', '')} is required`;
    if (!docMeta.number.trim())
      errs.invoiceNumber = `${config.title} number cannot be empty`;
    if (!docMeta.date)
      errs.invoiceDate = `${config.dateLabel} is required`;
    const hasValidItem = items.some((it) => it.description && Number(it.qty) > 0);
    if (!hasValidItem)
      errs.items = 'Add at least one item with a description and qty > 0';
    items.forEach((it, idx) => {
      if (it.description && !(Number(it.qty) > 0)) errs[`item_qty_${idx}`] = 'Required';
      if (it.description && Number(it.rate) < 0)   errs[`item_rate_${idx}`] = 'Invalid';
    });

    // ── Quotation ────────────────────────────────────────────────────────────
    // Valid Till is strongly recommended for a quotation to set customer expectations
    if (documentType === 'quotation' && !docExtra.validTill)
      errs.validTill = 'Valid Till date is recommended — helps the customer know offer expiry';

    // ── Purchase Order ───────────────────────────────────────────────────────
    if (documentType === 'purchase-order' && !docExtra.expectedDelivery)
      errs.expectedDelivery = 'Expected Delivery date is recommended for vendor commitment';

    // ── Credit Note ──────────────────────────────────────────────────────────
    if (documentType === 'credit-note') {
      if (!docExtra.reason.trim())
        errs.reason = 'Reason for credit is required';
      if (!docExtra.originalInvoiceNo.trim())
        errs.originalInvoiceNo = 'Original invoice number should be referenced for GST compliance';
    }

    // ── Debit Note ───────────────────────────────────────────────────────────
    if (documentType === 'debit-note') {
      if (!docExtra.reason.trim())
        errs.reason = 'Reason for debit is required';
      if (!docExtra.originalInvoiceNo.trim())
        errs.originalInvoiceNo = 'Original invoice number should be referenced for GST compliance';
    }

    // ── E-Invoice ────────────────────────────────────────────────────────────
    // GSTIN of buyer is mandatory for IRN generation on the GST portal
    if (documentType === 'e-invoice' && !effectiveCustomer.gstin.trim())
      errs.customerGstin = 'Buyer GSTIN is mandatory for E-Invoice (required for IRN generation)';

    // ── E-Way Bill ───────────────────────────────────────────────────────────
    // Rule 138 of CGST Rules: vehicle, transporter, and distance are required
    if (documentType === 'e-way-bill') {
      if (!docExtra.vehicleNumber.trim())
        errs.vehicleNumber = 'Vehicle number is required (CGST Rule 138)';
      if (!docExtra.transporter.trim())
        errs.transporter = 'Transporter name is required for E-Way Bill';
      if (!docExtra.distanceKm || Number(docExtra.distanceKm) <= 0)
        errs.distanceKm = 'Distance (KM) must be greater than 0';
    }

    return errs;
  }

  // ── Totals ──────────────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    const acc = { subtotal: 0, discount: 0, taxable: 0, totalGst: 0, grandTotal: 0, gstByRate: {} };
    items.forEach((item) => {
      const line = calcLine(item);
      acc.subtotal   += line.gross;
      acc.discount   += line.discountAmt;
      acc.taxable    += line.taxable;
      acc.totalGst   += line.gstAmt;
      acc.grandTotal += line.total;
      if (!acc.gstByRate[item.gstRate]) acc.gstByRate[item.gstRate] = { taxable: 0, gst: 0 };
      acc.gstByRate[item.gstRate].taxable += line.taxable;
      acc.gstByRate[item.gstRate].gst     += line.gstAmt;
    });

    const chargesSubtotal = charges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const chargesGst      = config.showGst
      ? charges.reduce((s, c) => s + (Number(c.amount) || 0) * (c.gstRate / 100), 0)
      : 0;

    const preDisc = config.showGst
      ? acc.grandTotal + chargesSubtotal + chargesGst
      : acc.taxable + chargesSubtotal;

    const addDiscAmt = addDiscount.value
      ? (addDiscount.type === 'percent'
          ? preDisc * (Number(addDiscount.value) / 100)
          : Math.min(Number(addDiscount.value), preDisc))
      : 0;

    const invoiceTotal = preDisc - addDiscAmt;
    const tdsAmt       = tds.enabled ? acc.taxable * (tds.rate / 100) : 0;
    const tcsAmt       = tcs.enabled ? invoiceTotal * (tcs.rate / 100) : 0;
    const netPayable   = invoiceTotal - tdsAmt + tcsAmt;
    const roundOff     = Math.round(netPayable) - netPayable;
    const finalTotal   = Math.round(netPayable);
    const balanceDue   = finalTotal - (Number(advanceAmt) || 0);

    return { ...acc, chargesSubtotal, chargesGst, preDisc, addDiscAmt, invoiceTotal, tdsAmt, tcsAmt, netPayable, roundOff, finalTotal, balanceDue };
  }, [items, charges, addDiscount, tds, tcs, advanceAmt, config.showGst]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function updateCustomer(field, value) {
    setCustomer((p) => ({ ...p, [field]: value }));
    if (field === 'state' && config.showGst) {
      setSupplyType(value === BUSINESS_STATE ? 'intrastate' : 'interstate');
    }
  }

  function selectCustomer(c) {
    const normalized = normalizeCustomer(c);
    setCustomer({
      name: normalized.name,
      gstin: normalized.gstin,
      phone: normalized.phone,
      email: normalized.email,
      address: normalized.address,
      city: normalized.city,
      state: normalized.state,
      pincode: normalized.pincode,
    });
    setNewCustomerForm({
      name: normalized.name,
      gstin: normalized.gstin,
      phone: normalized.phone,
      email: normalized.email,
      address: normalized.address,
      city: normalized.city,
      state: normalized.state,
      pincode: normalized.pincode,
    });
    if (config.showGst) setSupplyType(normalized.state === BUSINESS_STATE ? 'intrastate' : 'interstate');
    clearError('customerName');
    if (normalized.gstin) clearError('customerGstin');
    setShowCustomerDrop(false);
    setCustomerQuery('');
  }

  function clearCustomer() {
    setCustomer({ name: '', gstin: '', phone: '', email: '', address: '', city: '', state: BUSINESS_STATE, pincode: '' });
    setNewCustomerForm({ name: '', gstin: '', phone: '', email: '', address: '', city: '', state: BUSINESS_STATE, pincode: '' });
    setShowAddCustomer(false);
    setCustomerSaveError('');
    if (config.showGst) setSupplyType('intrastate');
  }

  function updateNewCustomer(field, value) {
    setNewCustomerForm((p) => ({ ...p, [field]: value }));
    if (field === 'name' && value.trim()) clearError('customerName');
    if (field === 'gstin' && value.trim()) clearError('customerGstin');
  }

  function updateInvoiceCustomerField(field, value) {
    updateCustomer(field, value);
    updateNewCustomer(field, value);
  }

  async function handleCreateCustomer() {
    if (!newCustomerForm.name.trim()) {
      setCustomerSaveError('Customer name is required');
      return;
    }
    setCustomerSaving(true);
    setCustomerSaveError('');
    try {
      const created = await api.createCustomer(newCustomerForm);
      setCustomers((prev) => [...prev, created]);
      selectCustomer(created);
      setShowAddCustomer(false);
    } catch (err) {
      setCustomerSaveError(err.message || 'Unable to save customer');
    } finally {
      setCustomerSaving(false);
    }
  }

  async function rememberCustomerForPhone(customerData) {
    const normalized = normalizeCustomer(customerData);
    const digits = phoneKey(normalized.phone);
    if (!normalized.name.trim() || digits.length < 10) return normalized;

    try {
      const localMatch = customers.find((c) => phoneKey(c.phone) === digits);
      const remoteRows = localMatch ? [] : await api.listCustomers(digits);
      const remoteMatch = (Array.isArray(remoteRows) ? remoteRows : remoteRows?.data || [])
        .map(normalizeCustomer)
        .find((c) => phoneKey(c.phone) === digits);
      const match = localMatch ? normalizeCustomer(localMatch) : remoteMatch;

      if (match?._id || match?.id) {
        const id = match._id || match.id;
        const merged = {
          ...match,
          ...Object.fromEntries(Object.entries(normalized).filter(([, value]) => String(value || '').trim())),
          phone: normalized.phone,
        };
        const updated = normalizeCustomer(await api.updateCustomer(id, customerPayload(merged)));
        setCustomers((prev) => {
          const exists = prev.some((c) => (c._id || c.id) === (updated._id || updated.id));
          return exists
            ? prev.map((c) => ((c._id || c.id) === (updated._id || updated.id) ? updated : c))
            : [...prev, updated];
        });
        return updated;
      }

      const created = normalizeCustomer(await api.createCustomer(customerPayload(normalized)));
      setCustomers((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.warn('Unable to remember customer for phone lookup', err);
      return normalized;
    }
  }

  function updateMeta(field, value)  {
    setDocMeta((p) => {
      const next = { ...p, [field]: value };
      if (field === 'date' && config.showDueDate) {
        next.dueDate = addDaysInput(value, next.paymentTerms || defaultPaymentTerms);
      }
      if (field === 'paymentTerms' && config.showDueDate) {
        next.dueDate = addDaysInput(next.date, value || defaultPaymentTerms);
      }
      return next;
    });
    if (field === 'date') {
      setPaymentData((p) => ({ ...p, date: value }));
    }
  }
  function updateExtra(field, value) { setDocExtra((p) => ({ ...p, [field]: value })); }
  function updatePayment(field, value){ setPaymentData((p) => ({ ...p, [field]: value })); }

  function updateItem(id, field, value) {
    setItems((prev) => prev.map((item) =>
      item.id === id
        ? { ...item, [field]: ['qty', 'rate', 'discount', 'gstRate'].includes(field) ? Number(value) : value }
        : item,
    ));
  }

  function addItem() {
    const id = nextItemId.current++;
    setItems((prev) => [...prev, { id, description: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, gstRate: 18 }]);
  }

  function removeItem(id) { setItems((prev) => prev.filter((item) => item.id !== id)); }

  function selectProduct(itemId, product) {
    const normalized = normalizeProduct(product);
    setItems((prev) => {
      return prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              description: normalized.description,
              hsn: normalized.hsn,
              unit: normalized.unit,
              rate: normalized.rate,
              gstRate: normalized.gstRate,
            }
          : item,
      );
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.items;
      return next;
    });
  }

  function addCharge(preset) {
    const id = nextChargeId.current++;
    const charge = preset
      ? { id, label: preset.label, amount: '', gstRate: preset.gstRate }
      : { id, label: '', amount: '', gstRate: 18 };
    setCharges((prev) => [...prev, charge]);
  }

  function updateCharge(id, field, value) {
    setCharges((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  }

  function removeCharge(id) { setCharges((prev) => prev.filter((c) => c.id !== id)); }

  function buildPayload(customerOverride) {
    const effectiveCustomer = customerOverride || getEffectiveCustomer();
    return {
      number: docMeta.number,
      documentType,
      customer: effectiveCustomer,
      meta: docMeta,
      supplyType: config.showGst && effectiveCustomer.state
        ? (effectiveCustomer.state === BUSINESS_STATE ? 'intrastate' : 'interstate')
        : supplyType,
      items,
      shipping: { sameAsBilling: sameShipping, ...shipping },
      charges,
      additionalDiscount: addDiscount,
      tds,
      tcs,
      advanceReceived: Number(advanceAmt) || 0,
      notes,
      internalNotes,
      terms,
      customFields,
      recurring,
      extra: docExtra,
    };
  }

  const LIST_ROUTES = {
    invoice:            '#/billing/invoice',
    quotation:          '#/billing/quotation',
    'purchase-order':   '#/billing/purchase-order',
    'credit-note':      '#/billing/credit-note',
    'debit-note':       '#/billing/debit-note',
    proforma:           '#/billing/proforma',
    'delivery-challan': '#/billing/delivery-challan',
    'e-invoice':        '#/billing/e-invoice',
    'e-way-bill':       '#/billing/e-way-bill',
  };

  async function handleSave({ openPreview, autoPrint } = {}) {
    setSaveError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTimeout(() => document.querySelector('[data-validation-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
      return;
    }
    setErrors({});
    if (openPreview && autoPrint) {
      setAutoPrintPreview(true);
      setPreviewRedirectOnClose(true);
      setShowPreview(true);
    }
    setSaveLoading(true);
    try {
      const rememberedCustomer = await rememberCustomerForPhone(getEffectiveCustomer());
      const payload = buildPayload(rememberedCustomer);
      let savedDoc;
      if (invoiceId) {
        if (documentType === 'credit-note')           savedDoc = await api.updateCreditNote(invoiceId, payload);
        else if (documentType === 'debit-note')       savedDoc = await api.updateDebitNote(invoiceId, payload);
        else if (documentType === 'delivery-challan') savedDoc = await api.updateChallan(invoiceId, payload);
        else if (documentType === 'e-invoice')        savedDoc = await api.updateEInvoice(invoiceId, payload);
        else if (documentType === 'e-way-bill')       savedDoc = await api.updateEWayBill(invoiceId, payload);
        else                                          savedDoc = await api.updateInvoice(invoiceId, payload);
      } else {
        if (documentType === 'credit-note')           savedDoc = await api.createCreditNote(payload);
        else if (documentType === 'debit-note')       savedDoc = await api.createDebitNote(payload);
        else if (documentType === 'delivery-challan') savedDoc = await api.createChallan(payload);
        else if (documentType === 'e-invoice')        savedDoc = await api.createEInvoice(payload);
        else if (documentType === 'e-way-bill')       savedDoc = await api.createEWayBill(payload);
        else                                          savedDoc = await api.createInvoice(payload);
      }
      if (savedDoc?._id) setSavedInvoiceId(savedDoc._id);
      if (openPreview) {
        if (!autoPrint) setAutoPrintPreview(false);
        setPreviewRedirectOnClose(true);
        setShowPreview(true);
      } else {
        window.location.assign(LIST_ROUTES[documentType] ?? '#/billing/invoice');
      }
    } catch (err) {
      setSaveError(err.message || 'Unable to save');
    } finally {
      setSaveLoading(false);
    }
  }

  function handlePrintBill() {
    setSaveError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTimeout(() => document.querySelector('[data-validation-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
      return;
    }

    setErrors({});
    flushSync(() => {
      setAutoPrintPreview(false);
      setPreviewRedirectOnClose(false);
      setShowPreview(true);
    });
    window.focus();
    window.print();
    setShowPrintConfirm(true);
  }

  function handleSharePdf() {
    setShowShare(false);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTimeout(() => document.querySelector('[data-validation-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
      return;
    }
    setErrors({});
    setDownloadPdfMode(true);
    setAutoPrintPreview(false);
    setPreviewRedirectOnClose(false);
    setShowPreview(true);
  }

  function handleShareEmail() {
    setShowShare(false);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTimeout(() => document.querySelector('[data-validation-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
      return;
    }
    setErrors({});
    setEmailTo(getEffectiveCustomer().email || '');
    setEmailResult(null);
    setShowEmailModal(true);
  }

  async function handleSendEmail() {
    if (!emailTo.trim()) return;
    setEmailSending(true);
    setEmailResult(null);
    try {
      const rememberedCustomer = await rememberCustomerForPhone(getEffectiveCustomer());
      const payload = buildPayload(rememberedCustomer);
      let docId = savedInvoiceId || invoiceId;
      if (!docId) {
        const saved = await api.createInvoice(payload);
        docId = saved._id;
        if (docId) setSavedInvoiceId(docId);
      } else {
        await api.updateInvoice(docId, payload);
      }
      await api.sendInvoiceEmail(docId, { toEmail: emailTo.trim() });
      setEmailResult({ ok: true, msg: `Invoice sent to ${emailTo.trim()}` });
    } catch (err) {
      setEmailResult({ ok: false, msg: err.message || 'Failed to send email' });
    } finally {
      setEmailSending(false);
    }
  }

  function updateTds(field, value) {
    setTds((p) => {
      const next = { ...p, [field]: value };
      if (field === 'section') {
        const sec = TDS_SECTIONS.find((s) => s.code === value);
        if (sec) next.rate = sec.rate;
      }
      return next;
    });
  }

  function addCustomField() { setCustomFields((prev) => [...prev, { id: Date.now(), key: '', value: '' }]); }
  function updateCustomField(id, field, value) { setCustomFields((prev) => prev.map((f) => f.id === id ? { ...f, [field]: value } : f)); }
  function removeCustomField(id) { setCustomFields((prev) => prev.filter((f) => f.id !== id)); }

  function selectPaymentMethod(id) {
    setSelectedPayment((prev) => (prev === id ? null : id));
    setPaymentData((p) => ({ ...p, amount: p.amount || String(totals.balanceDue) }));
  }

  const filteredCustomers = customers.filter((c) =>
    !customerQuery ||
    (c.name || '').toLowerCase().includes(customerQuery.toLowerCase()) ||
    (c.gstin || '').toLowerCase().includes(customerQuery.toLowerCase()),
  );

  const gstinValid = customer.gstin.length === 15;

  const phoneDigits = customer.phone.replace(/\D/g, '');
  const matchingByPhone = phoneDigits.length >= 3
    ? customers.filter((c) => (c.phone || '').replace(/\D/g, '').includes(phoneDigits))
    : [];

  useEffect(() => {
    if (documentType !== 'invoice') return;
    const digits = phoneDigits.slice(-10);
    if (digits.length < 10) return;
    const match = customers.find((c) => (c.phone || '').replace(/\D/g, '').slice(-10) === digits);
    if (match && ['name', 'gstin', 'email', 'address', 'city', 'state', 'pincode'].some((field) => (match[field] || '') !== (customer[field] || ''))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      selectCustomer(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneDigits, customers, documentType]);

  useEffect(() => {
    if (documentType !== 'invoice') return undefined;
    const digits = phoneDigits.slice(-10);
    if (digits.length < 10) return undefined;
    if (customers.some((c) => phoneKey(c.phone) === digits)) return undefined;

    let active = true;
    async function findCustomerByPhone() {
      try {
        const result = await api.listCustomers(digits);
        if (!active) return;
        const rows = Array.isArray(result) ? result : result?.data;
        const match = (Array.isArray(rows) ? rows : [])
          .map(normalizeCustomer)
          .find((c) => phoneKey(c.phone) === digits);
        if (!match) return;
        setCustomers((prev) => prev.some((c) => phoneKey(c.phone) === digits) ? prev : [...prev, match]);
        if (!customer.name.trim()) selectCustomer(match);
      } catch (err) {
        console.warn('Unable to find customer by phone', err);
      }
    }
    findCustomerByPhone();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneDigits, documentType]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const customerData = await api.listCustomers();
        if (active) {
          const rows = Array.isArray(customerData) ? customerData : customerData?.data;
          setCustomers(Array.isArray(rows) ? rows.map(normalizeCustomer) : []);
        }
      } catch (err) {
        console.warn('Unable to load customers', err);
        if (active) setCustomers([]);
      }

      try {
        const biz = await api.getSettings();
        if (active) setBizSettings(biz);
      } catch (err) {
        console.warn('Unable to load business settings', err);
      }

      try {
        const [salesData, invData] = await Promise.allSettled([
          api.listProducts(),
          api.invListProducts(),
        ]);
        const salesRows = salesData.status === 'fulfilled'
          ? (Array.isArray(salesData.value) ? salesData.value : salesData.value?.data)
          : [];
        const invRows = invData.status === 'fulfilled'
          ? (Array.isArray(invData.value) ? invData.value : invData.value?.data)
          : [];
        const sales = Array.isArray(salesRows) ? salesRows.map(normalizeProduct).filter((p) => p.description) : [];
        const inv   = Array.isArray(invRows)   ? invRows.map(normalizeProduct).filter((p) => p.description)   : [];
        const normalizedInv = inv
          .filter((p) => !sales.some((s) => (s.code && p.code && s.code === p.code) || s.description === p.description))
          .map((p) => ({ ...p, hsn: p.hsn ?? '' }));
        if (active) setProducts([...sales, ...normalizedInv]);
      } catch (err) {
        console.warn('Unable to load products', err);
        if (active) setProducts([]);
      }
    }

    loadData();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!invoiceId) {
      async function loadNextNumber() {
        try {
          let next;
          if (documentType === 'credit-note')           next = await api.getCreditNoteNextNumber();
          else if (documentType === 'debit-note')       next = await api.getDebitNoteNextNumber();
          else if (documentType === 'delivery-challan') next = await api.getChallanNextNumber();
          else if (documentType === 'e-invoice')        next = await api.getEInvoiceNextNumber();
          else if (documentType === 'e-way-bill')       next = await api.getEWayBillNextNumber();
          else                                          next = await api.getNextNumber(config.prefix);
          if (next?.number) updateMeta('number', next.number);
        } catch (err) {
          console.warn('Unable to load next number', err);
        }
      }
      loadNextNumber();
      return;
    }

    function hydrateInvoice(invoice) {
      setCustomer({
        name: invoice.customer?.name || '',
        gstin: invoice.customer?.gstin || '',
        phone: invoice.customer?.phone || '',
        email: invoice.customer?.email || '',
        address: invoice.customer?.address || '',
        city: invoice.customer?.city || '',
        state: invoice.customer?.state || BUSINESS_STATE,
        pincode: invoice.customer?.pincode || '',
      });
      setDocMeta({
        number: invoice.number || `${config.prefix}-0001`,
        date: invoice.meta?.date || defaultInvoiceDate,
        dueDate: invoice.meta?.dueDate || addDaysInput(invoice.meta?.date || defaultInvoiceDate, invoice.meta?.paymentTerms || defaultPaymentTerms),
        poRef: invoice.meta?.poRef || '',
        placeOfSupply: invoice.meta?.placeOfSupply || BUSINESS_STATE,
        invoiceType: invoice.meta?.invoiceType || 'regular',
        rcm: invoice.meta?.rcm || false,
        paymentTerms: invoice.meta?.paymentTerms || defaultPaymentTerms,
      });
      setSupplyType(invoice.supplyType || 'intrastate');
      setItems((Array.isArray(invoice.items) ? invoice.items : []).map((item, index) => ({ id: item.id ?? index + 1, ...item })));
      setCharges(Array.isArray(invoice.charges) ? invoice.charges : []);
      setAddDiscount(invoice.additionalDiscount ?? { type: 'percent', value: '' });
      setTds(invoice.tds ?? { enabled: false, section: '194C', rate: 2 });
      setTcs(invoice.tcs ?? { enabled: false, rate: 1 });
      setAdvanceAmt(invoice.advanceReceived != null ? String(invoice.advanceReceived) : '');
      setNotes(invoice.notes || '');
      setInternalNotes(invoice.internalNotes || '');
      setTerms(invoice.terms || '');
      setCustomFields(Array.isArray(invoice.customFields) ? invoice.customFields : []);
      setRecurring(invoice.recurring ?? { enabled: false, frequency: 'monthly', endAfter: '', endDate: '' });
      setSameShipping(invoice.shipping?.sameAsBilling !== false);
      setShipping({
        address: invoice.shipping?.address || '',
        city: invoice.shipping?.city || '',
        state: invoice.shipping?.state || BUSINESS_STATE,
        pincode: invoice.shipping?.pincode || '',
      });
      setDocExtra({
        validTill: '', expectedDelivery: '', deliveryAddress: '',
        originalInvoiceNo: '', originalInvoiceDate: '', reason: '',
        vehicleNumber: '', driverName: '', transporter: '',
        transporterId: '', distanceKm: '', ewbSupplyType: 'outward',
        irnNumber: '', ackNumber: '', ackDate: '',
        ...(invoice.extra ?? {}),
      });
    }

    async function loadInvoice() {
      setInvoiceLoading(true);
      setLoadError('');
      try {
        let invoice;
        if (documentType === 'credit-note')           invoice = await api.getCreditNote(invoiceId);
        else if (documentType === 'debit-note')       invoice = await api.getDebitNote(invoiceId);
        else if (documentType === 'delivery-challan') invoice = await api.getChallan(invoiceId);
        else if (documentType === 'e-invoice')        invoice = await api.getEInvoice(invoiceId);
        else if (documentType === 'e-way-bill')       invoice = await api.getEWayBill(invoiceId);
        else                                          invoice = await api.getInvoice(invoiceId);
        hydrateInvoice(invoice);
      } catch (err) {
        setLoadError(err.message || 'Unable to load document');
      } finally {
        setInvoiceLoading(false);
      }
    }

    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, config.prefix]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  // Stash the latest values in a ref so the listener (registered once) always
  // sees fresh state/handlers without needing to re-bind on every keystroke.
  const shortcutState = useRef(null);
  useEffect(() => {
    shortcutState.current = { showPreview, previewRedirectOnClose, showShare, saveLoading, handleSave, handlePrintBill, addItem };
  });

  useEffect(() => {
    function handleKeyDown(e) {
      const { showPreview, previewRedirectOnClose, showShare, saveLoading, handleSave, handlePrintBill, addItem } = shortcutState.current;
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        if (showPreview) {
          setShowPreview(false);
          if (previewRedirectOnClose) {
            window.location.assign(LIST_ROUTES[documentType] ?? '#/billing/invoice');
          }
        }
        else if (showShare) setShowShare(false);
        return;
      }

      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!saveLoading) handleSave();
        return;
      }

      if (mod && e.key === 'Enter') {
        e.preventDefault();
        if (!saveLoading) handleSave();
        return;
      }

      if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (!saveLoading) handlePrintBill();
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addItem();
        return;
      }

      // Function-key shortcuts (no modifier) — actions vary by documentType
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const NEW_ROUTES = { invoice: '#/billing/invoice/new', quotation: '#/billing/quotation/new', 'purchase-order': '#/billing/purchase-order/new', 'credit-note': '#/billing/credit-note/new', 'debit-note': '#/billing/debit-note/new', 'delivery-challan': '#/billing/delivery-challan/new', 'e-invoice': '#/billing/e-invoice/new', 'e-way-bill': '#/billing/e-way-bill/new' };
        const F7_FKEY = { invoice: null, quotation: 'valid-till', 'purchase-order': 'expected-delivery', 'credit-note': 'ref-invoice', 'debit-note': 'ref-invoice', 'delivery-challan': 'vehicle', 'e-invoice': 'irn', 'e-way-bill': 'vehicle' };
        const F8_FKEY = { invoice: 'notes', quotation: 'notes', 'purchase-order': 'notes', 'credit-note': 'reason', 'debit-note': 'reason', 'delivery-challan': 'transporter', 'e-invoice': 'notes', 'e-way-bill': 'distance' };
        if (e.key === 'F1')  { e.preventDefault(); window.location.assign(NEW_ROUTES[documentType] ?? '#/billing/invoice/new'); return; }
        if (e.key === 'F2')  { e.preventDefault(); if (!saveLoading) handleSave(); return; }
        if (e.key === 'F3')  { e.preventDefault(); setAutoPrintPreview(false); setShowPreview(true); return; }
        if (e.key === 'F4')  { e.preventDefault(); if (!saveLoading) handlePrintBill(); return; }
        if (e.key === 'F5')  { e.preventDefault(); addItem(); return; }
        if (e.key === 'F6')  { e.preventDefault(); document.querySelector('[data-fkey="party"]')?.focus(); return; }
        if (e.key === 'F7')  { e.preventDefault(); const f7k = F7_FKEY[documentType]; if (f7k) { document.querySelector(`[data-fkey="${f7k}"]`)?.focus(); } else { setShowAddDiscount((v) => !v); } return; }
        if (e.key === 'F8')  { e.preventDefault(); const n = document.querySelector(`[data-fkey="${F8_FKEY[documentType] ?? 'notes'}"]`); n?.scrollIntoView({ behavior: 'smooth', block: 'center' }); n?.focus(); return; }
        if (e.key === 'F9')  { e.preventDefault(); setShowShare((v) => !v); return; }
        if (e.key === 'F10') { e.preventDefault(); window.location.assign('#/dashboard'); return; }
        if (e.key === 'F11') { e.preventDefault(); window.location.assign('#business-settings'); return; }
        if (e.key === 'F12') { e.preventDefault(); window.location.assign(LIST_ROUTES[documentType] ?? '#/billing/invoice'); }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (invoiceLoading) {
    return (
      <div className="p-4 md:p-7">
        <div className="rounded-lg border border-[#dfe7f1] bg-white p-6 text-sm text-[#374151]">Loading invoice…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 md:p-7">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{loadError}</div>
      </div>
    );
  }

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-7 pb-32">

      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1 text-[13px] text-[#536173] flex-wrap">
            <a className="text-blue-600 no-underline hover:underline" href="#/dashboard">Home</a>
            <span>›</span><span>Sales</span><span>›</span>
            <a className="text-blue-600 no-underline hover:underline" href={LIST_ROUTES[documentType] ?? '#/billing/invoice'}>{config.title}s</a>
            <span>›</span><span>{invoiceId ? `Edit ${config.title}` : `New ${config.title}`}</span>
          </nav>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="m-0 text-[22px] font-bold">{config.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Share */}
          <div className="relative" tabIndex={-1} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowShare(false); }}>
            <button className={cx.btnOutline} type="button" onClick={() => setShowShare((v) => !v)}>
              <svg fill="none" height="15" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
              Share
              <svg fill="none" height="12" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="12"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {showShare && (
              <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-[#dde6f2] rounded-lg shadow-lg py-1" style={{ minWidth: 200 }}>
                {SHARE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] hover:bg-gray-50 cursor-pointer border-0 bg-transparent font-[inherit]"
                    type="button"
                    onClick={() => {
                      if (opt.id === 'pdf') { handleSharePdf(); }
                      else if (opt.id === 'email') { handleShareEmail(); }
                      else { setShowShare(false); }
                    }}
                  >
                    <span className="flex-none" style={{ color: opt.color }}>{opt.icon}</span>
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium text-[#111827]">{opt.label}</span>
                      <span className="text-xs text-[#536173]">{opt.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={cx.btnOutline} type="button" disabled={saveLoading} onClick={handlePrintBill} title="Print Bill (Ctrl+P)">
            <svg fill="none" height="15" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect height="8" width="12" x="6" y="14" /></svg>
            {saveLoading ? 'Saving...' : 'Print'}
          </button>
          <button className={cx.btnOutline} type="button" onClick={() => { setAutoPrintPreview(false); setShowPreview(true); }} title="Preview PDF">
            <svg fill="none" height="15" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            Preview PDF
          </button>
          <button className={cx.btnPrimary} type="button" disabled={saveLoading} onClick={() => handleSave()} title={`${config.buttonText} (Ctrl+S)`}>
            <svg fill="none" height="15" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            {saveLoading ? 'Saving…' : config.buttonText}
          </button>
        </div>
        {saveError && (
          <div className="mt-3 rounded-md bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{saveError}</div>
        )}
      </div>

      {/* ── Validation Error Banner ── */}
      {Object.keys(errors).length > 0 && (
        <div data-validation-error className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 flex items-start gap-3">
          <svg className="flex-none text-red-500 mt-0.5" fill="none" height="16" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="16">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <div className="flex flex-col gap-1">
            <div className="text-[13px] font-semibold text-red-700">Please fix the following before saving:</div>
            <ul className="m-0 pl-0 list-none flex flex-col gap-0.5">
              {errors.customerName     && <li className="text-[12px] text-red-600">• {errors.customerName}</li>}
              {errors.invoiceNumber   && <li className="text-[12px] text-red-600">• {errors.invoiceNumber}</li>}
              {errors.invoiceDate     && <li className="text-[12px] text-red-600">• {errors.invoiceDate}</li>}
              {errors.items           && <li className="text-[12px] text-red-600">• {errors.items}</li>}
              {errors.reason          && <li className="text-[12px] text-red-600">• {errors.reason}</li>}
              {errors.originalInvoiceNo && <li className="text-[12px] text-amber-700">• {errors.originalInvoiceNo}</li>}
              {errors.customerGstin   && <li className="text-[12px] text-red-600">• {errors.customerGstin}</li>}
              {errors.vehicleNumber   && <li className="text-[12px] text-red-600">• {errors.vehicleNumber}</li>}
              {errors.transporter     && <li className="text-[12px] text-red-600">• {errors.transporter}</li>}
              {errors.distanceKm      && <li className="text-[12px] text-red-600">• {errors.distanceKm}</li>}
              {errors.validTill       && <li className="text-[12px] text-amber-700">• {errors.validTill}</li>}
              {errors.expectedDelivery && <li className="text-[12px] text-amber-700">• {errors.expectedDelivery}</li>}
            </ul>
          </div>
        </div>
      )}

      {/* ── Document Card ── */}
      <div className="bg-white border border-[#dfe7f1] rounded-lg">

        {/* ── Parties + Meta ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 border-b border-[#edf2f7]">

          {/* Bill From */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase text-[#536173] tracking-wide mb-1">Bill From</div>
            <div className="flex items-start gap-3">
              {bizSettings.logoUrl ? (
                <img src={`${SERVER_ORIGIN}${bizSettings.logoUrl}`} alt="logo" className="w-12 h-12 rounded-lg object-contain border border-[#dbe4ef] flex-none" />
              ) : (
                <div className="w-12 h-12 rounded-lg border-2 border-dashed border-[#dbe4ef] flex flex-col items-center justify-center flex-none gap-0.5">
                  <svg fill="none" height="16" stroke="#94a3b8" strokeWidth="1.5" viewBox="0 0 24 24" width="16"><rect height="18" rx="2" ry="2" width="18" x="3" y="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  <span className="text-[9px] text-[#94a3b8] font-medium">LOGO</span>
                </div>
              )}
              <div>
                <div className="text-base font-bold text-[#111827]">{bizSettings.businessName || '—'}</div>
                {bizSettings.gstin && <div className="text-[12px] text-[#374151] font-mono">GSTIN: {bizSettings.gstin}</div>}
              </div>
            </div>
            {bizSettings.address && <div className="text-[13px] text-[#374151]">{bizSettings.address}</div>}
            {(bizSettings.businessEmail || bizSettings.phone) && (
              <div className="text-[13px] text-[#536173]">
                {[bizSettings.businessEmail, bizSettings.phone].filter(Boolean).join(' · ')}
              </div>
            )}
            <a href="#business-settings" className="text-[12px] text-blue-600 text-left hover:underline p-0 mt-1">Edit Business Profile →</a>
          </div>

          {/* Bill To — with customer search */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase text-[#536173] tracking-wide mb-1">{config.partyToLabel}</div>

            {documentType === 'invoice' ? (
              <>
                {/* Phone-based customer lookup */}
                <div className={cx.field}>
                  <label className={cx.label}>Customer Phone <span className="text-[10px] text-[#94a3b8] font-normal ml-1">(optional)</span></label>
                  <div
                    className="relative"
                    tabIndex={-1}
                    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowPhoneDrop(false); }}
                  >
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                    <input
                      className="border border-[#dbe4ef] rounded-md pl-8 pr-3 py-2 text-[13px] text-[#111827] w-full outline-none focus:border-blue-500 font-[inherit]"
                      placeholder="Enter phone number to find customer"
                      value={customer.phone}
                      onFocus={() => setShowPhoneDrop(true)}
                      onChange={(e) => { updateInvoiceCustomerField('phone', e.target.value); setShowPhoneDrop(true); }}
                    />
                    {showPhoneDrop && matchingByPhone.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-[#dde6f2] rounded-lg shadow-lg py-1 max-h-56 overflow-y-auto">
                        {matchingByPhone.map((c) => (
                          <button
                            key={c._id ?? c.phone}
                            type="button"
                            className="w-full flex flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-[#f8fafc] cursor-pointer border-0 bg-transparent font-[inherit]"
                            onMouseDown={() => { selectCustomer(c); setShowPhoneDrop(false); }}
                          >
                            <span className="text-[13px] font-medium text-[#111827]">{c.name}</span>
                            <span className="text-[11px] text-[#94a3b8] font-mono">{c.phone} · {c.city}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-[#94a3b8]">Matching customer details fill in automatically.</span>
                </div>

                {false && customer.name ? (
                  <div className="bg-[#fafbfe] border border-[#edf2f7] rounded-lg px-4 py-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#111827]">{customer.name}</span>
                      <button type="button" className="text-[11px] text-blue-600 hover:underline cursor-pointer bg-transparent border-0 font-[inherit] p-0" onClick={clearCustomer}>
                        Change
                      </button>
                    </div>
                    {customer.gstin && <div className="text-[12px] text-[#374151] font-mono">GSTIN: {customer.gstin}</div>}
                    {customer.email && <div className="text-[12px] text-[#536173]">{customer.email}</div>}
                    {(customer.address || customer.city || customer.state || customer.pincode) && (
                      <div className="text-[12px] text-[#536173]">
                        {[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <div className="grid grid-cols-1 gap-2.5 items-end">
                      <div className={cx.field}>
                        <label className={cx.label}>Customer Name *</label>
                        <input data-fkey="party" className={errors.customerName ? cx.inputError : cx.input} placeholder="Type customer name" value={newCustomerForm.name} onChange={(e) => updateNewCustomer('name', e.target.value)} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5 border border-[#edf2f7] rounded-lg p-3.5 bg-[#fafbfe]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className={cx.field}>
                        <label className={cx.label}>GSTIN</label>
                        <input className={cx.input} maxLength={15} placeholder="15-digit GSTIN" value={newCustomerForm.gstin} onChange={(e) => updateNewCustomer('gstin', e.target.value.toUpperCase())} />
                      </div>
                      <div className={cx.field}>
                        <label className={cx.label}>Email</label>
                        <input className={cx.input} placeholder="customer@email.com" type="email" value={newCustomerForm.email} onChange={(e) => updateNewCustomer('email', e.target.value)} />
                      </div>
                    </div>
                    <div className={cx.field}>
                      <label className={cx.label}>Billing Address</label>
                      <input className={cx.input} placeholder="Street / Building / Area" value={newCustomerForm.address} onChange={(e) => updateNewCustomer('address', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className={cx.field}>
                        <label className={cx.label}>City</label>
                        <input className={cx.input} placeholder="City" value={newCustomerForm.city} onChange={(e) => updateNewCustomer('city', e.target.value)} />
                      </div>
                      <div className={cx.field}>
                        <label className={cx.label}>State</label>
                        <select className={cx.select} value={newCustomerForm.state} onChange={(e) => updateNewCustomer('state', e.target.value)}>
                          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className={cx.field}>
                        <label className={cx.label}>PIN Code</label>
                        <input className={cx.input} maxLength={6} placeholder="400000" value={newCustomerForm.pincode} onChange={(e) => updateNewCustomer('pincode', e.target.value)} />
                      </div>
                    </div>
                    {customerSaveError && <div className="text-[12px] text-red-600">{customerSaveError}</div>}
                    <div className="flex items-center gap-2 mt-1">
                      {!customer.name && (
                      <button type="button" className={cx.btnPrimary} disabled={customerSaving} onClick={handleCreateCustomer}>
                        {customerSaving ? 'Saving…' : 'Save Customer'}
                      </button>
                      )}
                      {(customer.name || newCustomerForm.name) && (
                        <button type="button" className={cx.btnOutline} onClick={clearCustomer}>
                          Clear
                        </button>
                      )}
                    </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
            <>
            {/* Customer name with search dropdown */}
            <div className={cx.field}>
              <label className={cx.label}>{config.partyNameLabel}</label>
              <div
                className="relative"
                tabIndex={-1}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowCustomerDrop(false); }}
              >
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                <input
                  data-fkey="party"
                  className={`border ${errors.customerName ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-[#dbe4ef] focus:border-blue-500'} rounded-md pl-8 pr-3 py-2 text-[13px] text-[#111827] w-full outline-none font-[inherit]`}
                  placeholder="Search or enter customer name"
                  value={customerQuery || customer.name}
                  onFocus={() => { setShowCustomerDrop(true); setCustomerQuery(''); }}
                  onChange={(e) => { setCustomerQuery(e.target.value); updateCustomer('name', e.target.value); clearError('customerName'); }}
                />

                {showCustomerDrop && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-[#dde6f2] rounded-lg shadow-lg py-1 max-h-56 overflow-y-auto">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-[#f1f5f9]">
                      <Search size={12} className="text-[#94a3b8] flex-none" />
                      <input
                        className="flex-1 text-[13px] outline-none font-[inherit] text-[#111827]"
                        placeholder="Search by name or GSTIN…"
                        value={customerQuery}
                        onChange={(e) => { setCustomerQuery(e.target.value); updateCustomer('name', e.target.value); clearError('customerName'); }}
                      />
                    </div>
                    {filteredCustomers.length === 0 ? (
                      <div className="px-4 py-3 text-[13px] text-[#536173]">No customers found</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full flex flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-[#f8fafc] cursor-pointer border-0 bg-transparent font-[inherit]"
                          onMouseDown={() => selectCustomer(c)}
                        >
                          <span className="text-[13px] font-medium text-[#111827]">{c.name}</span>
                          <span className="text-[11px] text-[#94a3b8] font-mono">{c.gstin} · {c.city}</span>
                        </button>
                      ))
                    )}
                    <div className="border-t border-[#edf2f7] mt-1 pt-1">
                      <button type="button" className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-blue-600 font-medium hover:bg-blue-50 cursor-pointer border-0 bg-transparent font-[inherit]">
                        <UserPlus size={13} /> Add New Customer
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errors.customerName && (
                <p className="text-[11px] text-red-600 flex items-center gap-1 mt-0.5"><span>⚠</span> {errors.customerName}</p>
              )}
            </div>

            {/* Phone + GSTIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={cx.field}>
                <label className={cx.label}>Phone</label>
                <input className={cx.input} placeholder="+91 XXXXX XXXXX" value={customer.phone} onChange={(e) => updateCustomer('phone', e.target.value)} />
              </div>
              <div className={cx.field}>
                <label className={cx.label}>
                  GSTIN{' '}
                  {documentType === 'e-invoice'
                    ? <span className="text-red-500 ml-0.5">*</span>
                    : <span className="text-[10px] text-[#94a3b8] font-normal ml-1">(optional — required for B2B)</span>}
                </label>
                <div className="relative">
                  <input
                    className={`${errors.customerGstin ? cx.inputError : cx.input} pr-8 ${gstinValid ? 'border-green-400' : ''}`}
                    maxLength={15}
                    placeholder="15-digit GSTIN"
                    value={customer.gstin}
                    onChange={(e) => updateCustomer('gstin', e.target.value.toUpperCase())}
                  />
                  {gstinValid && <CheckCircle2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />}
                </div>
                {gstinValid && (
                  <button type="button" className="text-[11px] text-blue-600 text-left cursor-pointer hover:underline bg-transparent border-0 font-[inherit] p-0 flex items-center gap-1">
                    <RefreshCw size={10} /> Fetch from GST Portal
                  </button>
                )}
                {errors.customerGstin && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1">⚠ {errors.customerGstin}</p>
                )}
              </div>
            </div>

            <div className={cx.field}>
              <label className={cx.label}>Email <span className="text-[10px] text-[#94a3b8] font-normal ml-1">(optional)</span></label>
              <input className={cx.input} placeholder="customer@email.com" type="email" value={customer.email} onChange={(e) => updateCustomer('email', e.target.value)} />
            </div>

            <div className={cx.field}>
              <label className={cx.label}>Billing Address <span className="text-[10px] text-[#94a3b8] font-normal ml-1">(optional)</span></label>
              <input className={cx.input} placeholder="Street / Building / Area" value={customer.address} onChange={(e) => updateCustomer('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={cx.field}>
                <label className={cx.label}>City</label>
                <input className={cx.input} placeholder="City" value={customer.city} onChange={(e) => updateCustomer('city', e.target.value)} />
              </div>
              <div className={cx.field}>
                <label className={cx.label}>State</label>
                <select className={cx.select} value={customer.state} onChange={(e) => updateCustomer('state', e.target.value)}>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={cx.field}>
                <label className={cx.label}>PIN Code</label>
                <input className={cx.input} maxLength={6} placeholder="400000" value={customer.pincode} onChange={(e) => updateCustomer('pincode', e.target.value)} />
              </div>
            </div>
            </>
            )}

            {/* Shipping toggle */}
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                checked={!sameShipping}
                className="w-4 h-4 rounded border-[#dbe4ef] accent-blue-600"
                type="checkbox"
                onChange={(e) => setSameShipping(!e.target.checked)}
              />
              <span className="text-[13px] text-[#374151]">Ship to a different address</span>
            </label>

            {config.showDeliveryAddress && (
              <div className={cx.field}>
                <label className={cx.label}>Delivery Address</label>
                <input className={cx.input} placeholder="Delivery location (if different from billing)" value={docExtra.deliveryAddress} onChange={(e) => updateExtra('deliveryAddress', e.target.value)} />
              </div>
            )}
          </div>

          {/* Invoice Meta */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="inline-block text-xs font-bold uppercase text-blue-700 bg-[#eef5ff] rounded-md px-2.5 py-1.5">{config.title}</span>
              {documentType === 'e-way-bill' && (
                <a
                  href="https://ewaybillgst.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 no-underline"
                >
                  <svg fill="none" height="12" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="12"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                  Open EWB Portal →
                </a>
              )}
            </div>

            <div className={cx.field}>
              <label className={cx.label}>{config.title} No. <span className="text-red-500 ml-0.5">*</span></label>
              <input className={errors.invoiceNumber ? cx.inputError : cx.input} value={docMeta.number} onChange={(e) => { updateMeta('number', e.target.value); clearError('invoiceNumber'); }} />
              {errors.invoiceNumber && <p className="text-[11px] text-red-600 flex items-center gap-1"><span>⚠</span> {errors.invoiceNumber}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={cx.field}>
                <label className={cx.label}>{config.dateLabel} <span className="text-red-500 ml-0.5">*</span></label>
                <input className={errors.invoiceDate ? cx.inputError : cx.input} type="date" value={docMeta.date} onChange={(e) => { updateMeta('date', e.target.value); clearError('invoiceDate'); }} />
                {errors.invoiceDate && <p className="text-[11px] text-red-600 flex items-center gap-1"><span>⚠</span> {errors.invoiceDate}</p>}
              </div>
              {config.showDueDate && (
                <div className={cx.field}>
                  <label className={cx.label}>Due Date <span className="text-[10px] text-[#94a3b8] font-normal ml-1">(optional)</span></label>
                  <input className={cx.input} type="date" value={docMeta.dueDate} onChange={(e) => updateMeta('dueDate', e.target.value)} />
                </div>
              )}
              {config.showValidTill && (
                <div className={cx.field}>
                  <label className={cx.label}>Valid Till <span className="text-[10px] text-amber-600 font-normal ml-1">(recommended)</span></label>
                  <input data-fkey="valid-till" className={errors.validTill ? cx.inputError : cx.input} type="date" value={docExtra.validTill} onChange={(e) => { updateExtra('validTill', e.target.value); clearError('validTill'); }} />
                  {errors.validTill && <p className="text-[11px] text-amber-700 flex items-center gap-1">⚠ {errors.validTill}</p>}
                </div>
              )}
              {config.showExpectedDelivery && (
                <div className={cx.field}>
                  <label className={cx.label}>Expected Delivery <span className="text-[10px] text-amber-600 font-normal ml-1">(recommended)</span></label>
                  <input data-fkey="expected-delivery" className={errors.expectedDelivery ? cx.inputError : cx.input} type="date" value={docExtra.expectedDelivery} onChange={(e) => { updateExtra('expectedDelivery', e.target.value); clearError('expectedDelivery'); }} />
                  {errors.expectedDelivery && <p className="text-[11px] text-amber-700 flex items-center gap-1">⚠ {errors.expectedDelivery}</p>}
                </div>
              )}
            </div>

            <div className={cx.field}>
              <label className={cx.label}>PO / Reference No. <span className="text-[10px] text-[#94a3b8] font-normal ml-1">(optional)</span></label>
              <input className={cx.input} placeholder="PO or reference number" value={docMeta.poRef} onChange={(e) => updateMeta('poRef', e.target.value)} />
            </div>

            {config.showGst && (
              <>
                {/* Invoice Type */}
                <div className={cx.field}>
                  <label className={cx.label}>Invoice Type</label>
                  <select className={cx.select} value={docMeta.invoiceType} onChange={(e) => updateMeta('invoiceType', e.target.value)}>
                    {INVOICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {/* Payment Terms */}
                <div className={cx.field}>
                  <label className={cx.label}>Payment Terms</label>
                  <select className={cx.select} value={docMeta.paymentTerms} onChange={(e) => updateMeta('paymentTerms', e.target.value)}>
                    {PAYMENT_TERMS_LIST.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {/* Place of Supply + GST Type */}
                <div className={cx.field}>
                  <label className={cx.label}>Place of Supply</label>
                  <select className={cx.select} value={docMeta.placeOfSupply} onChange={(e) => updateMeta('placeOfSupply', e.target.value)}>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={cx.field}>
                  <label className={cx.label}>GST Type</label>
                  <div className="flex rounded-md border border-[#dbe4ef] overflow-hidden">
                    <button className={cx.toggleBtn(supplyType === 'intrastate')} type="button" onClick={() => setSupplyType('intrastate')}>Intrastate</button>
                    <button className={cx.toggleBtn(supplyType === 'interstate')} type="button" onClick={() => setSupplyType('interstate')}>Interstate</button>
                  </div>
                </div>

                {/* RCM toggle */}
                <label className="flex items-center justify-between cursor-pointer bg-[#fafbfe] rounded-md border border-[#edf2f7] px-3 py-2.5">
                  <div>
                    <div className="text-[13px] font-medium text-[#374151]">Reverse Charge (RCM)</div>
                    <div className="text-[11px] text-[#536173]">Tax payable by recipient</div>
                  </div>
                  <div
                    className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex-none ${docMeta.rcm ? 'bg-blue-600' : 'bg-[#dbe4ef]'}`}
                    onClick={() => updateMeta('rcm', !docMeta.rcm)}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${docMeta.rcm ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </>
            )}

            {config.showIRN && (
              <>
                <div className={cx.field}>
                  <label className={cx.label}>IRN Number <span className="text-[10px] text-[#94a3b8] font-normal ml-1">(optional — paste after generation)</span></label>
                  <input data-fkey="irn" className={cx.input} placeholder="64-character IRN from IRP" value={docExtra.irnNumber} onChange={(e) => updateExtra('irnNumber', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={cx.field}><label className={cx.label}>ACK Number</label><input className={cx.input} placeholder="ACK No." value={docExtra.ackNumber} onChange={(e) => updateExtra('ackNumber', e.target.value)} /></div>
                  <div className={cx.field}><label className={cx.label}>ACK Date</label><input className={cx.input} type="date" value={docExtra.ackDate} onChange={(e) => updateExtra('ackDate', e.target.value)} /></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Shipping Address (when different) ── */}
        {!sameShipping && (
          <div className="px-6 py-5 border-b border-[#edf2f7] bg-[#fafbfe]">
            <h3 className="m-0 text-[15px] font-semibold mb-4">Shipping Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className={cx.field}>
                <label className={cx.label}>Street / Building</label>
                <input className={cx.input} placeholder="Shipping address" value={shipping.address} onChange={(e) => setShipping((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className={cx.field}>
                <label className={cx.label}>City</label>
                <input className={cx.input} placeholder="City" value={shipping.city} onChange={(e) => setShipping((p) => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={cx.field}>
                <label className={cx.label}>State</label>
                <select className={cx.select} value={shipping.state} onChange={(e) => setShipping((p) => ({ ...p, state: e.target.value }))}>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={cx.field}>
                <label className={cx.label}>PIN Code</label>
                <input className={cx.input} maxLength={6} placeholder="400000" value={shipping.pincode} onChange={(e) => setShipping((p) => ({ ...p, pincode: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        {/* ── Original Invoice Ref (credit / debit notes) ── */}
        {config.showOriginalRef && (
          <div className="px-6 py-5 border-b border-[#edf2f7]">
            <h3 className="m-0 text-[15px] font-semibold mb-4">Original Invoice Reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={cx.field}>
                <label className={cx.label}>Original Invoice No. <span className="text-[10px] text-amber-600 font-normal ml-1">(recommended)</span></label>
                <input data-fkey="ref-invoice" className={errors.originalInvoiceNo ? 'border border-amber-400 bg-amber-50 rounded-md px-3 py-2 text-[13px] text-[#111827] w-full outline-none font-[inherit]' : cx.input} placeholder="e.g. INV-0001" value={docExtra.originalInvoiceNo} onChange={(e) => { updateExtra('originalInvoiceNo', e.target.value); clearError('originalInvoiceNo'); }} />
                {errors.originalInvoiceNo && <p className="text-[11px] text-amber-700 flex items-center gap-1">⚠ {errors.originalInvoiceNo}</p>}
              </div>
              <div className={cx.field}>
                <label className={cx.label}>Original Invoice Date <span className="text-[10px] text-[#94a3b8] font-normal ml-1">(optional)</span></label>
                <input className={cx.input} type="date" value={docExtra.originalInvoiceDate} onChange={(e) => updateExtra('originalInvoiceDate', e.target.value)} />
              </div>
              <div className={cx.field}>
                <label className={cx.label}>{config.reasonLabel} <span className="text-red-500 ml-0.5">*</span></label>
                <input data-fkey="reason" className={errors.reason ? cx.inputError : cx.input} placeholder="Reason for issuing this note" value={docExtra.reason} onChange={(e) => { updateExtra('reason', e.target.value); clearError('reason'); }} />
                {errors.reason && <p className="text-[11px] text-red-600 flex items-center gap-1">⚠ {errors.reason}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Transport Details ── */}
        {config.showTransport && (
          <div className="px-6 py-5 border-b border-[#edf2f7]">
            <h3 className="m-0 text-[15px] font-semibold mb-3">Transport Details</h3>
            {config.showEWayBillFields && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <svg className="flex-none text-blue-500 mt-0.5" fill="none" height="15" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                <div className="text-[12.5px] text-blue-800 leading-snug">
                  Fill the details below and save this record. Then visit the{' '}
                  <a href="https://ewaybillgst.gov.in" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-blue-700">
                    official EWB portal
                  </a>
                  {' '}to generate your E-Way Bill number, and paste it back here.
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={cx.field}>
                <label className={cx.label}>Vehicle Number {config.showEWayBillFields && <span className="text-red-500 ml-0.5">*</span>}</label>
                <input data-fkey="vehicle" className={errors.vehicleNumber ? cx.inputError : cx.input} placeholder="TN 01 AB 1234" value={docExtra.vehicleNumber} onChange={(e) => { updateExtra('vehicleNumber', e.target.value); clearError('vehicleNumber'); }} />
                {errors.vehicleNumber && <p className="text-[11px] text-red-600 flex items-center gap-1">⚠ {errors.vehicleNumber}</p>}
              </div>
              <div className={cx.field}>
                <label className={cx.label}>Driver Name <span className="text-[10px] text-[#94a3b8] font-normal ml-1">(optional)</span></label>
                <input className={cx.input} placeholder="Driver's name" value={docExtra.driverName} onChange={(e) => updateExtra('driverName', e.target.value)} />
              </div>
              <div className={cx.field}>
                <label className={cx.label}>Transporter {config.showEWayBillFields && <span className="text-red-500 ml-0.5">*</span>}</label>
                <input data-fkey="transporter" className={errors.transporter ? cx.inputError : cx.input} placeholder="Transport company name" value={docExtra.transporter} onChange={(e) => { updateExtra('transporter', e.target.value); clearError('transporter'); }} />
                {errors.transporter && <p className="text-[11px] text-red-600 flex items-center gap-1">⚠ {errors.transporter}</p>}
              </div>
            </div>
            {config.showEWayBillFields && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className={cx.field}>
                  <label className={cx.label}>Transporter GSTIN <span className="text-[10px] text-[#94a3b8] font-normal ml-1">(optional)</span></label>
                  <input className={cx.input} maxLength={15} placeholder="15-digit GSTIN" value={docExtra.transporterId} onChange={(e) => updateExtra('transporterId', e.target.value.toUpperCase())} />
                </div>
                <div className={cx.field}>
                  <label className={cx.label}>Distance (KM) <span className="text-red-500 ml-0.5">*</span></label>
                  <input data-fkey="distance" className={errors.distanceKm ? cx.inputError : cx.input} min="0" placeholder="0" type="number" value={docExtra.distanceKm} onChange={(e) => { updateExtra('distanceKm', e.target.value); clearError('distanceKm'); }} />
                  {errors.distanceKm && <p className="text-[11px] text-red-600 flex items-center gap-1">⚠ {errors.distanceKm}</p>}
                </div>
                <div className={cx.field}><label className={cx.label}>Supply Type</label><select className={cx.select} value={docExtra.ewbSupplyType} onChange={(e) => updateExtra('ewbSupplyType', e.target.value)}><option value="outward">Outward</option><option value="inward">Inward</option></select></div>
              </div>
            )}
          </div>
        )}

        {/* ── Items & Services ── */}
        <div className="px-6 py-5 border-b border-[#edf2f7]">
          <div className="mb-4">
            <h3 className="m-0 text-[15px] font-semibold">Items &amp; Services</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-245">
              <thead>
                <tr>
                  {[
                    { w: 32,  label: '#',          align: 'center' },
                    { w: null,label: 'Item Description', align: 'left' },
                    { w: 90,  label: 'HSN / SAC',  align: 'left' },
                    { w: 70,  label: 'Qty',         align: 'right' },
                    { w: 84,  label: 'Unit',        align: 'left' },
                    { w: 110, label: 'Rate (₹)',    align: 'right' },
                    { w: 70,  label: 'Disc %',      align: 'right' },
                    ...(config.showGst ? [
                      { w: 110, label: 'Taxable',   align: 'right' },
                      { w: 78,  label: 'GST %',     align: 'left' },
                      { w: 100, label: 'Tax Amt',   align: 'right' },
                    ] : []),
                    { w: 120, label: config.showGst ? 'Total (₹)' : 'Amount (₹)', align: 'right' },
                    { w: 38,  label: '',            align: 'center' },
                  ].map((col, i) => (
                    <th
                      key={i}
                      className={`text-xs font-semibold uppercase text-[#536173] pb-2 px-2 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                      style={col.w ? { width: col.w } : undefined}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const line = calcLine(item);

                  return (
                    <tr key={item.id}>
                      <td className="border-t border-[#edf2f7] py-2 px-2 align-top text-center text-[#536173] text-xs pt-3">{idx + 1}</td>

                      {/* Description – native product select */}
                      <td className="border-t border-[#edf2f7] py-2 px-2 align-top">
                        <select
                          className={`w-full border ${!item.description && errors.items ? 'border-red-400 bg-red-50' : 'border-[#dbe4ef]'} rounded px-2 py-1.5 text-[13px] text-[#111827] font-[inherit] outline-none bg-white focus:border-blue-500`}
                          value={item.description}
                          onChange={(e) => {
                            const chosen = products.find((p) => p.description === e.target.value);
                            if (chosen) selectProduct(item.id, chosen);
                          }}
                        >
                          <option value="">Select product…</option>
                          {products.map((p) => (
                            <option key={p._id ?? p.id} value={p.description}>{p.description}</option>
                          ))}
                        </select>
                      </td>

                      <td className="border-t border-[#edf2f7] py-2 px-2 align-top">
                        <input className="w-full border border-[#dbe4ef] rounded px-2 py-1.5 text-[13px] text-[#111827] font-[inherit] outline-none focus:border-blue-500 min-w-0" placeholder="HSN" value={item.hsn} onChange={(e) => updateItem(item.id, 'hsn', e.target.value)} />
                      </td>
                      <td className="border-t border-[#edf2f7] py-2 px-2 align-top">
                        <input className={`w-full border ${errors[`item_qty_${idx}`] ? 'border-red-400 bg-red-50' : 'border-[#dbe4ef]'} rounded px-2 py-1.5 text-[13px] text-right font-[inherit] outline-none focus:border-blue-500 min-w-0`} min="0" type="number" value={item.qty} onChange={(e) => { updateItem(item.id, 'qty', e.target.value); setErrors((p) => { const n = { ...p }; delete n[`item_qty_${idx}`]; return n; }); }} />
                      </td>
                      <td className="border-t border-[#edf2f7] py-2 px-2 align-top">
                        <select className="w-full border border-[#dbe4ef] rounded px-2 py-1.5 text-[13px] font-[inherit] outline-none bg-white" value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)}>
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="border-t border-[#edf2f7] py-2 px-2 align-top">
                        <input className={`w-full border ${errors[`item_rate_${idx}`] ? 'border-red-400 bg-red-50' : 'border-[#dbe4ef]'} rounded px-2 py-1.5 text-[13px] text-right font-[inherit] outline-none focus:border-blue-500 min-w-0`} min="0" type="number" value={item.rate} onChange={(e) => { updateItem(item.id, 'rate', e.target.value); setErrors((p) => { const n = { ...p }; delete n[`item_rate_${idx}`]; return n; }); }} />
                      </td>
                      <td className="border-t border-[#edf2f7] py-2 px-2 align-top">
                        <input className="w-full border border-[#dbe4ef] rounded px-2 py-1.5 text-[13px] text-right font-[inherit] outline-none focus:border-blue-500 min-w-0" max="100" min="0" type="number" value={item.discount} onChange={(e) => updateItem(item.id, 'discount', e.target.value)} />
                      </td>
                      {config.showGst && (
                        <>
                          <td className="border-t border-[#edf2f7] py-2 px-2 align-top text-right text-[13px] font-medium text-[#374151] pt-3">{formatCurrency(line.taxable)}</td>
                          <td className="border-t border-[#edf2f7] py-2 px-2 align-top">
                            <select className="w-full border border-[#dbe4ef] rounded px-2 py-1.5 text-[13px] font-[inherit] outline-none bg-white" value={item.gstRate} onChange={(e) => updateItem(item.id, 'gstRate', e.target.value)}>
                              {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>
                          <td className="border-t border-[#edf2f7] py-2 px-2 align-top text-right text-[13px] font-medium text-[#374151] pt-3">{formatCurrency(line.gstAmt)}</td>
                        </>
                      )}
                      <td className="border-t border-[#edf2f7] py-2 px-2 align-top text-right text-[13px] font-semibold text-[#111827] pt-3">{formatCurrency(config.showGst ? line.total : line.taxable)}</td>
                      <td className="border-t border-[#edf2f7] py-2 px-2 align-top text-center">
                        {items.length > 1 && (
                          <button className="w-7 h-7 text-red-400 bg-transparent border-0 text-lg cursor-pointer rounded hover:bg-red-50 hover:text-red-700 font-[inherit]" title="Remove" type="button" onClick={() => removeItem(item.id)}>×</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="mt-3 flex items-center gap-1.5 text-[13px] text-blue-600 font-medium border border-dashed border-blue-200 rounded-md px-3 py-2 bg-blue-50/40 hover:bg-blue-50 cursor-pointer font-[inherit]"
            onClick={addItem}
            title="Add another item (Alt+N)"
          >
            <Plus size={14} /> Add Item
          </button>
          {errors.items && (
            <p className="mt-2 text-[11px] text-red-600 flex items-center gap-1.5">
              <svg fill="none" height="12" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="12"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              {errors.items}
            </p>
          )}

        </div>

        {/* ── Additional Charges ── */}
        <div className="px-6 py-5 border-b border-[#edf2f7]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="m-0 text-[14px] font-semibold text-[#374151]">Additional Charges</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {CHARGE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="text-[12px] text-[#536173] border border-[#dbe4ef] rounded-md px-2.5 py-1 bg-white hover:bg-gray-50 cursor-pointer font-[inherit] transition-colors"
                  onClick={() => addCharge(p)}
                >
                  + {p.label}
                </button>
              ))}
              <button
                type="button"
                className="flex items-center gap-1 text-[12px] text-blue-600 border border-blue-200 rounded-md px-2.5 py-1 bg-blue-50 hover:bg-blue-100 cursor-pointer font-[inherit] transition-colors"
                onClick={() => addCharge(null)}
              >
                <Plus size={11} /> Custom Charge
              </button>
            </div>
          </div>

          {charges.length === 0 ? (
            <div className="text-[13px] text-[#94a3b8] text-center py-4 border border-dashed border-[#e2e8f0] rounded-md bg-[#fafbfe]">
              No additional charges. Use the buttons above to add freight, packing, or custom charges.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {charges.map((charge) => {
                const chargeGst = (Number(charge.amount) || 0) * (charge.gstRate / 100);
                const chargeTotal = (Number(charge.amount) || 0) + (config.showGst ? chargeGst : 0);
                return (
                  <div key={charge.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_160px_120px_120px_120px_36px] gap-3 items-center bg-[#fafbfe] border border-[#edf2f7] rounded-lg px-4 py-2.5">
                    <input
                      className={`${cx.input} bg-white`}
                      placeholder="Charge description (e.g. Freight)"
                      value={charge.label}
                      onChange={(e) => updateCharge(charge.id, 'label', e.target.value)}
                    />
                    <div className={cx.field}>
                      <label className={cx.label}>Amount (₹)</label>
                      <input
                        className={`${cx.input} bg-white`}
                        min="0"
                        placeholder="0"
                        type="number"
                        value={charge.amount}
                        onChange={(e) => updateCharge(charge.id, 'amount', e.target.value)}
                      />
                    </div>
                    {config.showGst && (
                      <div className={cx.field}>
                        <label className={cx.label}>GST %</label>
                        <select className={`${cx.select} bg-white`} value={charge.gstRate} onChange={(e) => updateCharge(charge.id, 'gstRate', Number(e.target.value))}>
                          {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </div>
                    )}
                    {config.showGst && (
                      <div className="text-right">
                        <div className="text-[11px] text-[#94a3b8] mb-0.5">Tax</div>
                        <div className="text-[13px] text-[#374151]">{formatCurrency(chargeGst)}</div>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-[11px] text-[#94a3b8] mb-0.5">Total</div>
                      <div className="text-[13px] font-semibold text-[#111827]">{formatCurrency(chargeTotal)}</div>
                    </div>
                    <button className="w-7 h-7 flex items-center justify-center text-red-400 bg-transparent border-0 cursor-pointer rounded hover:bg-red-50 hover:text-red-700 font-[inherit]" type="button" onClick={() => removeCharge(charge.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer: Notes + Totals ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 p-6">

          {/* LEFT column */}
          <div className="flex flex-col gap-5">

            {/* Notes to Customer */}
            <div className="flex flex-col gap-2">
              <div className={cx.sectionTitle}>Notes to Customer</div>
              <textarea data-fkey="notes" className="w-full border border-[#dbe4ef] rounded-md px-3 py-2.5 text-[13px] font-[inherit] resize-y outline-none focus:border-blue-500" placeholder="Notes visible to customer on the invoice…" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {/* Terms & Conditions */}
            <div className="flex flex-col gap-2">
              <div className={cx.sectionTitle}>Terms &amp; Conditions</div>
              <textarea className="w-full border border-[#dbe4ef] rounded-md px-3 py-2.5 text-[13px] font-[inherit] resize-y outline-none focus:border-blue-500" placeholder="Payment terms, delivery conditions…" rows={5} value={terms} onChange={(e) => setTerms(e.target.value)} />
            </div>

            {/* Internal Notes */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Lock size={11} className="text-[#536173]" />
                <div className={cx.sectionTitle}>Internal Notes</div>
                <span className="text-[10px] text-[#94a3b8] font-normal normal-case tracking-normal">(not shown on invoice)</span>
              </div>
              <textarea className="w-full border border-[#dbe4ef] rounded-md px-3 py-2.5 text-[13px] font-[inherit] resize-y outline-none focus:border-blue-500 bg-[#fdfcf7]" placeholder="Internal notes, reminders, or instructions for your team…" rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
            </div>

            {/* Bank Details */}
            {config.showPayment && (bizSettings.bankName || bizSettings.accountNumber || bizSettings.ifscCode) && (
              <div className="flex flex-col gap-2">
                <div className={cx.sectionTitle}>Bank Details</div>
                <div className="flex flex-col gap-2 bg-[#fafbfe] border border-[#edf2f7] rounded-lg px-4 py-3">
                  {[
                    ['Bank Name', bizSettings.bankName],
                    ['Account Holder Name', bizSettings.accountHolderName],
                    ['Account No.', bizSettings.accountNumber],
                    ['IFSC Code', bizSettings.ifscCode],
                    ['Account Type', bizSettings.accountType],
                    ['Branch', bizSettings.bankBranch],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[13px]">
                      <span className="text-[#536173]">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className={cx.sectionTitle}>Custom Fields</div>
                <button type="button" className="flex items-center gap-1 text-[12px] text-blue-600 hover:underline cursor-pointer bg-transparent border-0 font-[inherit]" onClick={addCustomField}>
                  <Plus size={11} /> Add Field
                </button>
              </div>
              {customFields.length > 0 && (
                <div className="flex flex-col gap-2">
                  {customFields.map((f) => (
                    <div key={f.id} className="grid grid-cols-[1fr_1fr_28px] gap-2 items-center">
                      <input className={cx.input} placeholder="Field name" value={f.key} onChange={(e) => updateCustomField(f.id, 'key', e.target.value)} />
                      <input className={cx.input} placeholder="Value" value={f.value} onChange={(e) => updateCustomField(f.id, 'value', e.target.value)} />
                      <button type="button" className="w-7 h-7 flex items-center justify-center text-[#94a3b8] hover:text-red-500 cursor-pointer bg-transparent border-0 rounded font-[inherit]" onClick={() => removeCustomField(f.id)}><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
              {customFields.length === 0 && (
                <div className="text-[12px] text-[#94a3b8]">Add custom fields like Project Code, Contract No., PAN, etc.</div>
              )}
            </div>

            {/* Recurring Invoice */}
            <div className="flex flex-col gap-3 bg-[#fafbfe] border border-[#edf2f7] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#536173]" />
                    <span className="text-[13px] font-semibold text-[#374151]">Recurring Invoice</span>
                  </div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5 ml-5">Auto-generate this invoice on a schedule</div>
                </div>
                <div
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex-none ${recurring.enabled ? 'bg-blue-600' : 'bg-[#dbe4ef]'}`}
                  onClick={() => setRecurring((p) => ({ ...p, enabled: !p.enabled }))}
                >
                  <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${recurring.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
              {recurring.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className={cx.field}>
                    <label className={cx.label}>Frequency</label>
                    <select className={cx.select} value={recurring.frequency} onChange={(e) => setRecurring((p) => ({ ...p, frequency: e.target.value }))}>
                      {RECURRING_FREQ.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className={cx.field}>
                    <label className={cx.label}>End After (invoices)</label>
                    <input className={cx.input} min="1" placeholder="e.g. 12" type="number" value={recurring.endAfter} onChange={(e) => setRecurring((p) => ({ ...p, endAfter: e.target.value }))} />
                  </div>
                  <div className={cx.field}>
                    <label className={cx.label}>Or End Date</label>
                    <input className={cx.input} type="date" value={recurring.endDate} onChange={(e) => setRecurring((p) => ({ ...p, endDate: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT column — Tax Summary + Totals + Signature */}
          <div className="flex flex-col gap-4">

            {/* Tax Summary */}
            {config.showGst && (
              <>
                <div className={cx.sectionTitle}>Tax Summary</div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs border border-[#edf2f7] rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-[#f8fafc]">
                        <th className="text-left text-[#536173] px-2.5 py-2 font-semibold">GST Rate</th>
                        <th className="text-right text-[#536173] px-2.5 py-2 font-semibold">Taxable</th>
                        {supplyType === 'intrastate' ? (
                          <><th className="text-right text-[#536173] px-2.5 py-2 font-semibold">CGST</th><th className="text-right text-[#536173] px-2.5 py-2 font-semibold">SGST</th></>
                        ) : (
                          <th className="text-right text-[#536173] px-2.5 py-2 font-semibold">IGST</th>
                        )}
                        <th className="text-right text-[#536173] px-2.5 py-2 font-semibold">Total Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(totals.gstByRate).map(([rate, data]) => (
                        <tr key={rate} className="border-t border-[#edf2f7]">
                          <td className="px-2.5 py-2">{rate}%</td>
                          <td className="px-2.5 py-2 text-right">{formatCurrency(data.taxable)}</td>
                          {supplyType === 'intrastate' ? (
                            <><td className="px-2.5 py-2 text-right">{formatCurrency(data.gst / 2)}</td><td className="px-2.5 py-2 text-right">{formatCurrency(data.gst / 2)}</td></>
                          ) : (
                            <td className="px-2.5 py-2 text-right">{formatCurrency(data.gst)}</td>
                          )}
                          <td className="px-2.5 py-2 text-right font-semibold">{formatCurrency(data.gst)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Totals breakdown */}
            <div className="flex flex-col gap-1 text-[13px]">

              <div className="flex justify-between py-1.5 border-b border-[#f3f4f6]">
                <span className="text-[#536173]">Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-[#f3f4f6] text-red-600">
                  <span>Line Discounts</span><span>− {formatCurrency(totals.discount)}</span>
                </div>
              )}

              {config.showGst && (
                <div className="flex justify-between py-1.5 border-b border-[#f3f4f6]">
                  <span className="text-[#536173]">Taxable Amount</span><span>{formatCurrency(totals.taxable)}</span>
                </div>
              )}

              {/* GST breakdown */}
              {config.showGst && (
                supplyType === 'intrastate'
                  ? Object.entries(totals.gstByRate).flatMap(([rate, data]) => [
                      <div key={`cgst-${rate}`} className="flex justify-between py-1 border-b border-[#f3f4f6] text-[#536173]">
                        <span>CGST @ {Number(rate) / 2}%</span><span>{formatCurrency(data.gst / 2)}</span>
                      </div>,
                      <div key={`sgst-${rate}`} className="flex justify-between py-1 border-b border-[#f3f4f6] text-[#536173]">
                        <span>SGST @ {Number(rate) / 2}%</span><span>{formatCurrency(data.gst / 2)}</span>
                      </div>,
                    ])
                  : Object.entries(totals.gstByRate).map(([rate, data]) => (
                      <div key={rate} className="flex justify-between py-1 border-b border-[#f3f4f6] text-[#536173]">
                        <span>IGST @ {rate}%</span><span>{formatCurrency(data.gst)}</span>
                      </div>
                    ))
              )}

              {/* Charges */}
              {totals.chargesSubtotal > 0 && (
                <div className="flex justify-between py-1.5 border-b border-[#f3f4f6]">
                  <span className="text-[#536173]">Additional Charges</span><span>{formatCurrency(totals.chargesSubtotal)}</span>
                </div>
              )}
              {config.showGst && totals.chargesGst > 0 && (
                <div className="flex justify-between py-1 border-b border-[#f3f4f6] text-[#536173]">
                  <span>GST on Charges</span><span>{formatCurrency(totals.chargesGst)}</span>
                </div>
              )}

              {/* Additional Discount toggle */}
              <div className="flex justify-between py-1.5 border-b border-[#f3f4f6] items-center">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[13px] text-blue-600 cursor-pointer bg-transparent border-0 font-[inherit] p-0 hover:underline"
                  onClick={() => setShowAddDiscount((v) => !v)}
                >
                  <Tag size={12} />
                  {showAddDiscount ? 'Remove' : 'Add'} Additional Discount
                </button>
                {totals.addDiscAmt > 0 && <span className="text-red-600">− {formatCurrency(totals.addDiscAmt)}</span>}
              </div>
              {showAddDiscount && (
                <div className="flex gap-2 py-2 border-b border-[#f3f4f6]">
                  <div className="flex rounded-md border border-[#dbe4ef] overflow-hidden text-[12px] flex-none">
                    <button className={cx.toggleBtn(addDiscount.type === 'percent')} type="button" style={{ padding: '6px 10px' }} onClick={() => setAddDiscount((p) => ({ ...p, type: 'percent' }))}>%</button>
                    <button className={cx.toggleBtn(addDiscount.type === 'flat')} type="button" style={{ padding: '6px 10px' }} onClick={() => setAddDiscount((p) => ({ ...p, type: 'flat' }))}>₹</button>
                  </div>
                  <input
                    className={cx.input}
                    min="0"
                    placeholder={addDiscount.type === 'percent' ? 'Discount %' : 'Discount ₹'}
                    type="number"
                    value={addDiscount.value}
                    onChange={(e) => setAddDiscount((p) => ({ ...p, value: e.target.value }))}
                  />
                </div>
              )}

              {/* TDS / TCS toggle */}
              <div className="flex justify-between py-1.5 border-b border-[#f3f4f6] items-center">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[13px] text-blue-600 cursor-pointer bg-transparent border-0 font-[inherit] p-0 hover:underline"
                  onClick={() => setShowTdsTcs((v) => !v)}
                >
                  {showTdsTcs ? 'Hide' : 'Add'} TDS / TCS
                </button>
              </div>
              {showTdsTcs && (
                <div className="border border-[#edf2f7] rounded-lg p-3 mb-1 flex flex-col gap-3">
                  {/* TDS */}
                  <div>
                    <label className="flex items-center justify-between cursor-pointer mb-2">
                      <span className="text-[13px] font-medium text-[#374151]">TDS Deduction</span>
                      <div className={`w-9 h-4.5 rounded-full transition-colors cursor-pointer ${tds.enabled ? 'bg-blue-600' : 'bg-[#dbe4ef]'}`} onClick={() => setTds((p) => ({ ...p, enabled: !p.enabled }))}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full mt-px transition-transform ${tds.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                    {tds.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className={cx.field}>
                          <label className={cx.label}>TDS Section</label>
                          <select className={cx.select} value={tds.section} onChange={(e) => updateTds('section', e.target.value)}>
                            {TDS_SECTIONS.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
                          </select>
                        </div>
                        <div className={cx.field}>
                          <label className={cx.label}>Rate (%)</label>
                          <input className={cx.input} min="0" step="0.01" type="number" value={tds.rate} onChange={(e) => updateTds('rate', Number(e.target.value))} />
                        </div>
                        <div className="col-span-2 flex justify-between text-[12px] text-[#536173] bg-[#fafbfe] rounded px-2 py-1.5">
                          <span>TDS on taxable ({formatCurrency(totals.taxable)} × {tds.rate}%)</span>
                          <span className="font-semibold text-red-600">− {formatCurrency(totals.tdsAmt)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TCS */}
                  <div className="border-t border-[#edf2f7] pt-3">
                    <label className="flex items-center justify-between cursor-pointer mb-2">
                      <span className="text-[13px] font-medium text-[#374151]">TCS Collection</span>
                      <div className={`w-9 h-4.5 rounded-full transition-colors cursor-pointer ${tcs.enabled ? 'bg-blue-600' : 'bg-[#dbe4ef]'}`} onClick={() => setTcs((p) => ({ ...p, enabled: !p.enabled }))}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full mt-px transition-transform ${tcs.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                    {tcs.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className={cx.field}>
                          <label className={cx.label}>TCS Rate (%)</label>
                          <input className={cx.input} min="0" step="0.01" type="number" value={tcs.rate} onChange={(e) => setTcs((p) => ({ ...p, rate: Number(e.target.value) }))} />
                        </div>
                        <div className="flex items-end">
                          <div className="text-[12px] text-[#536173] bg-[#fafbfe] rounded px-2 py-1.5 w-full">
                            TCS: <span className="font-semibold text-[#374151]">+ {formatCurrency(totals.tcsAmt)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Round off */}
              {Math.abs(totals.roundOff) >= 0.01 && (
                <div className="flex justify-between py-1.5 border-b border-[#f3f4f6] text-[#536173]">
                  <span>Round Off</span><span>{totals.roundOff > 0 ? '+' : ''}{formatCurrency(totals.roundOff)}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center text-base font-bold pt-2 mt-1 border-t-2 border-[#111827]">
                <span>Total Amount</span><span>{formatCurrency(totals.finalTotal)}</span>
              </div>

              {/* Payment Received */}
              <div className="pt-2 mt-1 border-t border-[#f3f4f6]">
                <div className="text-[#536173] text-[13px] mb-1.5">Payment Received (₹)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={cx.field}>
                    <label className={cx.label}>Advance</label>
                    <input
                      className="border border-[#dbe4ef] rounded px-2 py-1.5 text-[13px] text-right outline-none focus:border-blue-500 font-[inherit] w-full"
                      min="0"
                      placeholder="0"
                      type="number"
                      value={advanceAmt}
                      onChange={(e) => setAdvanceAmt(e.target.value)}
                    />
                  </div>
                  <div className={cx.field}>
                    <label className={cx.label}>Full Amount</label>
                    <button
                      type="button"
                      className="border border-[#dbe4ef] rounded px-2 py-1.5 text-[13px] text-right bg-[#fafbfe] hover:bg-gray-50 cursor-pointer font-[inherit] w-full"
                      title="Mark as fully paid"
                      onClick={() => setAdvanceAmt(String(totals.finalTotal))}
                    >
                      {formatCurrency(totals.finalTotal)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generate Bill */}
              <button
                type="button"
                className="flex justify-center items-center gap-2 text-[15px] font-bold mt-3 bg-blue-600 text-white rounded-lg px-3 py-2.5 w-full border-0 cursor-pointer hover:bg-blue-700 font-[inherit] disabled:opacity-60"
                disabled={saveLoading}
                onClick={() => handleSave({ openPreview: true })}
              >
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></svg>
                {saveLoading ? 'Generating…' : 'Generate Bill'}
              </button>
            </div>

            {/* Signature */}
            <div className="mt-4 pt-4 border-t border-[#edf2f7] text-center">
              <div className="text-xs text-[#536173] mb-8">Authorised Signatory</div>
              <div className="border-b border-[#111827] mx-auto w-40 mb-2" />
              <div className="text-[13px] font-medium">GoBook Enterprises</div>
            </div>
          </div>
        </div>

        {/* ── Payment Recording ── */}
        {config.showPayment && (
          <div className="border-t border-[#edf2f7] mb-16">
            <button
              className="w-full flex justify-between items-center px-6 py-4 text-left border-0 bg-transparent cursor-pointer hover:bg-gray-50 font-[inherit]"
              type="button"
              onClick={() => setShowPayment((v) => !v)}
            >
              <span className="flex items-center gap-3">
                <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16"><rect height="16" rx="2" ry="2" width="22" x="1" y="4" /><line x1="1" x2="23" y1="10" y2="10" /></svg>
                <span className="text-[13px] font-medium">Record Payment</span>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 rounded px-2 py-0.5">
                  {formatCurrency(totals.balanceDue < 0 ? 0 : totals.balanceDue)} due
                </span>
              </span>
              <svg className={`transition-transform duration-150 ${showPayment ? 'rotate-180' : ''}`} fill="none" height="16" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="16"><polyline points="6 9 12 15 18 9" /></svg>
            </button>

            {showPayment && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6">
                  {/* Payment methods list */}
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] font-semibold uppercase text-[#536173] mb-2 tracking-wide">Payment Mode</div>
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] border cursor-pointer text-left w-full font-[inherit] transition-colors ${selectedPayment === m.id ? 'border-current' : 'border-transparent bg-white hover:bg-gray-50'}`}
                        style={selectedPayment === m.id ? { borderColor: m.color, background: m.bg } : {}}
                        type="button"
                        onClick={() => selectPaymentMethod(m.id)}
                      >
                        <span className="text-[10px] font-bold w-10 text-center py-0.5 rounded" style={{ background: m.bg, color: m.color }}>{m.badge}</span>
                        <span className="flex-1 font-medium">{m.label}</span>
                        {selectedPayment === m.id && (
                          <svg className="ml-auto" fill="none" height="14" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="14" style={{ color: m.color }}><polyline points="9 18 15 12 9 6" /></svg>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Payment form */}
                  <div className="border border-[#edf2f7] rounded-lg overflow-hidden flex flex-col">
                    {!selectedPayment ? (
                      <div className="flex flex-col items-center justify-center gap-3 h-full min-h-52 text-[#536173] text-[13px]">
                        <svg fill="none" height="36" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24" width="36"><rect height="16" rx="2" ry="2" width="22" x="1" y="4" /><line x1="1" x2="23" y1="10" y2="10" /></svg>
                        <span>Select a payment method</span>
                      </div>
                    ) : (() => {
                      const m = PAYMENT_METHODS.find((x) => x.id === selectedPayment);
                      return (
                        <div className="flex flex-col" key={selectedPayment}>
                          <div className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium" style={{ color: m.color, background: m.bg }}>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: m.color, color: '#fff' }}>{m.badge}</span>
                            <span>Pay via {m.label}</span>
                          </div>
                          <div className="flex flex-col gap-3 p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className={cx.field}>
                                <label className={cx.label}>Amount (₹) *</label>
                                <input className={cx.input} type="number" placeholder={String(totals.balanceDue)} value={paymentData.amount} onChange={(e) => updatePayment('amount', e.target.value)} />
                              </div>
                              <div className={cx.field}>
                                <label className={cx.label}>Payment Date *</label>
                                <input className={cx.input} type="date" value={paymentData.date} onChange={(e) => updatePayment('date', e.target.value)} />
                              </div>
                            </div>

                            {selectedPayment === 'upi' && (
                              <div className={cx.field}>
                                <label className={cx.label}>UPI ID / VPA *</label>
                                <input className={cx.input} placeholder="customer@upi or 98765XXXXX@paytm" value={paymentData.upiId} onChange={(e) => updatePayment('upiId', e.target.value)} />
                              </div>
                            )}
                            {selectedPayment === 'razorpay' && (
                              <div className={cx.field}>
                                <label className={cx.label}>Customer Phone (for payment link)</label>
                                <input className={cx.input} placeholder="+91 XXXXX XXXXX" value={paymentData.customerPhone} onChange={(e) => updatePayment('customerPhone', e.target.value)} />
                              </div>
                            )}
                            {selectedPayment === 'cash' && (
                              <div className={cx.field}>
                                <label className={cx.label}>Amount Received in Hand (₹)</label>
                                <input className={cx.input} type="number" placeholder="Enter cash amount received" value={paymentData.amountReceived} onChange={(e) => updatePayment('amountReceived', e.target.value)} />
                                {paymentData.amountReceived && Number(paymentData.amountReceived) > Number(paymentData.amount || totals.balanceDue) && (
                                  <span className="text-xs text-green-700">Change to return: {formatCurrency(Number(paymentData.amountReceived) - Number(paymentData.amount || totals.balanceDue))}</span>
                                )}
                              </div>
                            )}
                            {selectedPayment === 'bank' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className={cx.field}><label className={cx.label}>UTR / Transaction Number *</label><input className={cx.input} placeholder="12-digit UTR number" value={paymentData.utrNumber} onChange={(e) => updatePayment('utrNumber', e.target.value)} /></div>
                                <div className={cx.field}><label className={cx.label}>Customer Bank Name</label><input className={cx.input} placeholder="SBI, HDFC, ICICI…" value={paymentData.bankName} onChange={(e) => updatePayment('bankName', e.target.value)} /></div>
                              </div>
                            )}
                            {selectedPayment === 'credit' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className={cx.field}>
                                  <label className={cx.label}>Credit Period</label>
                                  <select className={cx.select} value={paymentData.creditDays} onChange={(e) => updatePayment('creditDays', e.target.value)}>
                                    {['15','30','45','60','90'].map((d) => <option key={d} value={d}>{d} Days</option>)}
                                  </select>
                                </div>
                                <div className={cx.field}>
                                  <label className={cx.label}>Credit Due Date</label>
                                  <input className={cx.input} type="date" readOnly value={(() => { const d = new Date(paymentData.date); d.setDate(d.getDate() + Number(paymentData.creditDays)); return d.toISOString().split('T')[0]; })()} />
                                </div>
                              </div>
                            )}

                            <div className={cx.field}>
                              <label className={cx.label}>Notes</label>
                              <input className={cx.input} placeholder="Optional payment notes" value={paymentData.notes} onChange={(e) => updatePayment('notes', e.target.value)} />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 px-4 pb-4 pt-2">
                            <button className={cx.btnOutline} type="button" onClick={() => setSelectedPayment(null)}>Cancel</button>
                            <button className={cx.btnPrimary} type="button" style={{ background: m.color, borderColor: m.color }}>
                              <svg fill="none" height="14" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="14"><polyline points="20 6 9 17 4 12" /></svg>
                              Mark as Paid via {m.label}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {showPreview && (
        <DocumentPreviewModal
          config={config}
          customer={getEffectiveCustomer()}
          docMeta={docMeta}
          docExtra={docExtra}
          items={items}
          charges={charges}
          totals={totals}
          notes={notes}
          terms={terms}
          supplyType={supplyType}
          bizSettings={bizSettings}
          shipping={shipping}
          sameShipping={sameShipping}
          tds={tds}
          tcs={tcs}
          advanceAmt={advanceAmt}
          addDiscount={addDiscount}
          autoPrint={autoPrintPreview}
          downloadAsPdf={downloadPdfMode}
          invoiceNumber={docMeta.number}
          onClose={() => {
            setShowPreview(false);
            setAutoPrintPreview(false);
            setDownloadPdfMode(false);
            if (previewRedirectOnClose) {
              window.location.assign(LIST_ROUTES[documentType] ?? '#/billing/invoice');
            }
          }}
        />
      )}

      {/* ── Email Modal ── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 print:hidden">
          <div className="w-full max-w-sm rounded-xl border border-[#dfe7f1] bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-[15px] text-[#111827]">Send Invoice by Email</div>
              <button type="button" className="text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer" onClick={() => setShowEmailModal(false)}>
                <svg fill="none" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <label className="block text-xs font-medium text-[#536173] mb-1">Send To</label>
            <input
              type="email"
              className="border border-[#dbe4ef] rounded-md px-3 py-2 text-[13px] w-full outline-none focus:border-blue-500 font-[inherit] mb-4"
              placeholder="customer@email.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              disabled={emailSending}
            />
            {emailResult && (
              <div className={`text-[13px] rounded-md px-3 py-2 mb-3 ${emailResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {emailResult.msg}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" className={cx.btnOutline} onClick={() => setShowEmailModal(false)} disabled={emailSending}>Cancel</button>
              <button
                type="button"
                className={cx.btnPrimary}
                disabled={emailSending || !emailTo.trim()}
                onClick={handleSendEmail}
              >
                {emailSending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── F-Key Shortcut Bar ── */}
      {showPrintConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4 print:hidden">
          <div className="w-full max-w-sm rounded-lg border border-[#dfe7f1] bg-white shadow-xl">
            <div className="border-b border-[#edf2f7] px-5 py-4">
              <div className="text-[15px] font-semibold text-[#111827]">Was the bill printed?</div>
              <div className="mt-1 text-[12px] text-[#536173]">
                Save it to the invoice list only if the print was completed.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button type="button" className={cx.btnOutline} onClick={() => setShowPrintConfirm(false)}>
                No, Keep Draft
              </button>
              <button
                type="button"
                className={cx.btnPrimary}
                disabled={saveLoading}
                onClick={() => {
                  setShowPrintConfirm(false);
                  handleSave();
                }}
              >
                {saveLoading ? 'Saving...' : 'Yes, Save Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 md:left-60 z-30 select-none"
        style={{ background: '#062844', borderTop: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 -4px 16px rgba(0,0,0,0.25)' }}
      >
        <div className="flex items-stretch" style={{ height: 50 }}>
          {((() => {
            const newRoute = ({ invoice: '#/billing/invoice/new', quotation: '#/billing/quotation/new', 'purchase-order': '#/billing/purchase-order/new', 'credit-note': '#/billing/credit-note/new', 'debit-note': '#/billing/debit-note/new', 'delivery-challan': '#/billing/delivery-challan/new', 'e-invoice': '#/billing/e-invoice/new', 'e-way-bill': '#/billing/e-way-bill/new' })[documentType] ?? '#/billing/invoice/new';
            const f1Label  = ({ invoice: 'New Bill', quotation: 'New Quote', 'purchase-order': 'New PO', 'credit-note': 'New Credit', 'debit-note': 'New Debit', 'delivery-challan': 'New Challan', 'e-invoice': 'New E-Inv', 'e-way-bill': 'New EWB' })[documentType] ?? 'New';
            const f6Label  = ({ invoice: 'Party', quotation: 'Party', 'purchase-order': 'Vendor', 'credit-note': 'Party', 'debit-note': 'Party', 'delivery-challan': 'Consignee', 'e-invoice': 'Party', 'e-way-bill': 'Consignee' })[documentType] ?? 'Party';
            const f7Label  = ({ invoice: 'Discount', quotation: 'Valid Till', 'purchase-order': 'Delivery', 'credit-note': 'Ref Invoice', 'debit-note': 'Ref Invoice', 'delivery-challan': 'Vehicle', 'e-invoice': 'IRN No.', 'e-way-bill': 'Vehicle' })[documentType] ?? 'Extra';
            const f8Label  = ({ invoice: 'Notes', quotation: 'Notes', 'purchase-order': 'Notes', 'credit-note': 'Reason', 'debit-note': 'Reason', 'delivery-challan': 'Transporter', 'e-invoice': 'Notes', 'e-way-bill': 'Distance' })[documentType] ?? 'Notes';
            const f7fkey   = ({ invoice: null, quotation: 'valid-till', 'purchase-order': 'expected-delivery', 'credit-note': 'ref-invoice', 'debit-note': 'ref-invoice', 'delivery-challan': 'vehicle', 'e-invoice': 'irn', 'e-way-bill': 'vehicle' })[documentType];
            const f8fkey   = ({ invoice: 'notes', quotation: 'notes', 'purchase-order': 'notes', 'credit-note': 'reason', 'debit-note': 'reason', 'delivery-challan': 'transporter', 'e-invoice': 'notes', 'e-way-bill': 'distance' })[documentType] ?? 'notes';
            return [
              { key: 'F1',  label: f1Label,   action: () => window.location.assign(newRoute) },
              { key: 'F2',  label: 'Save',     action: () => { if (!saveLoading) handleSave(); } },
              { key: 'F3',  label: 'Preview',  action: () => { setAutoPrintPreview(false); setShowPreview(true); } },
              { key: 'F4',  label: 'Print',    action: () => { if (!saveLoading) handlePrintBill(); } },
              { key: 'F5',  label: 'Add Item', action: () => addItem() },
              { key: 'F6',  label: f6Label,    action: () => document.querySelector('[data-fkey="party"]')?.focus() },
              { key: 'F7',  label: f7Label,    action: () => { if (f7fkey) { document.querySelector(`[data-fkey="${f7fkey}"]`)?.focus(); } else { setShowAddDiscount((v) => !v); } } },
              { key: 'F8',  label: f8Label,    action: () => { const el = document.querySelector(`[data-fkey="${f8fkey}"]`); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus(); } },
              { key: 'F9',  label: 'Share',    action: () => setShowShare((v) => !v) },
              { key: 'F10', label: 'Home',     action: () => window.location.assign('#/dashboard') },
              { key: 'F11', label: 'Settings', action: () => window.location.assign('#business-settings') },
              { key: 'F12', label: 'Close',    action: () => window.location.assign(LIST_ROUTES[documentType] ?? '#/billing/invoice') },
            ];
          })()).map(({ key, label, action }, idx, arr) => (
            <button
              key={key}
              type="button"
              onClick={action}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 px-0.5 min-w-0 font-[inherit] border-0 bg-transparent cursor-pointer transition-colors"
              style={{ borderRight: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              onMouseDown={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.3)'; }}
              onMouseUp={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            >
              <span
                className="rounded-sm text-white"
                style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', background: '#1d4ed8', paddingInline: 5, lineHeight: '16px' }}
              >
                {key}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(200,223,242,0.9)', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
