import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  value: string;
  label: string;
  icon: ReactNode;
  trend?: 'up' | 'down';
}

export function StatsCard({ value, label, icon, trend }: StatsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-6 border border-border/50 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            'text-3xl font-bold',
            trend === 'up' && 'text-success',
            trend === 'down' && 'text-destructive'
          )}>
            {value}
          </p>
          <p className="text-muted-foreground mt-1">{label}</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      
      {/* Decorative element */}
      <div 
        className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/5"
        aria-hidden="true"
      />
    </div>
  );
}
