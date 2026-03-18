type EmptyStateProps = {
  title: string;
  description: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className="empty-state">
    <p className="eyebrow">Nothing yet</p>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);
