import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, Clock, Zap } from 'lucide-react';

interface UseCaseCardProps {
  name: string;
  role: string;
  disability: string;
  task: string;
  timeBefore: string;
  timeAfter: string;
  improvement: string;
  icon: ReactNode;
  accentColor: 'blue' | 'green' | 'amber' | 'purple';
}

const accentClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'bg-amber-100 text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  purple: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: 'bg-violet-100 text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
  },
};

export function UseCaseCard({
  name,
  role,
  disability,
  task,
  timeBefore,
  timeAfter,
  improvement,
  icon,
  accentColor,
}: UseCaseCardProps) {
  const colors = accentClasses[accentColor];

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg card-interactive',
        colors.bg,
        colors.border
      )}
      tabIndex={0}
      role="article"
      aria-label={`Use case: ${name}, ${role}`}
    >
      {/* Icon */}
      <div className={cn('inline-flex p-3 rounded-xl mb-4', colors.icon)}>
        {icon}
      </div>

      {/* Header */}
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-foreground">{name}</h3>
        <p className="text-muted-foreground">{role}</p>
        <span className={cn('inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium', colors.badge)}>
          {disability}
        </span>
      </div>

      {/* Task */}
      <p className="text-foreground/80 mb-4 leading-relaxed">
        <span className="font-medium">Task:</span> {task}
      </p>

      {/* Time comparison */}
      <div className="flex items-center gap-3 p-3 bg-background/50 rounded-xl">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span className="line-through">{timeBefore}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <div className="flex items-center gap-2 text-success font-semibold">
          <Zap className="h-4 w-4" aria-hidden="true" />
          <span>{timeAfter}</span>
        </div>
      </div>

      {/* Improvement badge */}
      <div className="absolute top-4 right-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-success/10 text-success text-sm font-bold">
          {improvement}
        </span>
      </div>
    </article>
  );
}
