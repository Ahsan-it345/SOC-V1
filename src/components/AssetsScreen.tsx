import React, { useMemo, useState } from 'react';
import {
  Cpu,
  HardDrive,
  Lock,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  Unlock,
} from 'lucide-react';
import { Asset } from '../types/soc';
import { CopyButton, StatusBadge } from './ui/Primitives';

interface AssetsScreenProps {
  assets: Asset[];
  onToggleIsolateHost: (hostname: string) => void;
  onRunScan: (hostname: string) => void;
  onPivotHostToTelemetry: (hostname: string) => void;
}

export const AssetsScreen: React.FC<AssetsScreenProps> = ({
  assets,
  onToggleIsolateHost,
  onRunScan,
  onPivotHostToTelemetry,
}) => {
  const [search, setSearch] = useState('');
  const [osFilter, setOsFilter] = useState<string>('ALL');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    assets[0]?.id ?? ''
  );
  const [scanningHost, setScanningHost] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      const matchesOs = osFilter === 'ALL' || a.osFamily === osFilter;
      const matchesSearch =
        !q ||
        a.hostname.toLowerCase().includes(q) ||
        a.ipv4.includes(q) ||
        a.os.toLowerCase().includes(q) ||
        a.openCves.some((c) => c.id.toLowerCase().includes(q));
      return matchesOs && matchesSearch;
    });
  }, [assets, osFilter, search]);

  const selectedAsset =
    assets.find((a) => a.id === selectedAssetId) ?? filteredAssets[0] ?? null;

  const triggerScan = (hostname: string) => {
    setScanningHost(hostname);
    onRunScan(hostname);
    window.setTimeout(() => setScanningHost(null), 900);
  };

  return (
    <div className="space-y-3">
      {/* Filter & Search Bar */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#1F2937] bg-[#0b1c30] p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hostname, IPv4, OS kernel, or CVE ID..."
            className="h-8 w-full rounded border border-[#374151] bg-[#031427] pr-3 pl-8 font-mono text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#06B6D4] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded border border-[#1F2937] bg-[#031427] p-1">
          {(['ALL', 'Kubernetes', 'Linux', 'Windows', 'macOS'] as const).map(
            (family) => (
              <button
                key={family}
                type="button"
                onClick={() => setOsFilter(family)}
                className={`rounded px-2.5 py-1 font-mono text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  osFilter === family
                    ? 'bg-[#1b2b3f] text-[#4cd7f6]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {family}
              </button>
            )
          )}
        </div>
      </section>

      {/* Fleet Table + Asset Inspector */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <section className="overflow-hidden rounded border border-[#1F2937] bg-[#0b1c30] xl:col-span-8">
          <div className="flex items-center justify-between border-b border-[#1F2937] px-4 py-2.5">
            <h2 className="text-[15px] font-semibold text-[#F8FAFC]">
              Managed Endpoint &amp; Workload Fleet
            </h2>
            <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
              {filteredAssets.length} / {assets.length} sensors reporting
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#102034] font-mono text-[11px] font-medium uppercase tracking-[0.02em] text-[#64748B]">
                  <th className="px-3 py-2 whitespace-nowrap">Hostname</th>
                  <th className="px-3 py-2 whitespace-nowrap">IPv4</th>
                  <th className="px-3 py-2 whitespace-nowrap">Status</th>
                  <th className="px-3 py-2 whitespace-nowrap">Platform</th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">CPU / Mem</th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">CVEs</th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/70 text-xs">
                {filteredAssets.map((asset, idx) => {
                  const selected = selectedAsset?.id === asset.id;
                  const isIsolated = asset.status === 'isolated';
                  return (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`h-9 cursor-pointer transition-colors hover:bg-[#1b2b3f] ${
                        selected
                          ? 'bg-[#1b2b3f] ring-1 ring-inset ring-[#06B6D4]/50'
                          : idx % 2 === 1
                          ? 'bg-[#081628]'
                          : 'bg-[#0b1c30]'
                      }`}
                    >
                      <td className="px-3 py-1.5 font-mono font-medium text-[#38BDF8] whitespace-nowrap">
                        {asset.hostname}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-[#bcc9cd] whitespace-nowrap tabular-nums">
                        {asset.ipv4}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <StatusBadge
                          severity={
                            asset.status === 'compromised'
                              ? 'critical'
                              : asset.status === 'warning' || asset.status === 'isolated'
                              ? 'warning'
                              : 'healthy'
                          }
                          status={asset.status === 'compromised' || asset.status === 'isolated' ? asset.status : undefined}
                          pulse={asset.status === 'compromised'}
                          label={
                            asset.status === 'warning' ? 'ATTENTION' : undefined
                          }
                        />
                      </td>
                      <td className="px-3 py-1.5 text-[#94A3B8] whitespace-nowrap">
                        {asset.osFamily} · {asset.environment}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-[11px] text-[#d3e4fe] whitespace-nowrap tabular-nums">
                        {asset.cpuPct}% / {asset.memPct}%
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-[11px] whitespace-nowrap tabular-nums">
                        <span
                          className={
                            asset.openCves.length > 0
                              ? 'font-semibold text-[#F87171]'
                              : 'text-[#34D399]'
                          }
                        >
                          {asset.openCves.length}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerScan(asset.hostname);
                            }}
                            className="inline-flex h-6 items-center gap-1 rounded border border-[#374151] bg-[#102034] px-2 font-mono text-[11px] text-[#bcc9cd] hover:border-[#06B6D4] hover:text-[#F8FAFC] cursor-pointer"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${
                                scanningHost === asset.hostname
                                  ? 'animate-spin text-[#4cd7f6]'
                                  : ''
                              }`}
                            />
                            <span>Scan</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleIsolateHost(asset.hostname);
                            }}
                            className={`inline-flex h-6 items-center gap-1 rounded px-2 font-mono text-[11px] font-semibold cursor-pointer ${
                              isIsolated
                                ? 'border border-[#374151] bg-[#102034] text-[#34D399] hover:border-[#10B981]'
                                : 'bg-[#EF4444]/90 text-white hover:bg-[#EF4444]'
                            }`}
                          >
                            {isIsolated ? 'Release' : 'Isolate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Asset Detail Inspector */}
        <aside className="rounded border border-[#1F2937] bg-[#0b1c30] p-4 xl:col-span-4">
          {selectedAsset ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-[#1F2937] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-[#06B6D4]" />
                    <h3 className="font-mono text-sm font-semibold text-[#F8FAFC]">
                      {selectedAsset.hostname}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-[#94A3B8]">{selectedAsset.os}</p>
                </div>
                <StatusBadge
                  severity={
                    selectedAsset.status === 'compromised'
                      ? 'critical'
                      : selectedAsset.status === 'warning' ||
                        selectedAsset.status === 'isolated'
                      ? 'warning'
                      : 'healthy'
                  }
                  status={
                    selectedAsset.status === 'compromised' ||
                    selectedAsset.status === 'isolated'
                      ? selectedAsset.status
                      : undefined
                  }
                  pulse={selectedAsset.status === 'compromised'}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 rounded border border-[#1F2937] bg-[#031427] p-3 font-mono text-[11px]">
                <div>
                  <div className="text-[#64748B]">IPv4 Address</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[#F8FAFC] tabular-nums">
                    <span>{selectedAsset.ipv4}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[#64748B]">EDR Sensor</div>
                  <div className="mt-0.5 text-[#4cd7f6]">
                    v{selectedAsset.agentVersion}
                  </div>
                </div>
                <div>
                  <div className="text-[#64748B]">Heartbeat</div>
                  <div className="mt-0.5 text-[#34D399]">
                    {selectedAsset.lastHeartbeat}
                  </div>
                </div>
                <div>
                  <div className="text-[#64748B]">Last Full Scan</div>
                  <div className="mt-0.5 text-[#bcc9cd]">
                    {selectedAsset.lastScan}
                  </div>
                </div>
              </div>

              {/* Resource Utilization Bars */}
              <div className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="flex items-center gap-1.5 text-[#94A3B8]">
                      <Cpu className="h-3.5 w-3.5 text-[#06B6D4]" />
                      CPU Telemetry
                    </span>
                    <span className="text-[#F8FAFC] tabular-nums">
                      {selectedAsset.cpuPct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-sm bg-[#102034]">
                    <div
                      className={`h-full rounded-sm ${
                        selectedAsset.cpuPct > 80 ? 'bg-[#EF4444]' : 'bg-[#06B6D4]'
                      }`}
                      style={{ width: `${selectedAsset.cpuPct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="flex items-center gap-1.5 text-[#94A3B8]">
                      <HardDrive className="h-3.5 w-3.5 text-[#3B82F6]" />
                      Memory Pressure
                    </span>
                    <span className="text-[#F8FAFC] tabular-nums">
                      {selectedAsset.memPct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-sm bg-[#102034]">
                    <div
                      className="h-full rounded-sm bg-[#3B82F6]"
                      style={{ width: `${selectedAsset.memPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Open CVEs */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Vulnerability Posture
                  </span>
                  <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
                    {selectedAsset.openCves.length} open CVEs
                  </span>
                </div>

                {selectedAsset.openCves.length === 0 ? (
                  <div className="mt-2 rounded border border-[#10B981]/30 bg-[#10B981]/8 p-2.5 font-mono text-xs text-[#34D399]">
                    No critical or high CVEs detected on latest package manifest.
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {selectedAsset.openCves.map((cve) => (
                      <div
                        key={cve.id}
                        className="flex items-center justify-between rounded border border-[#EF4444]/30 bg-[#EF4444]/8 px-3 py-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#F87171]">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>{cve.id}</span>
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-[#94A3B8]">
                            Package: {cve.package}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#F8FAFC] tabular-nums">
                            CVSS {cve.cvss.toFixed(1)}
                          </span>
                          <CopyButton text={cve.id} label="ID" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 border-t border-[#1F2937] pt-3">
                <button
                  type="button"
                  onClick={() => onPivotHostToTelemetry(selectedAsset.hostname)}
                  className="flex-1 rounded border border-[#374151] bg-[#102034] px-3 py-1.5 font-mono text-xs font-medium text-[#4cd7f6] hover:border-[#06B6D4] cursor-pointer whitespace-nowrap"
                >
                  Query SIEM Logs
                </button>
                <button
                  type="button"
                  onClick={() => onToggleIsolateHost(selectedAsset.hostname)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 font-mono text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    selectedAsset.status === 'isolated'
                      ? 'border border-[#374151] bg-[#102034] text-[#34D399] hover:border-[#10B981]'
                      : 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                  }`}
                >
                  {selectedAsset.status === 'isolated' ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Release Host</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Isolate Host</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-[#64748B]">
              Select an endpoint from the fleet grid.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
