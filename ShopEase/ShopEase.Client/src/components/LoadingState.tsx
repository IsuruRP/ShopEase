type LoadingVariant = "cards" | "rows" | "table" | "detail" | "dashboard" | "profile";

export function LoadingState({ variant = "table", count = 4, label = "Loading content" }: { variant?: LoadingVariant; count?: number; label?: string }) {
  if (variant === "detail") {
    return <div className="loading-detail" role="status" aria-label={label}><div className="loading-block loading-detail-art" /><div className="loading-detail-copy"><i /><i /><i /><i /></div><span className="sr-only">{label}</span></div>;
  }

  if (variant === "dashboard") {
    return <div className="loading-dashboard" role="status" aria-label={label}><div className="loading-metrics">{Array.from({ length: 4 }).map((_, index) => <i className="loading-block" key={index} />)}</div><div className="loading-dashboard-body"><i className="loading-block" /><i className="loading-block" /></div><span className="sr-only">{label}</span></div>;
  }

  if (variant === "profile") {
    return <div className="loading-profile" role="status" aria-label={label}><i className="loading-block" /><i className="loading-block" /><span className="sr-only">{label}</span></div>;
  }

  if (variant === "cards") {
    return <div className="loading-card-grid" role="status" aria-label={label}>{Array.from({ length: count }).map((_, index) => <div className="loading-card" key={index}><i className="loading-block" /><span className="loading-block" /><span className="loading-block short" /></div>)}<span className="sr-only">{label}</span></div>;
  }

  return <div className={`loading-list loading-${variant}`} role="status" aria-label={label}>{Array.from({ length: count }).map((_, index) => <div key={index}><i className="loading-block" /><span><b className="loading-block" /><b className="loading-block short" /></span><em className="loading-block" /></div>)}<span className="sr-only">{label}</span></div>;
}
