import type { SVGProps, ReactNode } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function getSize(className?: string): { width: number; height: number } {
  if (!className) return { width: 16, height: 16 };
  if (className.includes('w-3.5')) return { width: 14, height: 14 };
  if (className.includes('w-3')) return { width: 12, height: 12 };
  if (className.includes('w-4')) return { width: 16, height: 16 };
  if (className.includes('w-5')) return { width: 20, height: 20 };
  if (className.includes('w-6')) return { width: 24, height: 24 };
  if (className.includes('w-7')) return { width: 26, height: 26 };
  if (className.includes('w-8')) return { width: 30, height: 30 };
  if (className.includes('w-10')) return { width: 36, height: 36 };
  if (className.includes('w-12')) return { width: 40, height: 40 };
  return { width: 18, height: 18 };
}

function SvgBase({ className = 'w-4 h-4', children, width, height, style, ...props }: IconProps & { children: ReactNode }) {
  const size = getSize(className);
  return (
    <svg
      className={className}
      width={width ?? size.width}
      height={height ?? size.height}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        maxWidth: '100%',
        ...style,
      }}
      {...props}
    >
      {children}
    </svg>
  );
}

export function FileCheck(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </SvgBase>
  );
}

export function Plus(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </SvgBase>
  );
}

export function Trash2(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </SvgBase>
  );
}

export function CheckCircle2(props: IconProps) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </SvgBase>
  );
}

export function AlertCircle(props: IconProps) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </SvgBase>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </SvgBase>
  );
}

export function DollarSign(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22m5-18H9.5a4.5 4.5 0 000 9h5a4.5 4.5 0 010 9H6" />
    </SvgBase>
  );
}

export function Percent(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm11 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    </SvgBase>
  );
}

export function Sparkles(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
    </SvgBase>
  );
}

export function Filter(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </SvgBase>
  );
}

export function Clock(props: IconProps) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </SvgBase>
  );
}

export function AlertTriangle(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </SvgBase>
  );
}

export function PauseCircle(props: IconProps) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
    </SvgBase>
  );
}

export function XCircle(props: IconProps) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
    </SvgBase>
  );
}

export function Edit3(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </SvgBase>
  );
}

export function FileText(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </SvgBase>
  );
}

export function FileBadge(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </SvgBase>
  );
}

export function Printer(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </SvgBase>
  );
}

export function Eye(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </SvgBase>
  );
}

export function RefreshCw(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </SvgBase>
  );
}

export function User(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </SvgBase>
  );
}

export function Layers(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </SvgBase>
  );
}

export function Calendar(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </SvgBase>
  );
}

export function Save(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </SvgBase>
  );
}

export function Undo(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l6 6m-6-6l6-6" />
    </SvgBase>
  );
}

export function RotateCcw(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9" />
    </SvgBase>
  );
}

export function Search(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </SvgBase>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </SvgBase>
  );
}

export function UserCheck(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11l2 2 4-4" />
    </SvgBase>
  );
}

export function Users(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </SvgBase>
  );
}

export function Phone(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </SvgBase>
  );
}

export function MapPin(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </SvgBase>
  );
}

export function X(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </SvgBase>
  );
}

export function Check(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </SvgBase>
  );
}

export function UserPlus(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </SvgBase>
  );
}

export function Shield(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </SvgBase>
  );
}

export function Activity(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </SvgBase>
  );
}
