import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TribunalHeader } from './TribunalHeader';
import { CaseDossier } from './CaseDossier';
import { EvidenceChamber } from './EvidenceChamber';
import { ScrutinyChamber } from './ScrutinyChamber';
import { VerdictChamber } from './VerdictChamber';
import { CaseSwitcherDrawer } from './CaseSwitcherDrawer';
import type { AnalysisRun, CaseDocket, EvidenceExhibit, ProductStage } from '../types/case';
import {
  checkBackendLive,
  getCaseApi,
  listCaseAnalysesApi,
  listCaseEvidenceApi,
} from '../services/api';
import {
  loadActiveStageFromStorage,
  loadDocketFromStorage,
  loadRecentCasesFromStorage,
  saveActiveStageToStorage,
  saveDocketToStorage,
} from '../utils/caseStorage';

interface JudicialWorkspaceProps {
  onBackToThreshold: () => void;
}

export const JudicialWorkspace: React.FC<JudicialWorkspaceProps> = ({ onBackToThreshold }) => {
  const [activeDocket, setActiveDocket] = useState<CaseDocket | null>(() =>
    loadDocketFromStorage()
  );
  const [activeStage, setActiveStage] = useState<ProductStage>(() => {
    const savedDocket = loadDocketFromStorage();
    const savedStage = loadActiveStageFromStorage();
    if (!savedDocket && savedStage !== 'dossier') {
      return 'dossier';
    }
    return savedStage;
  });
  const [evidenceList, setEvidenceList] = useState<EvidenceExhibit[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisRun | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState<boolean>(false);
  const [recentCases, setRecentCases] = useState<CaseDocket[]>(() => loadRecentCasesFromStorage());

  // Check backend health periodically
  useEffect(() => {
    let mounted = true;
    const probe = async () => {
      const live = await checkBackendLive();
      if (mounted) setIsBackendConnected(live);
    };
    probe();
    const interval = setInterval(probe, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeDocketId = activeDocket?.id;

  // Fetch Evidence and Analysis runs whenever active docket changes
  const refreshDocketData = useCallback(async () => {
    if (!activeDocketId) {
      return;
    }

    try {
      // Refresh case docket itself
      try {
        const freshDocket = await getCaseApi(activeDocketId);
        setActiveDocket(freshDocket);
        saveDocketToStorage(freshDocket);
      } catch {
        // use existing local docket if server query fails
      }

      // Fetch evidence exhibits
      try {
        const evData = await listCaseEvidenceApi(activeDocketId);
        setEvidenceList(evData.items || []);
      } catch {
        // ignore offline
      }

      // Fetch latest analysis
      try {
        const anData = await listCaseAnalysesApi(activeDocketId);
        if (anData.items && anData.items.length > 0) {
          setLatestAnalysis(anData.items[0]);
        }
      } catch {
        // ignore offline
      }
    } finally {
      setRecentCases(loadRecentCasesFromStorage());
    }
  }, [activeDocketId]);

  useEffect(() => {
    if (!activeDocketId) return;
    void refreshDocketData();
  }, [activeDocketId, refreshDocketData]);

  // Stage transition helper
  const handleSelectStage = (stage: ProductStage) => {
    setActiveStage(stage);
    saveActiveStageToStorage(stage);
  };

  const handleCaseCreated = (docket: CaseDocket) => {
    setActiveDocket(docket);
    saveDocketToStorage(docket);
    setRecentCases(loadRecentCasesFromStorage());
    setActiveStage('evidence');
    saveActiveStageToStorage('evidence');
  };

  const handleSelectRecentCase = (docket: CaseDocket) => {
    setActiveDocket(docket);
    saveDocketToStorage(docket);
    setActiveStage('evidence');
    saveActiveStageToStorage('evidence');
  };

  const handleNewCase = () => {
    setActiveDocket(null);
    setEvidenceList([]);
    setLatestAnalysis(null);
    setActiveStage('dossier');
    saveActiveStageToStorage('dossier');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#111315] text-[#E5DED0]">
      {/* ── Persistent Institutional Header ── */}
      <TribunalHeader
        activeDocket={activeDocket}
        activeStage={activeStage}
        onSelectStage={handleSelectStage}
        onBackToThreshold={onBackToThreshold}
        onOpenCaseSwitcher={() => setIsSwitcherOpen(true)}
        evidenceCount={evidenceList.length}
        findingsCount={latestAnalysis?.findings?.length || 0}
        isBackendConnected={isBackendConnected}
      />

      {/* ── Stage Presentation Area ── */}
      <main className="relative flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeStage === 'dossier' && (
            <motion.div
              key="stage-dossier"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <CaseDossier
                onBackToThreshold={onBackToThreshold}
                onCaseCreated={handleCaseCreated}
                initialDocket={activeDocket}
              />
            </motion.div>
          )}

          {activeStage === 'evidence' && activeDocket && (
            <motion.div
              key="stage-evidence"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <EvidenceChamber
                docket={activeDocket}
                evidenceList={evidenceList}
                onEvidenceUpdated={refreshDocketData}
                onProceedToScrutiny={() => handleSelectStage('scrutiny')}
              />
            </motion.div>
          )}

          {activeStage === 'scrutiny' && activeDocket && (
            <motion.div
              key="stage-scrutiny"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <ScrutinyChamber
                docket={activeDocket}
                evidenceList={evidenceList}
                latestAnalysis={latestAnalysis}
                onAnalysisUpdated={(an) => {
                  setLatestAnalysis(an);
                  refreshDocketData();
                }}
                onProceedToVerdict={() => handleSelectStage('verdict')}
                onInspectEvidence={() => handleSelectStage('evidence')}
              />
            </motion.div>
          )}

          {activeStage === 'verdict' && activeDocket && (
            <motion.div
              key="stage-verdict"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <VerdictChamber
                docket={activeDocket}
                evidenceList={evidenceList}
                latestAnalysis={latestAnalysis}
                onRequestRetrial={() => handleSelectStage('evidence')}
                onReturnToDossier={handleNewCase}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Slide-Over Case Registers Drawer ── */}
      <CaseSwitcherDrawer
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        recentCases={recentCases}
        activeCaseId={activeDocket?.id}
        onSelectCase={handleSelectRecentCase}
        onNewCase={handleNewCase}
      />
    </div>
  );
};
