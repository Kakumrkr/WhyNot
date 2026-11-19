import { useRef, useState } from "react";
import type { SyntheticSnapshotEnvelope } from "@whynot/contracts";
import { readSnapshot, snapshotFile } from "./adapter/snapshotFiles.js";

/** Import synthetic data from disk and export the current snapshot without network access. */
export function SnapshotControls({
  envelope,
  imported,
  onImport,
  onReset,
}: {
  envelope: SyntheticSnapshotEnvelope | undefined;
  imported: boolean;
  onImport: (envelope: SyntheticSnapshotEnvelope) => void;
  onReset: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const latestRead = useRef(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function load(file: File) {
    const read = ++latestRead.current;
    setError("");
    setPending(true);
    try {
      const snapshot = await readSnapshot(file);
      if (read === latestRead.current) onImport(snapshot);
    } catch (failure) {
      if (read === latestRead.current) {
        setError(failure instanceof Error ? failure.message : "Choose a supported snapshot file.");
      }
    } finally {
      if (read === latestRead.current) setPending(false);
    }
  }

  function save(snapshot: SyntheticSnapshotEnvelope) {
    const url = URL.createObjectURL(snapshotFile(snapshot));
    const download = document.createElement("a");
    download.href = url;
    download.download = "whynot-synthetic-snapshot.json";
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <details className="card snapshot-controls">
      <summary>Synthetic snapshot files</summary>
      <p id="snapshot-help">
        Use fictional data only. Imported snapshots stay in this tab and clear on reset, reload or
        browser navigation.
      </p>
      <label htmlFor="snapshot-file">Import snapshot JSON</label>
      <input
        id="snapshot-file"
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        aria-describedby="snapshot-help"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void load(file);
        }}
      />
      {error && <p role="alert">{error}</p>}
      {(pending || imported) && (
        <p role="status">{pending ? "Reading snapshot…" : "Imported snapshot active."}</p>
      )}
      <div className="snapshot-actions">
        {envelope && (
          <button className="secondary" type="button" onClick={() => save(envelope)}>
            Export snapshot JSON
          </button>
        )}
        {imported && (
          <button
            className="secondary"
            type="button"
            disabled={pending}
            onClick={() => {
              setError("");
              onReset();
              fileInput.current?.focus();
            }}
          >
            Reset imported snapshot
          </button>
        )}
      </div>
    </details>
  );
}
