interface PageStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "error" | "empty" | "success";
  compact?: boolean;
}

export function PageState({
  title,
  message,
  actionLabel,
  onAction,
  variant = "error",
  compact = false,
}: PageStateProps) {
  const icon = variant === "error"
    ? <><path d="M12 8v5" /><path d="M12 16.5v.01" /><path d="M10.3 3.8 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" /></>
    : variant === "success"
      ? <path d="m5 12 4 4L19 6" />
      : <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v8.5" /></>;

  return (
    <div className={`page-state state-${variant} ${compact ? "page-state-compact" : ""}`} role={variant === "error" ? "alert" : "status"}>
      <span className="state-symbol"><svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg></span>
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
