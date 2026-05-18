import clsx from 'clsx';
import { useEffect, useRef, useCallback } from 'react';
import { AICommandProvider, useAICommand } from '../../state/AICommandContext';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { StatusBar } from './layout/StatusBar';
import { ChatPanel } from './chat/ChatPanel';
import { AgentsPanel } from './agents/AgentsPanel';
import { TasksPanel } from './tasks/TasksPanel';
import { TimelinePanel } from './timeline/TimelinePanel';
import { AutomationPanel } from './automation/AutomationPanel';
import { HistoryPanel } from './history/HistoryPanel';
import { MockMap } from './map/MockMap';
import { MapAgentLegend } from './map/MapAgentLegend';
import { MapPickerModal } from './map/MapPickerModal';
import { TaskDrawer } from './agents/TaskDrawer';
import { AgentSettingsModal } from './agents/AgentSettingsModal';
import { ResizeHandle } from './layout/ResizeHandle';
import { Toasts } from './ui/Toasts';

function ActivePanel() {
  const { state } = useAICommand();
  if (state.activeTab === 'chat') return <ChatPanel />;
  if (state.activeTab === 'agents') return <AgentsPanel />;
  if (state.activeTab === 'tasks') return <TasksPanel />;
  if (state.activeTab === 'timeline') return <TimelinePanel />;
  if (state.activeTab === 'automation') return <AutomationPanel />;
  if (state.activeTab === 'history') return <HistoryPanel />;
  return null;
}

function Layout() {
  const { state, dispatch } = useAICommand();
  const expanded = state.viewMode === 'expanded';
  const showMap = expanded || state.mapVisible;
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', state.theme === 'light');
  }, [state.theme]);

  const getMainRect = useCallback(() => mainRef.current?.getBoundingClientRect() ?? null, []);
  const handleResize = useCallback(
    (pctFromLeft: number) => {
      // In RTL, the map is on the LEFT side (visually). Its width = pixels from container's left edge.
      dispatch({ type: 'SET_MAP_SPLIT', percent: pctFromLeft });
    },
    [dispatch],
  );
  const resetSplit = useCallback(() => dispatch({ type: 'SET_MAP_SPLIT', percent: 45 }), [dispatch]);

  const mapPct = state.mapSplitPercent;

  return (
    <div className={clsx('h-screen w-screen flex flex-col bg-bg overflow-hidden grid-bg', state.theme === 'light' && 'theme-light')}>
      <Header />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <main
          ref={mainRef}
          className={clsx(
            'flex-1 min-w-0 min-h-0 flex',
            state.viewMode === 'compact' && 'max-w-[640px] mx-auto',
          )}
        >
          {/* ActivePanel - flex-1, appears on the right in RTL */}
          <div className="flex-1 min-w-[280px] min-h-0 border-e border-panel-border overflow-hidden">
            <ActivePanel />
          </div>

          {showMap && (
            <>
              {/* Splitter */}
              <ResizeHandle
                onResize={handleResize}
                getContainerRect={getMainRect}
                onReset={resetSplit}
              />

              {/* MapPanel - explicit width, appears on the left in RTL */}
              <div
                className="min-w-[300px] min-h-0 flex flex-col bg-bg overflow-hidden"
                style={{ width: `${mapPct}%` }}
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-panel-border bg-bg-elevated">
                  <span className="text-sm font-medium text-text truncate">תמונת מצב מבצעית</span>
                  <div className="flex items-center gap-2 text-2xs text-text-faint font-mono flex-shrink-0">
                    <span className="whitespace-nowrap">{state.entities.length} ישויות</span>
                    <span className="hidden sm:inline whitespace-nowrap">
                      {state.tasks.filter((t) => (t.status === 'in_progress' || t.status === 'planned' || t.status === 'pending') && t.geo).length} אזורים
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-3 min-h-0">
                  <MockMap
                    height="100%"
                    showAgentZones
                    highlightAgentId={state.highlightAgentId}
                  />
                </div>
                <MapAgentLegend />
              </div>
            </>
          )}
        </main>
      </div>
      <StatusBar />
      <TaskDrawer />
      {state.agentSettingsId && <AgentSettingsModal />}
      <MapPickerModal />
      <Toasts />
    </div>
  );
}

export function AICommandCenter() {
  return (
    <AICommandProvider>
      <Layout />
    </AICommandProvider>
  );
}
