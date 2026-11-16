interface PageStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PageState({
  title,
  message,
  actionLabel,
  onAction,
}: PageStateProps) {
  return (
    <div className="page-state">
      <span className="state-symbol">!</span>
      <h2>{title}</h2>
      <p>{message}</p>
      {actionLabel && onAction && (
        <button className="secondary-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
