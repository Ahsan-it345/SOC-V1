import React, { useEffect, useState } from 'react';
import {
  Activity,
  Command,
  Menu,
  Radar,
  Server,
  Shield,
  ShieldAlert,
  Terminal,
  X,
} from 'lucide-react';
import {
  INITIAL_ASSETS,
  INITIAL_INCIDENTS,
  INITIAL_IOCS,
  INITIAL_RULES,
  INITIAL_TELEMETRY,
} from './data/socData';
import {
  Asset,
  DetectionRule,
  Incident,
  NavSection,
  TelemetryEvent,
  ThreatIoc,
  TimeWindow,
} from './types/soc';
import { OverviewScreen } from './components/OverviewScreen';
import { InvestigationScreen } from './components/InvestigationScreen';
import { TelemetryScreen } from './components/TelemetryScreen';
import { AssetsScreen } from './components/AssetsScreen';
import { ThreatIntelScreen } from './components/ThreatIntelScreen';
import { CommandPalette } from './components/CommandPalette';

const NAV_ITEMS: {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview & Triage', icon: Activity },
  { id: 'investigations', label: 'Incident Investigation', icon: ShieldAlert },
  { id: 'telemetry', label: 'Telemetry & SIEM', icon: Terminal },
  { id: 'assets', label: 'Asset & Agent Fleet', icon: Server },
  { id: 'intel', label: 'Threat Intel & Rules', icon: Radar },
];

