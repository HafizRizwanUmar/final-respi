import { useEffect, useMemo, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { ref, onValue, set, get, update, push } from "firebase/database";
import { db } from "../firebase";
import { Brain } from "lucide-react";

// ---------- HELPERS ----------
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return (h >>> 0).toString(16);
}

function heuristicScore(domain) {
  const d = (domain || "").toLowerCase();
  const adHints = ["ads", "doubleclick", "track", "metrics", "click", "banner", "promo", "beacon", "telemetry"];
  let score = 0;
  adHints.forEach(k => { if (d.includes(k)) score += 0.25 });
  if (d.split(".").length >= 4) score += 0.15;
  if (/\d{2,}/.test(d)) score += 0.1;
  if (d.endsWith(".xyz") || d.endsWith(".click")) score += 0.2;
  if (d.length > 40) score += 0.1;
  return Math.min(1, score);
}

function extractFeatures(domain) {
  const d = (domain || "").toLowerCase();
  const length = d.length;
  const subdomains = d.split(".").length;
  const hasNumbers = /\d{2,}/.test(d) ? 1 : 0;
  const keywordHit = ["ads", "track", "metrics", "click", "banner", "promo", "beacon", "telemetry", "doubleclick"]
    .reduce((acc, k) => acc + (d.includes(k) ? 1 : 0), 0);
  const tld = d.split(".").pop();
  const tldType = ["xyz", "click", "info", "top"].includes(tld) ? 1 : 0;
  return [length, subdomains, hasNumbers, keywordHit, tldType];
}

function confidenceLabel(score) {
  if (score >= 0.85) return { label: "High", color: "text-red-400" };
  if (score >= 0.6) return { label: "Medium", color: "text-yellow-400" };
  return { label: "Low", color: "text-emerald-400" };
}

// ---------- COMPONENT ----------
export default function MLBrain() {
  const [queries, setQueries] = useState([]);
  const [autoMode, setAutoMode] = useState(false);
  const [mlMode, setMlMode] = useState("heuristic"); // heuristic | model
  const [model, setModel] = useState(null);
  const threshold = 0.7;

  // Load queries + settings
  useEffect(() => {
    const qref = ref(db, "pihole_logs/queries/queries");
    const aref = ref(db, "ml/settings");

    const off1 = onValue(qref, snap => setQueries(snap.val() || []));
    const off2 = onValue(aref, snap => {
      const v = snap.val();
      if (v?.autoMode !== undefined) setAutoMode(v.autoMode);
      if (v?.mlMode) setMlMode(v.mlMode);
    });

    return () => { off1(); off2(); };
  }, []);

  // Load ML model from public folder
useEffect(() => {
  const loadModel = async () => {
    try {
      console.log("🔍 Loading ML model from public folder...");
      const url = `${window.location.origin}/ml_model/model.json`; // absolute path
      const m = await tf.loadLayersModel(url);
      setModel(m);
      console.log("✅ ML model loaded successfully!");
    } catch (e) {
      console.error("❌ Could not load ML model", e);
    }
  };
  loadModel();
}, []);



  // Scoring
  const scored = useMemo(() => {
    return (queries || []).slice(0, 100).map(q => {
      let score;
      if (mlMode === "model" && model) {
        const featArr = extractFeatures(q.domain);
        const input = tf.tensor2d([featArr], [1, 5]);
        score = model.predict(input).dataSync()[0];
      } else {
        score = heuristicScore(q.domain);
      }
      const decision = score >= threshold ? "block" : "allow";
      const id = hash(q.domain + (q.client?.ip || ""));
      return { id, ...q, score, decision };
    });
  }, [queries, model, mlMode]);

  // Auto enqueue block requests
  useEffect(() => {
    if (!autoMode) return;
    scored.filter(x => x.decision === "block").forEach(async x => {
      const dpath = "ml/decisions/" + x.id;
      const existing = await get(ref(db, dpath));
      if (!existing.exists()) {
        await set(ref(db, dpath), {
          domain: x.domain,
          score: x.score,
          decision: x.decision,
          createdAt: Date.now(),
          auto: true,
          mode: mlMode
        });
        await set(ref(db, "requests/block/ml_" + x.id), {
          domain: x.domain,
          status: "pending",
          createdAt: Date.now(),
          from: mlMode
        });
        await push(ref(db, "ml/history"), {
          domain: x.domain,
          score: x.score,
          decision: x.decision,
          createdAt: Date.now(),
          auto: true,
          mode: mlMode
        });
      }
    });
  }, [autoMode, scored, mlMode]);

  // Toggle AutoMode
  const toggleAuto = async (checked) => {
    setAutoMode(checked);
    await update(ref(db, "ml/settings"), { autoMode: checked });
  };

  // Switch ML vs heuristic
  const switchMode = async (mode) => {
    setMlMode(mode);
    await update(ref(db, "ml/settings"), { mlMode: mode });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 grid gap-4">
      {/* Header */}
      <div className="card flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Brain className="text-indigo-400" /> ML Brain
        </h2>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(e) => toggleAuto(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-block
          </label>
          <select
            value={mlMode}
            onChange={(e) => switchMode(e.target.value)}
            className="p-1 rounded bg-gray-800 border border-gray-600 text-sm"
          >
            <option value="heuristic">Heuristic</option>
            <option value="model">ML Model</option>
          </select>
        </div>
      </div>

      {/* Info */}
      <div className="text-white/70 text-sm">
        {mlMode === "heuristic"
          ? "Currently using heuristic rules for scoring."
          : model
            ? "Using trained ML model from /public/ml_model/."
            : "⚠️ Model not available, fallback to heuristic."}
      </div>

      {/* Table */}
      <div className="card overflow-auto">
        <table>
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
            {scored.map((x) => {
              const conf = confidenceLabel(x.score);
              return (
                <tr key={x.id}>
                  <td className="mono">{x.domain}</td>
                  <td className="mono">{x.client?.ip ?? "—"}</td>
                  <td>
                    <div className="w-24 bg-gray-700 rounded h-3 overflow-hidden">
                      <div
                        className={`h-3 ${x.score >= threshold ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${(x.score * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-xs">{x.score.toFixed(2)}</span>
                  </td>
                  <td className={conf.color}>{conf.label}</td>
                  <td>
                    {x.decision === "block" ? (
                      <span className="px-2 py-1 rounded bg-red-500/20 text-red-300">Block</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">Allow</span>
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
