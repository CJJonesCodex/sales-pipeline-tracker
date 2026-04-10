"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CsvImportType,
  csvExampleHeaders,
  csvRequiredHeaders,
  parseCsvText,
  validateCsvHeaders,
} from "@/lib/csv-import";

type CsvImportPanelProps = {
  importAction: (formData: FormData) => void;
};

function CsvImportSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Importing..." : "Import into Supabase"}
    </button>
  );
}

export function CsvImportPanel({ importAction }: CsvImportPanelProps) {
  const [csvType, setCsvType] = useState<CsvImportType>("companies");
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [parseError, setParseError] = useState("");

  const parsed = useMemo(() => {
    if (!csvText) {
      return { headers: [], rows: [] as Record<string, string>[] };
    }

    return parseCsvText(csvText);
  }, [csvText]);

  const headerValidation = useMemo(() => validateCsvHeaders(csvType, parsed.headers), [csvType, parsed.headers]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setCsvText("");
      setFileName("");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Please upload a .csv file.");
      setCsvText("");
      setFileName("");
      return;
    }

    const text = await file.text();
    setCsvText(text);
    setFileName(file.name);
    setParseError("");
  }

  const previewRows = parsed.rows.slice(0, 5);

  return (
    <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Direct CSV Import (Supabase)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Upload test or seed CSV files, preview parsed rows, and import directly into your CRM tables.
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {(["companies", "contacts", "outreach_attempts"] as CsvImportType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setCsvType(type)}
            className={`rounded-md border px-3 py-2 text-sm ${
              csvType === type ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            {type === "outreach_attempts" ? "Outreach Attempts" : type[0].toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium" htmlFor="csvUpload">
          Upload CSV file
        </label>
        <input
          id="csvUpload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {fileName ? <p className="mt-2 text-xs text-slate-500">Loaded: {fileName}</p> : null}
      </div>

      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-medium text-slate-700">Required headers ({csvType}):</p>
        <p className="mt-1">{csvRequiredHeaders[csvType].join(", ")}</p>
        <p className="mt-2 font-medium text-slate-700">Full expected headers:</p>
        <p className="mt-1">{csvExampleHeaders[csvType].join(", ")}</p>
      </div>

      {parseError ? <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{parseError}</div> : null}

      {csvText && !headerValidation.isValid ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Missing required headers: {headerValidation.missingHeaders.join(", ")}
        </div>
      ) : null}

      {csvText && headerValidation.isValid ? (
        <div className="mt-3">
          <p className="mb-2 text-sm text-slate-600">
            Previewing {previewRows.length} of {parsed.rows.length} parsed rows.
          </p>
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 text-left">
                <tr>
                  {parsed.headers.map((header) => (
                    <th key={header} className="px-2 py-2 font-medium text-slate-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={`${index}-${row[parsed.headers[0]] ?? ""}`} className="border-t border-slate-200">
                    {parsed.headers.map((header) => (
                      <td key={`${index}-${header}`} className="px-2 py-2 text-slate-700">
                        {row[header] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <form action={importAction} className="mt-4">
        <input type="hidden" name="csvType" value={csvType} />
        <input type="hidden" name="csvText" value={csvText} />
        <CsvImportSubmitButton disabled={!csvText || !headerValidation.isValid} />
      </form>
    </section>
  );
}
