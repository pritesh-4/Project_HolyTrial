import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  ArrowRight,
  FileCheck,
  Hash,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { CaseDocket, EvidenceExhibit } from '../types/case';
import {
  addTextEvidenceApi,
  addUrlEvidenceApi,
  uploadFileEvidenceApi,
  deleteEvidenceApi,
} from '../services/api';

interface EvidenceChamberProps {
  docket: CaseDocket;
  evidenceList: EvidenceExhibit[];
  onEvidenceUpdated: () => Promise<void>;
  onProceedToScrutiny: () => void;
  onInspectEvidence?: (exhibit: EvidenceExhibit) => void;
}

export const EvidenceChamber: React.FC<EvidenceChamberProps> = ({
  docket,
  evidenceList,
  onEvidenceUpdated,
  onProceedToScrutiny,
  onInspectEvidence,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'upload'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textProvenance, setTextProvenance] = useState('');

  const [urlTitle, setUrlTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [urlProvenance, setUrlProvenance] = useState('');

  const [fileTitle, setFileTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileProvenance, setFileProvenance] = useState('');

  const [selectedExhibit, setSelectedExhibit] = useState<EvidenceExhibit | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textTitle.trim() || !textContent.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addTextEvidenceApi({
        caseId: docket.id,
        title: textTitle.trim(),
        content: textContent.trim(),
        provenance: textProvenance.trim() || undefined,
      });
      setTextTitle('');
      setTextContent('');
      setTextProvenance('');
      await onEvidenceUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to attach text exhibit.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlTitle.trim() || !sourceUrl.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addUrlEvidenceApi({
        caseId: docket.id,
        title: urlTitle.trim(),
        source_url: sourceUrl.trim(),
        provenance: urlProvenance.trim() || undefined,
      });
      setUrlTitle('');
      setSourceUrl('');
      setUrlProvenance('');
      await onEvidenceUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to ingest remote source.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileTitle.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await uploadFileEvidenceApi({
        caseId: docket.id,
        file: selectedFile,
        title: fileTitle.trim(),
        provenance: fileProvenance.trim() || undefined,
      });
      setFileTitle('');
      setSelectedFile(null);
      setFileProvenance('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await onEvidenceUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload document.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (evidenceId: string) => {
    if (!confirm('Are you certain you wish to withdraw this exhibit from the docket?')) return;
    try {
      await deleteEvidenceApi(evidenceId);
      if (selectedExhibit?.id === evidenceId) {
        setSelectedExhibit(null);
      }
      await onEvidenceUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to withdraw exhibit.';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 text-[#E5DED0] sm:p-6 md:p-8">
      {/* ── Case Proposition Reference Banner ── */}
      <section
        aria-labelledby="docket-heading"
        className="border border-[#C6A16B]/30 bg-[#181B1D]/80 p-5 shadow-lg backdrop-blur-sm sm:p-6"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#C6A16B] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6A16B]" />
              DOCKET CASE UNDER SCRUTINY &bull; {docket.id}
            </div>
            <h2
              id="docket-heading"
              className="font-serif text-lg leading-relaxed font-normal text-[#E5DED0] sm:text-xl md:text-2xl"
            >
              &ldquo;{docket.proposition}&rdquo;
            </h2>
          </div>

          <button
            type="button"
            onClick={onProceedToScrutiny}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border-2 border-[#C6A16B] bg-[#111315] px-6 py-3 font-mono text-xs font-semibold tracking-wider text-[#E5DED0] shadow-[0_0_20px_rgba(198,161,107,0.2)] transition-all hover:bg-[#292E30] hover:shadow-[0_0_28px_rgba(198,161,107,0.35)]"
          >
            <span>PROCEED TO SCRUTINY</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#C6A16B]" />
          </button>
        </div>
      </section>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="flex items-center gap-2 border border-red-500/40 bg-red-950/30 p-4 font-mono text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="ml-auto text-red-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Main Chamber Grid: Ingestion Folio + Evidence Exhibits Ledger ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column (5 cols): Ingestion Folio Form */}
        <section aria-labelledby="intake-heading" className="space-y-4 lg:col-span-5">
          <div className="border border-[#C6A16B]/25 bg-[#111315] p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[#292E30] pb-3">
              <div>
                <h3
                  id="intake-heading"
                  className="font-serif text-base font-normal tracking-wide text-[#E5DED0]"
                >
                  Attach Evidence Exhibit
                </h3>
                <p className="font-mono text-[10px] text-[#9C9B96]">
                  Cryptographically recorded into case docket ledger
                </p>
              </div>
              <Plus className="h-4 w-4 text-[#C6A16B]" />
            </div>

            {/* Ingestion Type Switcher */}
            <div className="mb-5 flex border border-[#292E30] bg-[#0C0D11] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-1.5 text-center font-mono text-[11px] transition-colors ${
                  activeTab === 'text'
                    ? 'border border-[#C6A16B]/40 bg-[#181B1D] font-semibold text-[#E5DED0]'
                    : 'text-[#9C9B96] hover:text-[#E5DED0]'
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-1.5 text-center font-mono text-[11px] transition-colors ${
                  activeTab === 'url'
                    ? 'border border-[#C6A16B]/40 bg-[#181B1D] font-semibold text-[#E5DED0]'
                    : 'text-[#9C9B96] hover:text-[#E5DED0]'
                }`}
              >
                Web URL
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-1.5 text-center font-mono text-[11px] transition-colors ${
                  activeTab === 'upload'
                    ? 'border border-[#C6A16B]/40 bg-[#181B1D] font-semibold text-[#E5DED0]'
                    : 'text-[#9C9B96] hover:text-[#E5DED0]'
                }`}
              >
                Document
              </button>
            </div>

            {/* Form: Text Exhibit */}
            {activeTab === 'text' && (
              <form onSubmit={handleAddText} className="space-y-4 font-mono text-xs">
                <div>
                  <label
                    htmlFor="text-title-input"
                    className="mb-1 block text-[10px] tracking-wider text-[#9C9B96] uppercase"
                  >
                    Exhibit Title *
                  </label>
                  <input
                    id="text-title-input"
                    type="text"
                    required
                    placeholder="e.g., Benchmark Performance Report Q1 2026"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    className="w-full border border-[#292E30] bg-[#0C0D11] px-3 py-2 text-[#E5DED0] placeholder-[#555859] focus:border-[#C6A16B] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="text-content-input"
                    className="mb-1 block text-[10px] tracking-wider text-[#9C9B96] uppercase"
                  >
                    Verbatim Content / Findings *
                  </label>
                  <textarea
                    id="text-content-input"
                    required
                    rows={6}
                    placeholder="Paste verbatim excerpt, study conclusions, or empirical findings..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full resize-none border border-[#292E30] bg-[#0C0D11] p-3 font-sans text-xs leading-relaxed text-[#E5DED0] placeholder-[#555859] focus:border-[#C6A16B] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="text-provenance-input"
                    className="mb-1 block text-[10px] tracking-wider text-[#9C9B96] uppercase"
                  >
                    Provenance / Author / Source (Optional)
                  </label>
                  <input
                    id="text-provenance-input"
                    type="text"
                    placeholder="e.g., Stanford University / IEEE Paper"
                    value={textProvenance}
                    onChange={(e) => setTextProvenance(e.target.value)}
                    className="w-full border border-[#292E30] bg-[#0C0D11] px-3 py-2 text-[#E5DED0] placeholder-[#555859] focus:border-[#C6A16B] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !textTitle.trim() || !textContent.trim()}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 border border-[#C6A16B] bg-[#181B1D] py-2.5 font-mono text-xs font-semibold tracking-wider text-[#E5DED0] transition-colors hover:bg-[#292E30] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C6A16B]" />
                      <span>INSCRIBING EXHIBIT...</span>
                    </>
                  ) : (
                    <span>INSCRIBE TEXT EXHIBIT</span>
                  )}
                </button>
              </form>
            )}

            {/* Form: Remote URL Ingestion */}
            {activeTab === 'url' && (
              <form onSubmit={handleAddUrl} className="space-y-4 font-mono text-xs">
                <div>
                  <label
                    htmlFor="url-title-input"
                    className="mb-1 block text-[10px] tracking-wider text-[#9C9B96] uppercase"
                  >
                    Exhibit Title *
                  </label>
                  <input
                    id="url-title-input"
                    type="text"
                    required
                    placeholder="e.g., Published Analysis on Energy Grid Resilience"
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                    className="w-full border border-[#292E30] bg-[#0C0D11] px-3 py-2 text-[#E5DED0] placeholder-[#555859] focus:border-[#C6A16B] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="source-url-input"
                    className="mb-1 block text-[10px] tracking-wider text-[#9C9B96] uppercase"
                  >
                    HTTP/HTTPS Source URL *
                  </label>
                  <input
                    id="source-url-input"
                    type="url"
                    required
                    placeholder="https://example.com/research-report.html"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full border border-[#292E30] bg-[#0C0D11] px-3 py-2 text-[#E5DED0] placeholder-[#555859] focus:border-[#C6A16B] focus:outline-none"
                  />
                  <span className="mt-1 block text-[9px] text-[#9C9B96]">
                    Protected: Private networks and localhost addresses are rejected by court SSRF
                    firewalls.
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="url-provenance-input"
                    className="mb-1 block text-[10px] tracking-wider text-[#9C9B96] uppercase"
                  >
                    Provenance / Organization (Optional)
                  </label>
                  <input
                    id="url-provenance-input"
                    type="text"
                    placeholder="e.g., Nature Journal / Reuters"
                    value={urlProvenance}
                    onChange={(e) => setUrlProvenance(e.target.value)}
                    className="w-full border border-[#292E30] bg-[#0C0D11] px-3 py-2 text-[#E5DED0] placeholder-[#555859] focus:border-[#C6A16B] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !urlTitle.trim() || !sourceUrl.trim()}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 border border-[#C6A16B] bg-[#181B1D] py-2.5 font-mono text-xs font-semibold tracking-wider text-[#E5DED0] transition-colors hover:bg-[#292E30] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C6A16B]" />
                      <span>FETCHING &amp; PARSING...</span>
                    </>
                  ) : (
                    <span>INGEST REMOTE WEB SOURCE</span>
                  )}
                </button>
              </form>
            )}

            {/* Form: Document File Upload */}
            {activeTab === 'upload' && (
              <form onSubmit={handleUploadFile} className="space-y-4 font-mono text-xs">
                <div>
                  <label
                    htmlFor="file-title-input"
                    className="mb-1 block text-[10px] tracking-wider text-[#9C9B96] uppercase"
                  >
                    Exhibit Title *
                  </label>
                  <input
                    id="file-title-input"
                    type="text"
                    required
                    placeholder="e.g., Technical Whitepaper / Audit PDF"
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    className="w-full border border-[#292E30] bg-[#0C0D11] px-3 py-2 text-[#E5DED0] placeholder-[#555859] focus:border-[#C6A16B] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="document-file-input"
                    className="mb-1 block text-[10px] tracking-wider text-[#9C9B96] uppercase"
                  >
                    Document File (PDF, TXT, MD, JSON, CSV &bull; Max 10MB) *
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[#292E30] bg-[#0C0D11] p-5 text-center transition-colors hover:border-[#C6A16B]/60"
                  >
                    <Upload className="mb-2 h-6 w-6 text-[#C6A16B]" />
                    <span className="text-xs text-[#E5DED0]">
                      {selectedFile ? selectedFile.name : 'Click or drop file exhibit here'}
                    </span>
                    <span className="mt-1 text-[10px] text-[#9C9B96]">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : 'PDF pages are automatically extracted into text'}
                    </span>
                  </button>
                  <input
                    id="document-file-input"
                    type="file"
                    ref={fileInputRef}
                    required
                    accept=".pdf,.txt,.md,.json,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        if (!fileTitle.trim()) {
                          setFileTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="file-provenance-input"
                    className="mb-1 block text-[10px] tracking-wider text-[#9C9B96] uppercase"
                  >
                    Provenance Attribution (Optional)
                  </label>
                  <input
                    id="file-provenance-input"
                    type="text"
                    placeholder="e.g., MIT Press / Department of Energy"
                    value={fileProvenance}
                    onChange={(e) => setFileProvenance(e.target.value)}
                    className="w-full border border-[#292E30] bg-[#0C0D11] px-3 py-2 text-[#E5DED0] placeholder-[#555859] focus:border-[#C6A16B] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile || !fileTitle.trim()}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 border border-[#C6A16B] bg-[#181B1D] py-2.5 font-mono text-xs font-semibold tracking-wider text-[#E5DED0] transition-colors hover:bg-[#292E30] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C6A16B]" />
                      <span>UPLOADING &amp; EXTRACTING...</span>
                    </>
                  ) : (
                    <span>UPLOAD &amp; INSCRIBE DOCUMENT</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Right Column (7 cols): Evidence Ledger */}
        <section aria-labelledby="ledger-heading" className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#292E30] pb-2">
            <div>
              <h3
                id="ledger-heading"
                className="font-serif text-lg font-normal tracking-wide text-[#E5DED0]"
              >
                Docket Evidence Ledger
              </h3>
              <p className="font-mono text-xs text-[#9C9B96]">
                {evidenceList.length} verified exhibit{evidenceList.length === 1 ? '' : 's'}{' '}
                recorded
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-[#C6A16B]">
              <FileCheck className="h-3.5 w-3.5" />
              <span>CRYPTOGRAPHIC INTEGRITY GUARANTEED</span>
            </div>
          </div>

          {/* Empty State */}
          {evidenceList.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-[#C6A16B]/20 bg-[#111315]/80 p-12 text-center">
              <ShieldAlert className="mb-3 h-10 w-10 text-[#C6A16B]/60" />
              <h4 className="font-serif text-xl font-normal text-[#E5DED0]">
                No Exhibits Recorded Yet
              </h4>
              <p className="mt-2 max-w-md font-sans text-xs leading-relaxed text-[#9C9B96]">
                The Obsidian Tribunal requires empirical material to challenge or substantiate
                claims. Inscribe text excerpts, ingest authoritative URLs, or upload research papers
                using the folio on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {evidenceList.map((exhibit, idx) => (
                <div
                  key={exhibit.id}
                  className={`border transition-all ${
                    selectedExhibit?.id === exhibit.id
                      ? 'border-[#C6A16B] bg-[#181B1D]'
                      : 'border-[#292E30] bg-[#111315]/90 hover:border-[#C6A16B]/40 hover:bg-[#181B1D]/60'
                  } p-4`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="border border-[#C6A16B]/40 bg-[#0C0D11] px-2 py-0.5 font-mono text-[10px] text-[#C6A16B]">
                          EXHIBIT #{idx + 1} &bull; {exhibit.type.toUpperCase()}
                        </span>

                        <span
                          className={`font-mono text-[10px] ${
                            exhibit.status === 'processed'
                              ? 'text-emerald-400'
                              : exhibit.status === 'failed'
                                ? 'text-red-400'
                                : 'text-amber-400'
                          }`}
                        >
                          &bull; {exhibit.status.toUpperCase()}
                        </span>
                      </div>

                      <h4 className="font-serif text-base font-normal text-[#E5DED0]">
                        {exhibit.title}
                      </h4>

                      {exhibit.provenance && (
                        <p className="mt-0.5 font-mono text-[10px] text-[#9C9B96]">
                          Provenance: {exhibit.provenance}
                        </p>
                      )}

                      {/* Content Excerpt */}
                      {exhibit.content && (
                        <p className="mt-2 line-clamp-3 font-sans text-xs leading-relaxed text-[#9C9B96]">
                          {exhibit.content}
                        </p>
                      )}

                      {/* Checksum Badge */}
                      {exhibit.checksum && (
                        <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] text-[#9C9B96]/80">
                          <Hash className="h-3 w-3 text-[#C6A16B]" />
                          <span className="font-semibold text-[#C6A16B]">SHA-256:</span>
                          <span className="max-w-xs truncate">{exhibit.checksum}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExhibit(exhibit);
                          if (onInspectEvidence) onInspectEvidence(exhibit);
                        }}
                        className="border border-[#C6A16B]/30 bg-[#0C0D11] px-2.5 py-1 font-mono text-[10px] text-[#E5DED0] hover:border-[#C6A16B] hover:text-white"
                        title="Inspect full exhibit text"
                      >
                        INSPECT
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(exhibit.id)}
                        className="p-1 text-[#9C9B96] hover:text-red-400"
                        title="Withdraw exhibit"
                        aria-label="Delete exhibit"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Exhibit Detail Modal / Inspection Sheet ── */}
      {selectedExhibit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto border border-[#C6A16B]/50 bg-[#111315] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[#292E30] pb-3">
              <div>
                <span className="font-mono text-[10px] text-[#C6A16B] uppercase">
                  EXHIBIT IDENTIFIER &bull; {selectedExhibit.id}
                </span>
                <h3 className="font-serif text-xl font-normal text-[#E5DED0]">
                  {selectedExhibit.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExhibit(null)}
                className="text-[#9C9B96] hover:text-[#E5DED0]"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs text-[#9C9B96]">
              <div className="grid grid-cols-2 gap-3 border-b border-[#292E30] pb-3 sm:grid-cols-4">
                <div>
                  <span className="block text-[9px] text-[#9C9B96]">TYPE:</span>
                  <span className="text-[#E5DED0] uppercase">{selectedExhibit.type}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-[#9C9B96]">STATUS:</span>
                  <span className="text-emerald-400 uppercase">{selectedExhibit.status}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-[#9C9B96]">SIZE:</span>
                  <span className="text-[#E5DED0]">
                    {selectedExhibit.file_size_bytes
                      ? `${(selectedExhibit.file_size_bytes / 1024).toFixed(1)} KB`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-[#9C9B96]">TIMESTAMP:</span>
                  <span className="text-[#E5DED0]">{selectedExhibit.created_at.slice(0, 10)}</span>
                </div>
              </div>

              {selectedExhibit.checksum && (
                <div className="border-b border-[#292E30] pb-3">
                  <span className="block text-[9px] text-[#9C9B96]">SHA-256 CHECKSUM:</span>
                  <span className="font-mono break-all text-[#C6A16B]">
                    {selectedExhibit.checksum}
                  </span>
                </div>
              )}

              {selectedExhibit.provenance && (
                <div className="border-b border-[#292E30] pb-3">
                  <span className="block text-[9px] text-[#9C9B96]">PROVENANCE ATTRIBUTION:</span>
                  <span className="text-[#E5DED0]">{selectedExhibit.provenance}</span>
                </div>
              )}

              <div>
                <span className="mb-1 block text-[9px] text-[#9C9B96]">
                  VERBATIM EXTRACTED CONTENT:
                </span>
                <div className="max-h-96 overflow-y-auto border border-[#292E30] bg-[#0C0D11] p-4 font-sans text-xs leading-relaxed whitespace-pre-wrap text-[#E5DED0] select-text">
                  {selectedExhibit.content ||
                    'No extracted text content available for this exhibit.'}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedExhibit(null)}
                className="border border-[#C6A16B] bg-[#181B1D] px-6 py-2 font-mono text-xs text-[#E5DED0] hover:bg-[#292E30]"
              >
                CLOSE INSPECTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
