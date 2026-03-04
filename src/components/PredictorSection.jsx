import { useMemo } from "react";

/**
 * Predicts race time based on a past performance.
 * Riegel's Formula: T2 = T1 * (d2 / d1) ^ 1.06
 */
function predictTime(distance, duration, targetDistance = 42.195) {
    if (!distance || !duration) return null;
    const time = duration; // in minutes
    const prediction = time * Math.pow(targetDistance / distance, 1.06);
    return prediction;
}

function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    const s = Math.round((minutes * 60) % 60);
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PredictorSection({ completedRuns = [] }) {
    const prediction = useMemo(() => {
        // Filter for relevant runs (Tempo or Long, distance > 5km, not too old)
        // We sort by "most optimistic" prediction
        const relevantRuns = completedRuns
            .filter(r => r.distance >= 5 && r.duration > 0)
            .map(r => ({
                ...r,
                predictedTime: predictTime(r.distance, r.duration)
            }))
            .filter(r => r.predictedTime)
            .sort((a, b) => a.predictedTime - b.predictedTime);

        // Return the best (lowest) prediction
        return relevantRuns[0] || null;
    }, [completedRuns]);

    if (!prediction) return null;

    return (
        <div className="stat-card glass-panel" style={{ gridColumn: "span 2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <span className="stat-label">✨ Marathon-voorspelling</span>
                    <h2 style={{ fontSize: "2.5rem", margin: "8px 0" }}>
                        {formatTime(prediction.predictedTime)}
                    </h2>
                    <p className="stat-label" style={{ color: "var(--primary-color)" }}>
                        Gebaseerd op je {prediction.distance} km run op {new Date(prediction.date).toLocaleDateString("nl-NL")}
                    </p>
                </div>
                <div className="consistency-badge" style={{ background: "var(--accent-gradient)", padding: "12px", borderRadius: "12px", color: "white" }}>
                    🎯 Doel: 4:30
                </div>
            </div>
            <div style={{ marginTop: "16px", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", fontSize: "0.9rem" }}>
                {prediction.predictedTime < 270 ? (
                    "🔥 Je bent sneller dan je doel! Blijf dit tempo vasthouden in je duurlopen."
                ) : (
                    "💪 Je bent goed op weg. Focus op je duurlopen om je uithoudingsvermogen te vergroten."
                )}
            </div>
        </div>
    );
}
