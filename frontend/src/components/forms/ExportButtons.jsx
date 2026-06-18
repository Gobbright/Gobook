import { FileDown, FileSpreadsheet } from 'lucide-react';

import { downloadExcel, downloadPdf } from '../../utils/exportData.js';

const BTN =
  'inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#374151] bg-white border border-[#dbe4ef] rounded-md cursor-pointer hover:bg-gray-50 font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed';

export function ExportButtons({ title, filename, rows, columns }) {
  const disabled = !rows || rows.length === 0;
  const payload = { title, filename, rows: rows ?? [], columns };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={BTN}
        disabled={disabled}
        onClick={() => downloadExcel(payload)}
        title="Download filtered data as Excel"
      >
        <FileSpreadsheet size={14} />
        Excel
      </button>
      <button
        type="button"
        className={BTN}
        disabled={disabled}
        onClick={() => downloadPdf(payload)}
        title="Download filtered data as PDF"
      >
        <FileDown size={14} />
        PDF
      </button>
    </div>
  );
}
