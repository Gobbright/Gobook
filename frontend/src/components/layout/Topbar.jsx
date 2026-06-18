import { useEffect, useRef, useState } from 'react';
import { LogOut, Menu, Search, Settings } from 'lucide-react';

import { api } from '../../services/api.js';
import { getCurrentUser, logout } from '../../services/authService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

const EMPTY_RESULTS = { customers: [], products: [], invoices: [] };

const RESULT_BTN = 'w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left text-[13px] hover:bg-[#f6f9fd] cursor-pointer border-0 bg-transparent font-[inherit]';
const GROUP_LABEL = 'px-3.5 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]';

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function Topbar({ onMenuClick }) {
  const [bizName, setBizName] = useState('');
  const user = getCurrentUser();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    api.getSettings()
      .then((settings) => setBizName(settings?.businessName ?? ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(EMPTY_RESULTS);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      api.globalSearch(term)
        .then((data) => setResults({ ...EMPTY_RESULTS, ...data }))
        .catch(() => setResults(EMPTY_RESULTS))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goTo(href) {
    setQuery('');
    setShowResults(false);
    window.location.assign(href);
  }

  const hasResults = results.customers.length > 0 || results.products.length > 0 || results.invoices.length > 0;

  return (
    <header className="bg-white border-b border-[#dde6f2] flex items-center gap-4 h-18 px-7">
      <button
        className="w-9 h-9 bg-white border border-[#dbe4ef] rounded-md cursor-pointer text-[#536173] flex items-center justify-center md:hidden"
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
      >
        <Menu size={18} />
      </button>

      <div ref={boxRef} className="relative flex-1 max-w-105">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
        <input
          className="w-full border border-[#dbe4ef] rounded-md py-3 pl-9 pr-3.5 outline-none focus:border-blue-500"
          aria-label="Search"
          placeholder="Search transactions, invoices, customers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
        />

        {showResults && query.trim() && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#dde6f2] rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
            {searching ? (
              <div className="px-3.5 py-3 text-[13px] text-[#536173]">Searching…</div>
            ) : !hasResults ? (
              <div className="px-3.5 py-3 text-[13px] text-[#536173]">No results for "{query.trim()}"</div>
            ) : (
              <>
                {results.customers.length > 0 && (
                  <div className="py-1">
                    <div className={GROUP_LABEL}>Customers</div>
                    {results.customers.map((c) => (
                      <button key={c.id} type="button" className={RESULT_BTN} onClick={() => goTo('#customers')}>
                        <span className="font-medium text-[#111827]">{c.name}</span>
                        <span className="text-[#536173] text-[12px]">{c.phone || c.gstin || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.products.length > 0 && (
                  <div className="py-1 border-t border-[#f0f4f8]">
                    <div className={GROUP_LABEL}>Products</div>
                    {results.products.map((p) => (
                      <button key={p.id} type="button" className={RESULT_BTN} onClick={() => goTo('#products')}>
                        <span className="font-medium text-[#111827]">{p.description}</span>
                        <span className="text-[#536173] text-[12px]">{p.code}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.invoices.length > 0 && (
                  <div className="py-1 border-t border-[#f0f4f8]">
                    <div className={GROUP_LABEL}>Invoices &amp; Documents</div>
                    {results.invoices.map((inv) => (
                      <button key={inv.id} type="button" className={RESULT_BTN}
                        onClick={() => goTo(`#/billing/${inv.documentType}/${inv.id}/view`)}>
                        <span>
                          <span className="font-medium text-[#111827]">{inv.number}</span>
                          {inv.customerName && <span className="text-[#536173]"> · {inv.customerName}</span>}
                        </span>
                        <span className="text-[#536173] text-[12px]">{formatCurrency(inv.total)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 ml-auto max-md:hidden">
        <span className="text-[13px] text-[#536173]">{todayLabel()}</span>
        <a
          href="#business-settings"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#536173] no-underline hover:text-blue-600"
          title="Business settings"
        >
          <Settings size={14} />
          Customize
        </a>
        {bizName && <strong className="text-[13px]">{bizName}</strong>}
        <span className="w-px h-5 bg-[#dde6f2]" aria-hidden="true" />
        {user?.name && <span className="text-[13px] text-[#536173]">{user.name}</span>}
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#536173] hover:text-blue-600 cursor-pointer bg-transparent border-0 p-0 font-[inherit]"
          title="Sign out"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  );
}
