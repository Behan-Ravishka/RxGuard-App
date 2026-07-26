import { useLocation, useNavigate } from 'react-router-dom';

export default function FullDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const fdaRawText = location.state?.fda_raw_text ?? '';

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-6">
      <div className="rounded-3xl border border-gray-800 bg-gray-950 p-5 shadow-2xl shadow-black/30">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Official Source</p>
            <h2 className="mt-2 text-2xl font-black text-white">Full FDA Details</h2>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-200"
          >
            Back to Results
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 p-4">
          {fdaRawText ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-200">
              {fdaRawText}
            </p>
          ) : (
            <p className="text-sm text-gray-400">No official FDA text was provided for this scan.</p>
          )}
        </div>
      </div>
    </div>
  );
}