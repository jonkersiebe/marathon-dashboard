import { useMemo } from "react";
import { trainingPlan } from "../data/trainingPlan";

export default function ConsistencyHeatmap({ completedRuns = [] }) {
    const completedDates = useMemo(() => {
        return new Set(completedRuns.map(r => r.planDate).filter(Boolean));
    }, [completedRuns]);

    const today = new Date().toISOString().split("T")[0];

    // Group training plan into columns (weeks)
    const weeks = useMemo(() => {
        const wks = [];
        let currentWeek = [];

        // The plan starts on a Tuesday (2026-02-24). 
        // To make a grid, we should probably align to Mondays or just group every 7 sessions.
        // Let's just group by the actual weeks defined in our getWeekNumber logic if possible.

        trainingPlan.forEach((session, index) => {
            const isCompleted = completedDates.has(session.date);
            const isPast = session.date < today;

            currentWeek.push({
                ...session,
                isCompleted,
                isPast
            });

            if (currentWeek.length === 7 || index === trainingPlan.length - 1) {
                wks.push(currentWeek);
                currentWeek = [];
            }
        });

        return wks;
    }, [completedDates, today]);

    return (
        <div className="card stat-card glass-panel" style={{ gridColumn: "span 2" }}>
            <div style={{ marginBottom: "20px" }}>
                <span className="stat-label">🔥 Consistency Heatmap</span>
            </div>

            <div className="heatmap-container" style={{
                display: "flex",
                gap: "4px",
                overflowX: "auto",
                paddingBottom: "8px",
                maskImage: "linear-gradient(to right, black 80%, transparent 100%)"
            }}>
                {weeks.map((week, wIdx) => (
                    <div key={wIdx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {week.map((day, dIdx) => (
                            <div
                                key={day.date}
                                className="heatmap-cell"
                                title={`${day.date}: ${day.distance}km - ${day.isCompleted ? "Voltooid" : "Gepland"}`}
                                style={{
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "3px",
                                    backgroundColor: day.isCompleted
                                        ? "var(--accent)"
                                        : day.isPast
                                            ? "rgba(255, 59, 48, 0.2)" // Missed
                                            : "rgba(0, 0, 0, 0.05)", // Future
                                    border: day.date === today ? "1px solid var(--accent)" : "none",
                                    transition: "all 0.2s ease",
                                    cursor: "help",
                                    boxShadow: day.isCompleted ? "0 0 8px rgba(0, 113, 227, 0.2)" : "none"
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "20px", fontSize: "0.75rem", fontWeight: "600", opacity: 0.8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "10px", height: "10px", background: "var(--accent)", borderRadius: "2px" }} /> VOLTOOID
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "10px", height: "10px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "2px" }} /> GEPLAND
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "10px", height: "10px", background: "rgba(255, 59, 48, 0.2)", borderRadius: "2px" }} /> GEMIST
                </div>
            </div>
        </div>
    );
}
