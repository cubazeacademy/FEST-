import React from 'react';
import { AwardPosition, AwardGrade, FestCategory, FestSection } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'arts' | 'sports' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple' | 'gold' | 'silver' | 'bronze';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-semibold',
    lg: 'text-sm px-3 py-1 font-bold'
  }[size];

  const variantClasses = {
    arts: 'bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs',
    sports: 'bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs',
    success: 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs',
    purple: 'bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs',
    gold: 'bg-amber-50 text-amber-800 border border-amber-200 font-bold shadow-2xs',
    silver: 'bg-slate-100 text-slate-700 border border-slate-200 font-bold shadow-2xs',
    bronze: 'bg-stone-100 text-stone-700 border border-stone-200 font-bold shadow-2xs'
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

export const SectionBadge: React.FC<{ section: FestSection }> = ({ section }) => {
  if (section === 'ARTS') {
    return <Badge variant="arts">🎭 Arts</Badge>;
  }
  return <Badge variant="sports">🏃 Sports</Badge>;
};

export const CategoryBadge: React.FC<{ category: FestCategory }> = ({ category }) => {
  const label = category ? String(category).replace(/_/g, ' ') : 'General';
  return <Badge variant="neutral">{label}</Badge>;
};

export const PositionBadge: React.FC<{ position: AwardPosition }> = ({ position }) => {
  if (position === 'FIRST') return <Badge variant="gold">🥇 1st (Gold)</Badge>;
  if (position === 'SECOND') return <Badge variant="silver">🥈 2nd (Silver)</Badge>;
  if (position === 'THIRD') return <Badge variant="bronze">🥉 3rd (Bronze)</Badge>;
  if (position === 'OTHER') return <Badge variant="neutral">🎖️ Special</Badge>;
  return <span className="text-slate-400 text-xs font-mono">-</span>;
};

export const GradeBadge: React.FC<{ grade: AwardGrade }> = ({ grade }) => {
  if (grade === 'A') return <Badge variant="arts" className="font-bold">Grade A</Badge>;
  if (grade === 'B') return <Badge variant="neutral" className="font-bold">Grade B</Badge>;
  if (grade === 'C') return <Badge variant="neutral" className="font-bold">Grade C</Badge>;
  if (grade === 'D') return <Badge variant="neutral">Grade D</Badge>;
  return <span className="text-slate-400 text-xs">No Grade</span>;
};
