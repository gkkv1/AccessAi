import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  category: 'input' | 'processing' | 'output';
}

const categoryStyles = {
  input: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  processing: {
    border: 'border-l-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  output: {
    border: 'border-l-accent',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
  },
};

export function FeatureCard({ title, description, icon, category }: FeatureCardProps) {
  const styles = categoryStyles[category];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-card p-5 border border-border/50 shadow-sm',
        'border-l-4',
        styles.border,
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      <div className={cn('inline-flex p-2.5 rounded-lg mb-3', styles.iconBg, styles.iconColor)}>
        {icon}
      </div>
      <h4 className="font-semibold text-foreground mb-1.5">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