const SECTION_TITLES: Record<NavSection, string> = {
  overview: 'Overview & Triage',
  investigations: 'Incident Investigation',
  telemetry: 'Telemetry & SIEM',
  assets: 'Asset & Agent Fleet',
  intel: 'Threat Intel & Rules',
};

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('1h');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    INITIAL_INCIDENTS[0].id
  );
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>(INITIAL_TELEMETRY);
  const [telemetryQuery, setTelemetryQuery] = useState<string>('');
  const [streaming, setStreaming] = useState<boolean>(true);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [iocs, setIocs] = useState<ThreatIoc[]>(INITIAL_IOCS);
  const [rules, setRules] = useState<DetectionRule[]>(INITIAL_RULES);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Global Cmd+K / Ctrl+K shortcut for Command Palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Live Telemetry Stream when active
  useEffect(() => {
    if (!streaming) return;
    const samplePool: Omit<TelemetryEvent, 'id' | 'timestamp'>[] = [
      {
        severity: 'info',
        source: 'DNS',
        host: 'corp-dns-resolver-02',
        srcIp: '10.20.14.61',
        dstIp: '10.20.0.2',
        port: 53,
        protocol: 'DNS',
        action: 'ALLOW',
        message: 'Verified DNSSEC response for registry.internal.corp',
        rawPayload: { qtype: 'A', latency_ms: 1.8, dnssec: true },
      },
      {
        severity: 'warning',
        source: 'Firewall',
        host: 'edge-waf-eu-02',
        srcIp: '193.142.146.12',
        dstIp: '10.88.2.15',
        port: 443,
        protocol: 'HTTPS',
        action: 'BLOCK',
        mitreId: 'T1190',
        message: 'WAF blocked malformed HTTP/2 header smuggling probe',
        rawPayload: { rule_id: 'WAF-H2-SMUGGLE', action: 'DROP' },
      },
      {
        severity: 'healthy',
        source: 'IAM',
        host: 'sso-idp-prod-01',
        srcIp: '10.14.9.102',
        dstIp: '10.14.0.5',
        port: 443,
        protocol: 'HTTPS',
        action: 'ALLOW',
        message: 'OIDC short-lived workload identity token issued (TTL 300s)',
        rawPayload: { grant: 'client_credentials', ttl: 300 },
      },
      {
        severity: 'critical',
        source: 'EDR',
        host: 'prod-k8s-worker-04',
        srcIp: '10.42.18.104',
        dstIp: '185.220.101.44',
        port: 8443,
        protocol: 'HTTPS',
        action: 'ALERT',
        mitreId: 'T1041',
        message: 'Periodic C2 beacon heartbeat detected from pid=11219',
        rawPayload: { pid: 11219, bytes_out: 48200, interval_sec: 15 },
      },
    ];

    const interval = window.setInterval(() => {
      const pick = samplePool[Math.floor(Math.random() * samplePool.length)];
      const now = new Date();
      const ts = now.toISOString().slice(11, 23);
      const nextEvt: TelemetryEvent = {
        ...pick,
        id: `evt-${Date.now().toString().slice(-5)}`,
        timestamp: ts,
      };
      setTelemetry((prev) => [nextEvt, ...prev.slice(0, 49)]);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [streaming]);

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
    setActiveSection('investigations');
    setMobileMenuOpen(false);
  };

  const handleToggleIsolateHost = (hostname: string) => {
    let nextIsolatedState = false;
    setAssets((prev) =>
      prev.map((a) => {
        if (a.hostname !== hostname) return a;
        const willIsolate = a.status !== 'isolated';
        nextIsolatedState = willIsolate;
        return {
          ...a,
          status: willIsolate ? 'isolated' : 'healthy',
        };
      })
    );
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.host === hostname
          ? {
              ...inc,
              hostIsolated: nextIsolatedState,
              status: nextIsolatedState ? 'contained' : inc.status,
            }
          : inc
      )
    );
    showToast(
      nextIsolatedState
        ? `Host ${hostname} isolated via EDR network containment`
        : `Network isolation released for ${hostname}`
    );
  };

  const handleToggleIsolateIncidentHost = (incidentId: string) => {
    const target = incidents.find((i) => i.id === incidentId);
    if (!target) return;
    handleToggleIsolateHost(target.host);
  };

  const handleRevokeToken = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId ? { ...inc, tokenRevoked: true } : inc
      )
    );
    showToast(`Active session tokens revoked for ${incidentId}`);
  };

  const handleResolveIncident = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, status: 'resolved', severity: 'healthy' }
          : inc
      )
    );
    showToast(`Incident ${incidentId} marked resolved`);
  };

  const handleToggleBlockArtifact = (incidentId: string, artifactId: string) => {
    let blockedVal = '';
    let isBlocked = false;
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        return {
          ...inc,
          artifacts: inc.artifacts.map((art) => {
            if (art.id !== artifactId) return art;
            blockedVal = art.value;
            isBlocked = !art.blocked;
            return { ...art, blocked: !art.blocked };
          }),
        };
      })
    );
    if (blockedVal) {
      showToast(
        isBlocked
          ? `Blocked indicator ${blockedVal} across perimeter & EDR`
          : `Removed block policy for ${blockedVal}`
      );
    }
  };

  const handleAddNote = (incidentId: string, content: string) => {
    const now = new Date().toISOString().slice(11, 19) + ' UTC';
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              notes: [
                ...inc.notes,
                {
                  id: `note-${Date.now()}`,
                  author: 'M. Vance (Lead SOC)',
                  timestamp: now,
                  content,
                },
              ],
            }
          : inc
      )
    );
    showToast(`Investigation note appended to ${incidentId}`);
  };

  const handlePivotHostToTelemetry = (hostname: string) => {
    setTelemetryQuery(`host:${hostname}`);
    setActiveSection('telemetry');
    setMobileMenuOpen(false);
  };

  const handleRunScan = (hostname: string) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    setAssets((prev) =>
      prev.map((a) =>
        a.hostname === hostname ? { ...a, lastScan: now } : a
      )
    );
    showToast(`On-demand memory & YARA triage scan triggered on ${hostname}`);
  };

  const handleToggleBlockIoc = (id: string) => {
    setIocs((prev) =>
      prev.map((i) => (i.id === id ? { ...i, blocked: !i.blocked } : i))
    );
  };

  const handleAddIoc = (ioc: Omit<ThreatIoc, 'id' | 'firstSeen'>) => {
    const newItem: ThreatIoc = {
      ...ioc,
      id: `ioc-${Date.now()}`,
      firstSeen: new Date().toISOString().slice(0, 10),
    };
    setIocs((prev) => [newItem, ...prev]);
    showToast(`Added & enforced block for ${ioc.type}: ${ioc.value}`);
  };

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleRunRuleInTelemetry = (query: string) => {
    setTelemetryQuery(query);
    setActiveSection('telemetry');
  };

  const openIncidentCount = incidents.filter((i) => i.status !== 'resolved').length;

  return (
    <div className="flex min-h-screen bg-[#031427] text-[#d3e4fe]">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation (240px) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-[#1F2937] bg-[#0b1c30] transition-transform duration-150 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-13 items-center justify-between border-b border-[#1F2937] px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-[#06B6D4]/40 bg-[#06B6D4]/15 text-[#4cd7f6]">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#F8FAFC] whitespace-nowrap">
              Cyber Defense
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded p-1 text-[#94A3B8] hover:text-[#F8FAFC] lg:hidden cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-2.5" aria-label="Console Sections">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#1b2b3f] text-[#4cd7f6]'
                    : 'text-[#94A3B8] hover:bg-[#102034] hover:text-[#F8FAFC]'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-[#4cd7f6]' : 'text-[#64748B]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'investigations' && openIncidentCount > 0 && (
                  <span className="font-mono text-[11px] font-semibold text-[#F87171] tabular-nums">
                    {openIncidentCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Shift / Operator Box */}
        <div className="border-t border-[#1F2937] p-3">
          <div className="rounded border border-[#1F2937] bg-[#031427] p-2.5">
            <div className="text-xs font-semibold text-[#F8FAFC]">
              M. Vance · Tier-3 IR
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-[#64748B]">
              Shift Alpha · EU-West SOC
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar Contract: Breadcrumb on Left, Timeframe & Primary CTA on Right */}
        <header className="sticky top-0 z-30 flex h-13 items-center justify-between gap-4 border-b border-[#1F2937] bg-[#0b1c30]/95 px-4 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded border border-[#374151] bg-[#102034] p-1.5 text-[#d3e4fe] lg:hidden cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-xs whitespace-nowrap truncate">
              <span className="font-mono text-[#64748B]">Console</span>
              <span className="text-[#374151]" aria-hidden="true">
                /
              </span>
              <h1 className="text-sm font-semibold text-[#F8FAFC] truncate">
                {SECTION_TITLES[activeSection]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Timeframe Segmented Control */}
            <div
              className="hidden sm:flex items-center gap-0.5 rounded border border-[#1F2937] bg-[#031427] p-0.5"
              role="group"
              aria-label="Telemetry time window"
            >
              {(['15m', '1h', '24h', '7d'] as const).map((tw) => (
                <button
                  key={tw}
                  type="button"
                  onClick={() => setTimeWindow(tw)}
                  className={`rounded px-2 py-1 font-mono text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    timeWindow === tw
                      ? 'bg-[#1b2b3f] text-[#4cd7f6]'
                      : 'text-[#64748B] hover:text-[#d3e4fe]'
                  }`}
                >
                  {tw}
                </button>
              ))}
            </div>

            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded border border-[#374151] bg-[#102034] px-2.5 font-mono text-[11px] text-[#bcc9cd] hover:border-[#06B6D4] hover:text-[#F8FAFC] cursor-pointer whitespace-nowrap shrink-0"
              title="Open Command Palette (Ctrl+K)"
            >
              <Command className="h-3.5 w-3.5 text-[#4cd7f6]" />
              <span className="hidden md:inline">Quick Jump</span>
              <kbd className="rounded bg-[#031427] px-1 text-[10px] text-[#64748B]">
                ⌘K
              </kbd>
            </button>

            {/* Primary Tactical Action */}
            <button
              type="button"
              onClick={() => {
                if (activeSection === 'telemetry') {
                  setTelemetryQuery('severity:critical');
                } else {
                  const firstP1 =
                    incidents.find((i) => i.severity === 'critical') ??
                    incidents[0];
                  if (firstP1) handleSelectIncident(firstP1.id);
                }
              }}
              className="inline-flex h-8 items-center rounded bg-[#06B6D4] px-3 font-mono text-xs font-semibold text-[#031427] transition-colors hover:bg-[#22D3EE] cursor-pointer whitespace-nowrap shrink-0"
            >
              {activeSection === 'telemetry'
                ? 'Filter Critical'
                : 'Triage Active P1'}
            </button>
          </div>
        </header>

        {/* Main Workspace Viewport */}
        <main className="flex-1 p-4">
          {activeSection === 'overview' && (
            <OverviewScreen
              incidents={incidents}
              assets={assets}
              timeWindow={timeWindow}
              onSelectIncident={handleSelectIncident}
              onToggleIsolateHost={handleToggleIsolateHost}
              onPivotHostToTelemetry={handlePivotHostToTelemetry}
            />
          )}

          {activeSection === 'investigations' && (
            <InvestigationScreen
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              onToggleIsolateIncidentHost={handleToggleIsolateIncidentHost}
              onRevokeToken={handleRevokeToken}
              onResolveIncident={handleResolveIncident}
              onToggleBlockArtifact={handleToggleBlockArtifact}
              onAddNote={handleAddNote}
              onPivotHostToTelemetry={handlePivotHostToTelemetry}
            />
          )}

          {activeSection === 'telemetry' && (
            <TelemetryScreen
              events={telemetry}
              query={telemetryQuery}
              onQueryChange={setTelemetryQuery}
              streaming={streaming}
              onToggleStreaming={() => setStreaming((s) => !s)}
              onIsolateHost={handleToggleIsolateHost}
            />
          )}

          {activeSection === 'assets' && (
            <AssetsScreen
              assets={assets}
              onToggleIsolateHost={handleToggleIsolateHost}
              onRunScan={handleRunScan}
              onPivotHostToTelemetry={handlePivotHostToTelemetry}
            />
          )}

          {activeSection === 'intel' && (
            <ThreatIntelScreen
              iocs={iocs}
              rules={rules}
              onToggleBlockIoc={handleToggleBlockIoc}
              onAddIoc={handleAddIoc}
              onToggleRule={handleToggleRule}
              onRunRuleInTelemetry={handleRunRuleInTelemetry}
            />
          )}
        </main>
      </div>

      {/* Floating Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        incidents={incidents}
        assets={assets}
        onNavigate={(sec) => setActiveSection(sec)}
        onSelectIncident={handleSelectIncident}
        onPivotHost={handlePivotHostToTelemetry}
      />

      {/* Action Confirmation Toast */}
      {toast && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-50 flex items-center gap-2.5 rounded border border-[#06B6D4]/40 bg-[#102034] px-3.5 py-2.5 font-mono text-xs text-[#F8FAFC] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.65)]"
        >
          <span className="h-2 w-2 rounded-full bg-[#06B6D4]" aria-hidden="true" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
