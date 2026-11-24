import React, { useId, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { IncidentStatus, Severity } from '../../types/soc';

interface StatusBadgeProps {
  severity?: Severity;
  status?: IncidentStatus | 'compromised' | 'isolated';
  label?: string;
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  severity,
  status,
  label,
  pulse = false,
}) => {
  const resolvedType = (() => {
    if (status === 'compromised' || severity === 'critical') return 'critical';
    if (status === 'isolated' || status === 'investigating' || severity === 'warning')
      return 'warning';
    if (status === 'resolved' || status === 'contained' || severity === 'healthy')
      return 'healthy';
    return 'info';
  })();

  const defaultLabel = (() => {
    if (label) return label;
    if (status) return status.toUpperCase();
    switch (resolvedType) {
      case 'critical':
        return 'P1 CRITICAL';
      case 'warning':
        return 'P2 WARNING';
      case 'healthy':
        return 'HEALTHY';
      default:
        return 'TRIAGE';
    }
  })();

  const styles: Record<string, string> = {
    critical:
      'bg-[#EF4444]/12 border-[#EF4444]/40 text-[#F87171]',
    warning:
      'bg-[#F59E0B]/12 border-[#F59E0B]/40 text-[#FBBF24]',
    healthy:
      'bg-[#10B981]/12 border-[#10B981]/40 text-[#34D399]',
    info:
      'bg-[#3B82F6]/12 border-[#3B82F6]/40 text-[#60A5FA]',
  };

  const dotColors: Record<string, string> = {
    critical: 'bg-[#EF4444]',
    warning: 'bg-[#F59E0B]',
    healthy: 'bg-[#10B981]',
    info: 'bg-[#3B82F6]',
  };

  return (
    <span
      className={`inline-flex h-5 items-center gap-1.5 rounded-lg border px-2 font-mono text-[10px] font-medium tracking-[0.04em] whitespace-nowrap shrink-0 ${styles[resolvedType]}`}
    >
      {pulse && resolvedType === 'critical' && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EF4444] opacity-75" />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColors[resolvedType]}`} />
        </span>
      )}
      <span>{defaultLabel}</span>
    </span>
  );
};

export const MitreTag: React.FC<{ id: string; onClick?: () => void }> = ({
  id,
  onClick,
}) => {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-5 items-center rounded border border-[#374151] bg-[#102034] px-1.5 font-mono text-[10px] font-medium text-[#adc6ff] transition-colors hover:border-[#06B6D4] hover:text-[#4cd7f6] whitespace-nowrap shrink-0 cursor-pointer"
      >
        {id}
      </button>
    );
  }
  return (
    <span className="inline-flex h-5 items-center rounded border border-[#374151] bg-[#102034] px-1.5 font-mono text-[10px] font-medium text-[#adc6ff] whitespace-nowrap shrink-0">
      {id}
    </span>
  );
};

interface SparklineProps {
  data: number[];
  stroke?: string;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  stroke = '#06B6D4',
  height = 40,
}) => {
  const gradId = useId();
  if (!data.length) return null;

  const width = 160;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 4;

  const points = data.map((val, idx) => {
    const x = (idx / Math.max(data.length - 1, 1)) * width;
    const y =
      height -
      paddingY -
      ((val - min) / range) * (height - paddingY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-full overflow-visible"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  delta: string;
  deltaTone: 'critical' | 'warning' | 'healthy' | 'neutral';
  sparkData: number[];
  sparkColor?: string;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  delta,
  deltaTone,
  sparkData,
  sparkColor = '#06B6D4',
  subtitle,
}) => {
  const deltaStyles: Record<string, string> = {
    critical: 'text-[#F87171]',
    warning: 'text-[#FBBF24]',
    healthy: 'text-[#34D399]',
    neutral: 'text-[#94A3B8]',
  };

  return (
    <div className="flex flex-col justify-between rounded border border-[#1F2937] bg-[#0b1c30] p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
          {title}
        </span>
        <span
          className={`font-mono text-[11px] font-medium tabular-nums whitespace-nowrap shrink-0 ${deltaStyles[deltaTone]}`}
        >
          {delta}
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="font-mono text-2xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums">
          {value}
        </span>
        {subtitle && (
          <span className="text-[11px] text-[#64748B] truncate">{subtitle}</span>
        )}
      </div>
      <div className="mt-3">
        <Sparkline data={sparkData} stroke={sparkColor} />
      </div>
    </div>
  );
};

export const CopyButton: React.FC<{ text: string; label?: string }> = ({
  text,
  label = 'Copy',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${text}`}
      className="inline-flex h-6 items-center gap-1 rounded border border-[#374151] bg-[#102034] px-2 font-mono text-[11px] text-[#bcc9cd] transition-colors hover:border-[#4cd7f6]/60 hover:text-[#F8FAFC] cursor-pointer whitespace-nowrap shrink-0"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-[#34D399]" />
          <span className="text-[#34D399]">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 text-[#94A3B8]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
