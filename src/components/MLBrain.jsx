import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../firebase";

// ---------- HELPERS ----------
function confidenceLabel(score) {
  if (score >= 0.85) return { label: "High", color: "text-red-400" };
  if (score >= 0.6) return { label: "Medium", color: "text-yellow-400" };
  return { label: "Low", color: "text-emerald-400" };
}

// ---------- FASTAPI HELPERS ----------
async function checkServer() {
  try {
    const res = await fetch("http://72.60.111.157/python/");
    if (!res.ok) throw new Error("Failed to connect to server");
    return await res.json();
  } catch (err) {
    console.error("❌ Server check failed:", err);
    return null;
  }
}

async function fetchPrediction(domain) {
  try {
    const res = await fetch(`https://72.60.111.157/python/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    if (!res.ok) throw new Error("Prediction failed");
    return await res.json();
  } catch (err) {
    console.error("❌ FastAPI prediction error:", err);
    return null;
  }
}

// ---------- COMPONENT ----------
export default function MLBrain() {
  const [queries, setQueries] = useState([]);
  const [autoMode, setAutoMode] = useState(false);
  const [status, setStatus] = useState("⏳ Checking server...");
  const [predictions, setPredictions] = useState({});
  const threshold = 0.7;

  // Load queries + autoMode from Firebase
  useEffect(() => {
    const qref = ref(db, "pihole_logs/queries/queries");
    const aref = ref(db, "ml/settings");

    const off1 = onValue(qref, (snap) => setQueries(snap.val() || []));
    const off2 = onValue(aref, (snap) => {
      const v = snap.val();
      if (v?.autoMode !== undefined) setAutoMode(v.autoMode);
    });

    return () => {
      off1();
      off2();
    };
  }, []);

  // Check server status
  useEffect(() => {
    (async () => {
      const info = await checkServer();
      if (info?.status === "ok") {
        setStatus(`✅ Model online: ${info.model}`);
      } else {
        setStatus("⚠️ Server not available.");
      }
    })();
  }, []);

  // Fetch predictions for queries
  useEffect(() => {
    if (!queries.length) return;

    const runPredictions = async () => {
      setStatus("🔮 Running predictions...");
      const preds = {};
      for (const q of queries.slice(0, 50)) {
        const result = await fetchPrediction(q.domain);
        if (result) {
          preds[q.domain] = result.prediction_raw; // use raw score
        }
      }
      setPredictions(preds);
      setStatus("✅ Predictions updated.");
    };

    runPredictions();
  }, [queries]);

  // Toggle AutoMode
  const toggleAuto = async (checked) => {
    setAutoMode(checked);
    await update(ref(db, "ml/settings"), { autoMode: checked });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid gap-6 font-poppins">
      {/* Header */}
      <div className="card flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="text-indigo-400" /> ML Brain (Server)
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => toggleAuto(e.target.checked)}
            className="w-4 h-4"
          />
          Auto-block (≥ {threshold})
        </label>
      </div>

      {/* Info */}
      <div className="text-white/80 text-sm italic">{status}</div>

      {/* Table */}
      <div className="card overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Client</th>
              <th>Score</th>
              <th>Confidence</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {queries.slice(0, 50).map((q) => {
              const score = predictions[q.domain] ?? 0.0;
              const decision = score >= threshold ? "block" : "allow";
              const conf = confidenceLabel(score);

              return (
                <tr key={q.id || q.timestamp}>
                  <td className="mono">{q.domain}</td>
                  <td className="mono">{q.client?.ip ?? "—"}</td>
                  <td>
                    <div className="w-24 bg-gray-700 rounded h-3 overflow-hidden">
                      <div
                        className={`h-3 ${
                          score >= threshold ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${(score * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-xs">{score.toFixed(2)}</span>
                  </td>
                  <td className={conf.color}>{conf.label}</td>
                  <td>
                    {decision === "block" ? (
                      <span className="px-2 py-1 rounded bg-red-500/20 text-red-300">
                        Block
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">
                        Allow
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
