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
        <div className="stat-card glass-panel" style={{ gridColumn: "span 2", overflow: "hidden" }}>
            <div style={{ marginBottom: "16px" }}>
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
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "2px",
                                    backgroundColor: day.isCompleted
                                        ? "var(--primary-color)"
                                        : day.isPast
                                            ? "rgba(255, 59, 48, 0.2)" // Missed
                                            : "rgba(255, 255, 255, 0.1)", // Future
                                    border: day.date === today ? "1px solid white" : "none",
                                    transition: "transform 0.2s",
                                    cursor: "help"
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: "12px", display: "flex", gap: "16px", fontSize: "0.8rem", opacity: 0.7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "8px", height: "8px", background: "var(--primary-color)", borderRadius: "1px" }} /> Voltooid
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "8px", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "1px" }} /> Gepland
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "8px", height: "8px", background: "rgba(255, 59, 48, 0.2)", borderRadius: "1px" }} /> Gemist
                </div>
            </div>
        </div>
    );
}
