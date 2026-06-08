interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
      {icon && <div className="text-white/20 mb-2">{icon}</div>}
      <h3 className="text-white/70 font-medium text-lg">{title}</h3>
      {description && <p className="text-white/40 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
