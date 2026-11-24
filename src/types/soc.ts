export type Severity = 'critical' | 'warning' | 'healthy' | 'info';

export type IncidentStatus = 'active' | 'investigating' | 'contained' | 'resolved';

export type NavSection =
  | 'overview'
  | 'investigations'
  | 'telemetry'
  | 'assets'
  | 'intel';

export type TimeWindow = '15m' | '1h' | '24h' | '7d';

export type MitrePhase =
  | 'Initial Access'
  | 'Execution'
  | 'Persistence'
  | 'Privilege Escalation'
  | 'Credential Access'
  | 'Lateral Movement'
  | 'Exfiltration';

export interface ProcessNode {
  id: string;
  pid: number;
  name: string;
  commandLine: string;
  user: string;
  hash: string;
  malicious?: boolean;
  children?: ProcessNode[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  phase: MitrePhase;
  techniqueId: string;
  title: string;
  description: string;
  source: 'EDR' | 'SIEM' | 'Firewall' | 'IAM' | 'K8s Audit';
  processTree?: ProcessNode[];
}

export interface IncidentArtifact {
  id: string;
  type: 'sha256' | 'ipv4' | 'domain' | 'cve' | 'user';
  value: string;
  context: string;
  blocked: boolean;
}

export interface AnalystNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  host: string;
  hostIp: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  mitreTechniques: string[];
  primaryPhase: MitrePhase;
  summary: string;
  affectedUsers: string[];
  hostIsolated: boolean;
  tokenRevoked: boolean;
  timeline: TimelineEvent[];
  artifacts: IncidentArtifact[];
  notes: AnalystNote[];
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  severity: Severity;
  source: 'EDR' | 'Firewall' | 'IAM' | 'DNS' | 'K8s Audit';
  host: string;
  srcIp: string;
  dstIp: string;
  port: number;
  protocol: 'TCP' | 'UDP' | 'HTTPS' | 'SSH' | 'DNS';
  action: 'ALLOW' | 'BLOCK' | 'ALERT' | 'QUARANTINE';
  mitreId?: string;
  message: string;
  rawPayload: Record<string, string | number | boolean>;
}

export interface Asset {
  id: string;
  hostname: string;
  ipv4: string;
  os: string;
  osFamily: 'Linux' | 'Windows' | 'macOS' | 'Kubernetes';
  environment: 'Production' | 'Staging' | 'Corporate';
  agentVersion: string;
  status: 'healthy' | 'warning' | 'compromised' | 'isolated';
  cpuPct: number;
  memPct: number;
  openCves: { id: string; cvss: number; package: string }[];
  lastHeartbeat: string;
  lastScan: string;
}

export interface ThreatIoc {
  id: string;
  type: 'SHA-256' | 'IPv4' | 'Domain' | 'URL';
  value: string;
  threatActor: string;
  confidence: number;
  tlp: 'RED' | 'AMBER' | 'GREEN';
  sourceFeed: string;
  firstSeen: string;
  blocked: boolean;
}

export interface DetectionRule {
  id: string;
  name: string;
  severity: Severity;
  mitreId: string;
  phase: MitrePhase;
  query: string;
  hits24h: number;
  enabled: boolean;
  lastTriggered: string;
}
