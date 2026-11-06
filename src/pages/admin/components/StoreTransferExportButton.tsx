import { useState } from "react";
import { Download } from "lucide-react";
import type { StoreTransfer } from "../../../types/storeTransfer";

export default function StoreTransferExportButton({
  transfers,
  disabled = false,
}: {
  transfers: StoreTransfer[];
  disabled?: boolean;
}) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const download = async () => {
    setExporting(true);
    setError("");
    try {
      const { exportStoreTransfersToExcel } = await import("../../../utils/storeTransferExporter");
      exportStoreTransfersToExcel(transfers);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Excel-ის ჩამოტვირთვა ვერ მოხერხდა");
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={download}
        disabled={disabled || exporting || !transfers.length}
        className="min-h-11 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download size={16} aria-hidden="true" />
        {exporting ? "იტვირთება…" : "Excel-ში ჩამოტვირთვა"}
      </button>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
