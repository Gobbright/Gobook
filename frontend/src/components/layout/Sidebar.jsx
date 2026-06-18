import { useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, BarChart2, BarChart3, Bell, BookOpen,
  Building2, CalendarCheck, CalendarOff, ChevronDown,
  ClipboardList, DollarSign, FileCheck, FileMinus, FilePlus,
  FileSpreadsheet, FileText, FolderOpen, GitBranch, LayoutDashboard,
  LayoutGrid, Mail, MessageCircle, Package, PackageMinus, PackagePlus,
  PenLine, PieChart, QrCode, RefreshCw, Route, Scale, Settings,
  Shield, ShoppingCart, Truck, TrendingUp, UserCheck, UserPlus,
  Users, Wallet, Warehouse, Zap,
} from 'lucide-react';

import { sidebarSections } from '../../constants/navigation.js';

const ICON_MAP = {
  Activity, AlertTriangle, BarChart2, BarChart3, Bell, BookOpen,
  Building2, CalendarCheck, CalendarOff, ClipboardList,
  DollarSign, FileCheck, FileMinus, FilePlus, FileSpreadsheet,
  FileText, FolderOpen, GitBranch, LayoutDashboard, LayoutGrid,
  Mail, MessageCircle, Package, PackageMinus, PackagePlus, PenLine,
  PieChart, QrCode, RefreshCw, Route, Scale, Settings, Shield,
  ShoppingCart, Truck, TrendingUp, UserCheck, UserPlus, Users,
  Wallet, Warehouse, Zap,
};

function NavIcon({ name }) {
  const Icon = ICON_MAP[name];
  return Icon ? <Icon size={15} strokeWidth={1.75} /> : null;
}

function findOpenNavItem(hash) {
  for (const section of sidebarSections) {
    for (const item of section.items) {
      if (item.children?.some((c) => c.href === hash || hash === item.href)) return item.label;
    }
  }
  return null;
}

export function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/dashboard');
  const [openSection, setOpenSection] = useState('Sales');
  const [openNavItem, setOpenNavItem] = useState(() => findOpenNavItem(window.location.hash || '#/dashboard'));

  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash || '#/dashboard';
      setCurrentHash(hash);
      const found = findOpenNavItem(hash);
      if (found) setOpenNavItem(found);
      onClose();
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [onClose]);

  function toggleSection(title) {
    setOpenSection((s) => (s === title ? '' : title));
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`bg-[#062844] text-white flex-none w-60 h-screen px-3 py-4 overflow-y-auto scrollbar-hide flex flex-col
          fixed inset-y-0 left-0 z-50 transition-transform duration-200
          md:static md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="px-2 mb-6 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center flex-none">
            <span className="text-white text-xs font-black">G</span>
          </div>
          <span className="text-[18px] font-extrabold tracking-tight text-white">GoBook</span>
        </div>

        {/* Nav sections */}
        <nav className="flex flex-col gap-3 flex-1">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              {section.items.length === 1 ? (
                /* Single-item section — render as direct link */
                <a
                  href={section.items[0].href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium no-underline transition-colors
                    ${currentHash === section.items[0].href
                      ? 'bg-blue-600 text-white'
                      : 'text-[#c8dff2] hover:text-white hover:bg-white/8'}`}
                >
                  <span className={currentHash === section.items[0].href ? 'text-white' : 'text-[#7ab4d8]'}>
                    <NavIcon name={section.items[0].icon} />
                  </span>
                  {section.items[0].label}
                </a>
              ) : (
                /* Multi-item section — collapsible group */
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-widest cursor-pointer font-[inherit] bg-transparent border-0 transition-colors
                      ${openSection === section.title ? 'text-[#90caf9]' : 'text-[#7ab4d8] hover:text-[#b0d8f0]'}`}
                    aria-expanded={openSection === section.title}
                  >
                    <span>{section.title}</span>
                    <ChevronDown
                      size={13}
                      strokeWidth={2.5}
                      className={`transition-transform duration-200 ${openSection === section.title ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {openSection === section.title && (
                    <div className="mt-0.5 flex flex-col gap-1 animate-fade-slide-down">
                      {section.items.map((item) => {
                        if (item.children) {
                          const isOpen = openNavItem === item.label;
                          const activeParent = item.href && currentHash === item.href;
                          const hasActiveChild = item.children.some((c) => currentHash === c.href);
                          const highlighted = activeParent || hasActiveChild;
                          return (
                            <div key={item.label}>
                              <div className={`flex items-center rounded-lg transition-colors ${highlighted ? '' : 'hover:bg-white/8'}`}>
                                {item.href ? (
                                  <a
                                    href={item.href}
                                    onClick={onClose}
                                    className={`flex items-center gap-3 flex-1 px-3 py-2 text-[13px] no-underline transition-colors rounded-l-lg
                                      ${activeParent ? 'bg-blue-600 text-white' : highlighted ? 'text-white' : 'text-[#c8dff2] hover:text-white'}`}
                                  >
                                    <span className={`flex-none ${highlighted ? 'text-white' : 'text-[#7ab4d8]'}`}>
                                      <NavIcon name={item.icon} />
                                    </span>
                                    {item.label}
                                  </a>
                                ) : (
                                  <span className={`flex items-center gap-3 flex-1 px-3 py-2 text-[13px] ${highlighted ? 'text-white' : 'text-[#c8dff2]'}`}>
                                    <span className={`flex-none ${highlighted ? 'text-white' : 'text-[#7ab4d8]'}`}>
                                      <NavIcon name={item.icon} />
                                    </span>
                                    {item.label}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setOpenNavItem(isOpen ? null : item.label)}
                                  className={`flex-none px-2 py-2 cursor-pointer bg-transparent border-0 font-[inherit] transition-colors rounded-r-lg
                                    ${highlighted ? 'text-white' : 'text-[#7ab4d8] hover:text-white'}`}
                                  aria-label="toggle sub-items"
                                >
                                  <ChevronDown size={12} strokeWidth={2.5} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                              </div>
                              {isOpen && (
                                <div className="ml-7 mt-0.5 flex flex-col gap-0.5">
                                  {item.children.map((child) => {
                                    const active = currentHash === child.href;
                                    return (
                                      <a
                                        key={child.label}
                                        href={child.href}
                                        onClick={onClose}
                                        className={`flex items-center px-3 py-1.5 rounded-md text-[12.5px] no-underline transition-colors
                                          ${active ? 'bg-blue-600 text-white' : 'text-[#c8dff2] hover:text-white hover:bg-white/8'}`}
                                      >
                                        {child.label}
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }

                        const active = currentHash === item.href;
                        return (
                          <a
                            key={item.label}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] no-underline transition-colors
                              ${active
                                ? 'bg-blue-600 text-white'
                                : 'text-[#c8dff2] hover:text-white hover:bg-white/8'}`}
                          >
                            <span className={`flex-none ${active ? 'text-white' : 'text-[#7ab4d8]'}`}>
                              <NavIcon name={item.icon} />
                            </span>
                            {item.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
