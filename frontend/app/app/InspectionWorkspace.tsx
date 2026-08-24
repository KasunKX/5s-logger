"use client";

/* eslint-disable @next/next/no-img-element */

import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";

import styles from "./workspace.module.css";

type ScanState = "idle" | "scanning" | "complete";
type SaveState = "idle" | "saving" | "saved" | "error";

type StoredUpload = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  image_url: string;
  inspection: InspectionResult | null;
};

type InspectionLog = {
  type: "action" | "positive";
  principle: "Sort" | "Set in order" | "Shine" | "Standardize" | "Sustain";
  observation: string;
  action: string;
  assessment: "Positive" | "High action" | "Medium action" | "Low action";
};

type InspectionResult = {
  suggested_actions: number;
  positive_points: number;
  percentage: number;
  state: string;
  logs: InspectionLog[];
};

type KpiTone = "neutral" | "positive" | "warning" | "critical";
type KpiKind = "actions" | "positives" | "score" | "state";

function KpiIcon({ kind, tone }: { kind: KpiKind; tone: KpiTone }) {
  if (kind === "actions" && tone === "positive") {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="m6.7 10.2 2.1 2.1 4.6-4.8" /></svg>;
  }
  if (kind === "actions") {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 17 16H3L10 3Z" /><path d="M10 7.2v4.2M10 14h.01" /></svg>;
  }
  if (kind === "positives" && tone !== "neutral") {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 2.8 2.1 4.5 4.9.6-3.6 3.5.9 4.9-4.3-2.4-4.3 2.4.9-4.9L3 7.9l4.9-.6L10 2.8Z" /></svg>;
  }
  if (kind === "positives") {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="M7 10h6" /></svg>;
  }
  if (kind === "score") {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.2 14.8a7 7 0 1 1 11.6 0" /><path d="m10 10 3.4-3.1" /><circle cx="10" cy="10" r="1" /></svg>;
  }
  if (tone === "positive") {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.8 16 5v4.4c0 3.8-2.5 6.3-6 7.8-3.5-1.5-6-4-6-7.8V5l6-2.2Z" /><path d="m7.2 9.8 1.8 1.8 3.8-4" /></svg>;
  }
  if (tone === "neutral") {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="M10 6v4l2.5 1.5" /></svg>;
  }
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.8 16 5v4.4c0 3.8-2.5 6.3-6 7.8-3.5-1.5-6-4-6-7.8V5l6-2.2Z" /><path d="M10 6.5v4M10 13.4h.01" /></svg>;
}

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://demonstrated-particles-basic-tamil.trycloudflare.com").replace(/\/$/, "");
const userStorageKey = "sitesight_user_id";

function getOrCreateUserId() {
  const existing = window.localStorage.getItem(userStorageKey);
  if (existing) return existing;

  const randomPart = window.crypto.randomUUID().replaceAll("-", "");
  const nextUserId = `browser_${randomPart}`;
  window.localStorage.setItem(userStorageKey, nextUserId);
  return nextUserId;
}

function absoluteImageUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

function formatUploadTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} kilobytes`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} megabytes`;
}

