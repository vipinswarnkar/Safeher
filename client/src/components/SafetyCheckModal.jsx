import { useEffect, useRef, useState } from "react";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

const COUNTDOWN_SECONDS = 60;

/*
 * "Are you OK?" pop-up for smart alerts (off route, stopped, overdue).
 * If there's no answer before the countdown ends, it sends an SOS by itself.
 */
function SafetyCheckModal({ alert, onOk, onSOS }) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const fired = useRef(false);

  // Tick down once a second
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-SOS when the countdown hits zero (only once)
  useEffect(() => {
    if (secondsLeft === 0 && !fired.current) {
      fired.current = true;
      onSOS(true);
    }
  }, [secondsLeft, onSOS]);

  // Vibrate to get attention, where supported
  useEffect(() => {
    navigator.vibrate?.([300, 150, 300]);
  }, []);

  const progress = (secondsLeft / COUNTDOWN_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 flex items-end sm:items-center justify-center p-4">
      <div role="alertdialog" aria-modal="true" className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 shrink-0 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <HiOutlineExclamationTriangle size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Are you OK?</h2>
            <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
          </div>
        </div>

        <div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            If you don't answer, an SOS goes to your contacts in <strong>{secondsLeft}s</strong>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onOk}
            className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-bold"
            autoFocus
          >
            I'm OK
          </button>
          <button
            type="button"
            onClick={() => onSOS(false)}
            className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-bold"
          >
            Send SOS
          </button>
        </div>
      </div>
    </div>
  );
}

export default SafetyCheckModal;
