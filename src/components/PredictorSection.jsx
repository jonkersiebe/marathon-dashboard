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
        <div className="card stat-card glass-panel" style={{ gridColumn: "span 2" }}>
            <div className="predictor-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <span className="stat-label">✨ Marathon-voorspelling</span>
                    <h2 className="stat-number" style={{ fontSize: "3.2rem", margin: "12px 0", letterSpacing: "-2px" }}>
                        {formatTime(prediction.predictedTime)}
                    </h2>
                    <p className="stat-label" style={{ opacity: 0.8, textTransform: "none" }}>
                        Gebaseerd op je {prediction.distance} km run op {new Date(prediction.date).toLocaleDateString("nl-NL")}
                    </p>
                </div>
                <div className="goal-badge" style={{
                    background: "var(--accent-gradient)",
                    padding: "10px 16px",
                    borderRadius: "14px",
                    color: "white",
                    fontWeight: "700",
                    fontSize: "0.9rem",
                    boxShadow: "0 4px 15px rgba(0, 113, 227, 0.3)"
                }}>
                    🎯 Doel: 4:30
                </div>
            </div>

            <div className="predictor-insight" style={{
                marginTop: "24px",
                padding: "16px",
                background: "rgba(0, 113, 227, 0.05)",
                borderRadius: "14px",
                fontSize: "0.95rem",
                border: "1px solid rgba(0, 113, 227, 0.1)",
                color: "var(--primary)",
                lineHeight: "1.4"
            }}>
                {prediction.predictedTime < 270 ? (
                    <span><strong>🔥 Lekker!</strong> Je bent sneller dan je doel. Blijf dit tempo vasthouden in je duurlopen.</span>
                ) : (
                    <span><strong>💪 Zet 'm op!</strong> Je bent goed op weg. Focus op je duurlopen om je uithoudingsvermogen te vergroten.</span>
                )}
            </div>
        </div>
    );
}
