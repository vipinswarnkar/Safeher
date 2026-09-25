import BottomNav from "./BottomNav";

// Shared layout for every logged-in page: title, optional action, content, bottom nav
function PageLayout({ title, subtitle, action, children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-md mx-auto px-5 py-6 pb-28 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          {action}
        </div>

        {children}
      </div>

      <BottomNav />
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="py-16 text-center text-slate-500 font-medium">Loading...</div>
  );
}

export function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="bg-white rounded-3xl shadow p-8 text-center">
      {Icon && <Icon className="mx-auto text-rose-500" size={40} />}
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      {text && <p className="mt-1 text-sm text-slate-500">{text}</p>}
    </div>
  );
}

export function ErrorState({ onRetry }) {
  return (
    <div className="bg-white rounded-3xl shadow p-8 text-center">
      <p className="text-red-600 font-medium">Something went wrong.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-rose-600 font-semibold hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default PageLayout;