export function InspectionWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestSequence = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [recentUploads, setRecentUploads] = useState<StoredUpload[]>([]);
  const [historyState, setHistoryState] = useState<"loading" | "ready" | "error">("loading");
  const [loadingUploadId, setLoadingUploadId] = useState("");
  const [deletingUploadId, setDeletingUploadId] = useState("");
  const [currentUploadId, setCurrentUploadId] = useState("");

  useEffect(() => {
    const browserUserId = getOrCreateUserId();
    const userStateTimer = window.setTimeout(() => setUserId(browserUserId), 0);

    const loadHistory = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/uploads?user_id=${encodeURIComponent(browserUserId)}`,
        );
        if (!response.ok) throw new Error("Upload history could not be loaded.");
        const payload = (await response.json()) as { uploads: StoredUpload[] };
        setRecentUploads(payload.uploads);
        setHistoryState("ready");
      } catch {
        setHistoryState("error");
      }
    };

    void loadHistory();

    return () => window.clearTimeout(userStateTimer);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const requestInspection = async (nextFile: File, ownerId: string) => {
    const requestNumber = ++requestSequence.current;
    const body = new FormData();
    body.append("user_id", ownerId);
    body.append("image", nextFile);
    setSaveState("saving");

    try {
      const response = await fetch(`${apiBaseUrl}/api/inspections`, {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        upload?: StoredUpload;
        inspection?: InspectionResult;
        error?: string;
      };
      if (!response.ok || !payload.upload || !payload.inspection) {
        throw new Error(payload.error || "The inspection could not be completed.");
      }
      if (requestSequence.current !== requestNumber) return;
      setRecentUploads((current) => [
        payload.upload!,
        ...current.filter((item) => item.id !== payload.upload!.id),
      ].slice(0, 20));
      setHistoryState("ready");
      setSaveState("saved");
      setInspection(payload.inspection);
      setCurrentUploadId(payload.upload.id);
      setScanState("complete");
    } catch (uploadError) {
      if (requestSequence.current !== requestNumber) return;
      setSaveState("error");
      setScanState("idle");
      setInspection(null);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The inspection could not be completed.",
      );
    }
  };

  const loadFile = (
    nextFile?: File,
    options: {
      inspect?: boolean;
      inspection?: InspectionResult | null;
      uploadId?: string;
    } = {},
  ) => {
    if (!nextFile) return;
    if (!allowedTypes.includes(nextFile.type)) {
      setError("Choose a supported image.");
      return;
    }
    if (nextFile.size > 15 * 1024 * 1024) {
      setError("The image must be smaller than 15 megabytes.");
      return;
    }

    setError("");
    if (options.inspect === false) requestSequence.current += 1;
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setCurrentUploadId(options.uploadId || "");
    setInspection(options.inspection || null);
    setScanState(options.inspection ? "complete" : options.inspect === false ? "idle" : "scanning");
    setSaveState(options.inspect === false ? "idle" : "saving");

    if (options.inspect !== false) {
      const ownerId = userId || getOrCreateUserId();
      if (!userId) setUserId(ownerId);
      void requestInspection(nextFile, ownerId);
    }
  };

  const openStoredUpload = async (upload: StoredUpload) => {
    setLoadingUploadId(upload.id);
    setError("");
    try {
      const response = await fetch(absoluteImageUrl(upload.image_url));
      if (!response.ok) throw new Error("The saved image could not be opened.");
      const blob = await response.blob();
      const restoredFile = new File([blob], upload.original_name, {
        type: upload.mime_type,
      });
      loadFile(restoredFile, {
        inspect: false,
        inspection: upload.inspection,
        uploadId: upload.id,
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The saved image could not be opened.",
      );
    } finally {
      setLoadingUploadId("");
    }
  };

  const scanAgain = async () => {
    if (!file || scanState === "scanning") return;

    const ownerId = userId || getOrCreateUserId();
    if (!userId) setUserId(ownerId);
    if (!currentUploadId) {
      setInspection(null);
      setScanState("scanning");
      await requestInspection(file, ownerId);
      return;
    }

    const requestNumber = ++requestSequence.current;
    const body = new FormData();
    body.append("user_id", ownerId);
    setError("");
    setSaveState("saving");
    setScanState("scanning");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/uploads/${encodeURIComponent(currentUploadId)}/inspection`,
        { method: "POST", body },
      );
      const payload = (await response.json()) as {
        upload?: StoredUpload;
        inspection?: InspectionResult;
        error?: string;
      };
      if (!response.ok || !payload.upload || !payload.inspection) {
        throw new Error(payload.error || "The inspection could not be completed.");
      }
      if (requestSequence.current !== requestNumber) return;

      setInspection(payload.inspection);
      setRecentUploads((current) =>
        current.map((upload) =>
          upload.id === payload.upload!.id ? payload.upload! : upload,
        ),
      );
      setSaveState("saved");
      setScanState("complete");
    } catch (inspectionError) {
      if (requestSequence.current !== requestNumber) return;
      setSaveState("error");
      setScanState(inspection ? "complete" : "idle");
      setError(
        inspectionError instanceof Error
          ? inspectionError.message
          : "The inspection could not be completed.",
      );
    }
  };

  const deleteStoredUpload = async (upload: StoredUpload) => {
    if (!userId || deletingUploadId) return;
    setDeletingUploadId(upload.id);
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/uploads/${encodeURIComponent(upload.id)}?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("The image could not be removed.");

      setRecentUploads((current) =>
        current.filter((item) => item.id !== upload.id),
      );
      if (currentUploadId === upload.id) {
        requestSequence.current += 1;
        setCurrentUploadId("");
        setFile(null);
        setPreviewUrl("");
        setInspection(null);
        setScanState("idle");
        setSaveState("idle");
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The image could not be removed.",
      );
    } finally {
      setDeletingUploadId("");
    }
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    loadFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    loadFile(event.dataTransfer.files?.[0]);
  };

  const onDropZoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  const findings = inspection?.logs || [];
  const suggestedActions = inspection?.suggested_actions || 0;
  const positives = inspection?.positive_points || 0;
  const actionTone: KpiTone = !inspection
    ? "neutral"
    : suggestedActions === 0
      ? "positive"
      : suggestedActions <= 2
        ? "warning"
        : "critical";
  const positiveTone: KpiTone = !inspection || positives === 0 ? "neutral" : "positive";
  const conditionTone: KpiTone = !inspection
    ? "neutral"
    : inspection.percentage >= 80
      ? "positive"
      : inspection.percentage >= 60
        ? "warning"
        : "critical";

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          SiteSight
        </Link>
        <div className={styles.workspaceName}>
          <span>Workspace</span>
          <strong>New inspection</strong>
        </div>
        <div className={styles.topActions}>
          <Link href="/">Exit workspace</Link>
        </div>
      </header>

      <section className={styles.pageHeading}>
        <h1>Inspect workplace media.</h1>
      </section>

      <section className={styles.workspace}>
        <article className={styles.mediaPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>01</span>
              <strong>Evidence image</strong>
            </div>
            <div className={styles.mediaActions}>
              {file && saveState !== "idle" && (
                <span className={styles.saveIndicator} data-state={saveState}>
                  {saveState === "saving"
                    ? "Reviewing"
                    : saveState === "saved"
                      ? "Saved"
                      : "Review failed"}
                </span>
              )}
              {file && (
                <button
                  type="button"
                  disabled={scanState === "scanning"}
                  onClick={() => void scanAgain()}
                >
                  Scan again
                </button>
              )}
              {file && (
                <button
                  className={styles.primarySmall}
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  New image
                </button>
              )}
            </div>
          </div>

          <input
            ref={inputRef}
            className={styles.fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onInput}
          />

          <div
            className={`${styles.mediaStage} ${isDragging ? styles.dragging : ""} ${scanState === "scanning" ? styles.processing : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            {!previewUrl ? (
              <div
                className={styles.dropZone}
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={onDropZoneKeyDown}
              >
                <div className={styles.uploadIcon} aria-hidden="true">
                  <span />
                </div>
                <span className={styles.dropKicker}>Workplace image</span>
                <h2>Drop an image here</h2>
                <p>or choose a file from your device</p>
                <span className={styles.chooseButton}>Choose image</span>
                <small>Common image types · up to 15 megabytes</small>
              </div>
            ) : (
              <>
                {/* The preview uses a local object URL; persistence is handled by Flask. */}
                <Image
                  className={styles.previewImage}
                  src={previewUrl}
                  alt="Uploaded workplace evidence"
                  fill
                  unoptimized
                  sizes="(max-width: 1050px) 100vw, 58vw"
                />
                <div className={styles.imageShade} />
                <div className={styles.cornerMarks} aria-hidden="true"><i /><i /><i /><i /></div>
                {scanState === "scanning" && (
                  <div className={styles.scanLayer} aria-hidden="true">
                    <div className={styles.scanGlow} />
                  </div>
                )}
                {scanState === "scanning" && (
                  <div className={styles.stageStatus}>
                    <span className={`${styles.statusDot} ${styles[scanState]}`} />
                    <strong>Reviewing visible conditions</strong>
                    <small>Reviewing the image</small>
                  </div>
                )}
                <div className={styles.fileMeta}>
                  <span>{file?.name}</span>
                  <span>{file ? formatBytes(file.size) : ""}</span>
                </div>
              </>
            )}
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.mediaFooter}>
            <span><i className={scanState !== "idle" ? styles.done : ""} />Image loaded</span>
            <b />
            <span><i className={scanState === "scanning" || scanState === "complete" ? styles.activeStep : ""} />Visual scan</span>
            <b />
            <span><i className={scanState === "complete" ? styles.done : ""} />Human review</span>
          </div>
        </article>

        <aside className={styles.logPanel}>
          <div className={styles.logSummary}>
            <div data-tone={actionTone}>
              <span className={styles.kpiLabel}><KpiIcon kind="actions" tone={actionTone} />Suggested actions</span>
              <strong>{suggestedActions.toString().padStart(2, "0")}</strong>
            </div>
            <div data-tone={positiveTone}>
              <span className={styles.kpiLabel}><KpiIcon kind="positives" tone={positiveTone} />Positives</span>
              <strong>{positives.toString().padStart(2, "0")}</strong>
            </div>
            <div data-tone={conditionTone}>
              <span className={styles.kpiLabel}><KpiIcon kind="score" tone={conditionTone} />Percentage</span>
              <strong>{inspection ? `${inspection.percentage}%` : "0%"}</strong>
            </div>
            <div data-tone={conditionTone}>
              <span className={styles.kpiLabel}><KpiIcon kind="state" tone={conditionTone} />State</span>
              <strong className={styles.stateValue}>{inspection?.state || (scanState === "scanning" ? "Reviewing" : "Waiting")}</strong>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.logTable}>
              <thead>
                <tr>
                  <th>5S area</th>
                  <th>Observation and action</th>
                  <th>Assessment</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((finding, index) => (
                  <tr key={`${finding.principle}-${index}`}>
                    <td>
                      <div className={styles.areaCell}>
                        <span className={styles.rowNumber}>{(index + 1).toString().padStart(2, "0")}</span>
                        <strong className={styles.principle}>{finding.principle}</strong>
                      </div>
                    </td>
                    <td>
                      <strong>{finding.observation}</strong>
                      <p>{finding.action}</p>
                    </td>
                    <td>
                      <span
                        className={`${styles.priority} ${
                          finding.assessment === "Positive"
                            ? styles.positive
                            : styles[finding.assessment.split(" ")[0].toLowerCase()]
                        }`}
                      >
                        {finding.assessment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!inspection && (
              <div className={styles.emptyLog}>
                {scanState === "scanning" ? (
                  <>
                    <div className={styles.logLoader}><i /><i /><i /></div>
                    <strong>Building the action log</strong>
                    <p>Checking the image against the five review areas.</p>
                  </>
                ) : (
                  <>
                    <span className={styles.emptyMark}>5S</span>
                    <strong>No inspection started</strong>
                    <p>Upload an image to populate the review table.</p>
                  </>
                )}
              </div>
            )}
          </div>

        </aside>

        <section className={styles.recentPanel} aria-labelledby="recent-uploads-title">
          <div className={styles.recentHeader}>
            <div>
              <span>03</span>
              <strong id="recent-uploads-title">Previous uploads</strong>
            </div>
            <small>{recentUploads.length.toString().padStart(2, "0")} images</small>
          </div>
          <div className={styles.historyTrack}>
            {historyState === "loading" && (
              <div className={styles.historyMessage}>Loading this user&apos;s images…</div>
            )}
            {historyState === "error" && (
              <div className={styles.historyMessage}>Saved images are temporarily unavailable.</div>
            )}
            {historyState === "ready" && recentUploads.length === 0 && (
              <div className={styles.historyMessage}>Uploaded images will appear here.</div>
            )}
            {recentUploads.map((upload) => (
              <div
                className={styles.historyItem}
                key={upload.id}
              >
                <button
                  className={styles.historyOpen}
                  type="button"
                  onClick={() => void openStoredUpload(upload)}
                  aria-label={`Open ${upload.original_name}`}
                >
                  <span className={styles.historyThumb}>
                    <img src={absoluteImageUrl(upload.image_url)} alt="" />
                    {loadingUploadId === upload.id && <i>Opening</i>}
                  </span>
                  <span className={styles.historyDetails}>
                    <strong>{upload.original_name}</strong>
                    <small>{formatUploadTime(upload.created_at)}</small>
                  </span>
                </button>
                <button
                  className={styles.historyDelete}
                  type="button"
                  onClick={() => void deleteStoredUpload(upload)}
                  aria-label={`Remove ${upload.original_name}`}
                  title="Remove image"
                  disabled={deletingUploadId === upload.id}
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M6.5 6.5v8m3.5-8v8m3.5-8v8M4 4.5h12M7.5 4.5V2.8h5V4.5m-7 0 .7 12.2h7.6l.7-12.2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
