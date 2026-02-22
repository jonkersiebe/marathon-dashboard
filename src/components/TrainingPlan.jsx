import { useMemo, useState } from "react";
import { trainingPlan, RACE_DATE } from "../data/trainingPlan";
import { addRun, deleteRunByPlanDate } from "../services/runs";
import { useAuth } from "../context/AuthContext";

const TYPE_COLORS = {
    Easy: "#34c759",
    Long: "#0071e3",
    Tempo: "#ff9500",
    Interval: "#ff3b30",
    RACE: "#af52de",
};

function getWeekNumber(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    const start = new Date("2026-02-23"); // first Monday of plan
    return Math.floor((monday - start) / (7 * 86400000)) + 1;
}

export default function TrainingPlan({ completedRuns = [], onRefresh }) {
    const { user } = useAuth();
    const today = new Date().toISOString().split("T")[0];
    const [showAll, setShowAll] = useState(false);
    const [toggling, setToggling] = useState({});
    const [modalSession, setModalSession] = useState(null);
    const [duration, setDuration] = useState("");

    const completedDates = useMemo(() => {
        // Map of date -> runId for plan runs
        const map = {};
        completedRuns.forEach((r) => {
            if (r.planDate) map[r.planDate] = r.id;
        });
        return map;
    }, [completedRuns]);

    async function handleToggle(session) {
        if (!user) return;
        const isDone = !!completedDates[session.date];

        if (isDone) {
            // Untoggle immediately
            setToggling(prev => ({ ...prev, [session.date]: true }));
            try {
                await deleteRunByPlanDate(user.uid, session.date);
                if (onRefresh) await onRefresh();
            } catch (err) {
                console.error("Error toggling session:", err);
            }
            setToggling(prev => ({ ...prev, [session.date]: false }));
        } else {
            // Open modal for duration
            setModalSession(session);
            setDuration("");
        }
    }

    async function confirmCheckOff() {
        if (!user || !modalSession) return;

        setToggling(prev => ({ ...prev, [modalSession.date]: true }));
        const sessionToToggle = modalSession;
        setModalSession(null);

        try {
            await addRun(user.uid, {
                date: sessionToToggle.date,
                distance: sessionToToggle.distance,
                duration: duration || 0,
                notes: sessionToToggle.notes,
                isPlanRun: true,
                planDate: sessionToToggle.date
            });
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error("Error adding plan run:", err);
        }
        setToggling(prev => ({ ...prev, [sessionToToggle.date]: false }));
    }

    const daysUntilRace = Math.ceil(
        (new Date(RACE_DATE) - new Date(today)) / 86400000
    );

    // Group by week
    const weeks = useMemo(() => {
        const grouped = {};
        trainingPlan.forEach((session) => {
            const wk = getWeekNumber(session.date);
            if (!grouped[wk]) grouped[wk] = [];
            grouped[wk].push(session);
        });
        return Object.entries(grouped).map(([week, sessions]) => ({
            week: Number(week),
            sessions,
            totalKm: sessions.reduce((s, r) => s + r.distance, 0),
        }));
    }, []);

    // Find current week
    const currentWeek = getWeekNumber(today);

    // Filter to show upcoming or all
    const visibleWeeks = showAll
        ? weeks
        : weeks.filter((w) => w.week >= currentWeek - 1 && w.week <= currentWeek + 3);

    // Next planned session
    const nextSession = trainingPlan.find((s) => s.date >= today && !completedDates[s.date]);

    // Progress
    const totalDone = Object.keys(completedDates).length;
    const progressPct = Math.round((totalDone / trainingPlan.length) * 100);

    return (
        <div>
            {/* Race countdown + progress */}
            <div className="plan-header">
                <div>
                    <h3>Training Plan</h3>
                    <span className="stat-label">
                        🏁 {daysUntilRace} dagen tot de marathon
                    </span>
                </div>
                <div className="plan-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <span className="stat-label">{progressPct}% voltooid</span>
                </div>
            </div>

            {/* Next session highlight */}
            {nextSession && (
                <div
                    className="next-session"
                    style={{ borderLeft: `4px solid ${TYPE_COLORS[nextSession.type]}` }}
                >
                    <div className="stat-label">Volgende training</div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
                        <strong>
                            {new Date(nextSession.date).toLocaleDateString("nl-NL", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                            })}
                        </strong>
                        <span
                            className="type-badge"
                            style={{ background: TYPE_COLORS[nextSession.type] }}
                        >
                            {nextSession.type}
                        </span>
                        <span>{nextSession.distance} km</span>
                        <span className="stat-label">{nextSession.notes}</span>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="type-legend">
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                    <span key={type} className="legend-item">
                        <span className="legend-dot" style={{ background: color }} />
                        {type}
                    </span>
                ))}
            </div>

            {/* Week cards */}
            <div className="weeks-list">
                {visibleWeeks.map((w) => (
                    <div
                        key={w.week}
                        className={`week-card ${w.week === currentWeek ? "week-current" : ""}`}
                    >
                        <div className="week-header">
                            <strong>
                                Week {w.week}
                                {w.week === currentWeek && (
                                    <span className="current-badge">Nu</span>
                                )}
                            </strong>
                            <span className="stat-label">{w.totalKm} km</span>
                        </div>
                        <div className="week-sessions">
                            {w.sessions.map((s) => {
                                const doneId = completedDates[s.date];
                                const done = !!doneId;
                                const isToday = s.date === today;
                                const isLoading = toggling[s.date];

                                return (
                                    <div
                                        key={s.date}
                                        className={`session-row ${done ? "session-done" : ""} ${isToday ? "session-today" : ""}`}
                                        onClick={() => !isLoading && handleToggle(s)}
                                        style={{ cursor: isLoading ? "wait" : "pointer" }}
                                    >
                                        <span
                                            className="session-dot"
                                            style={{ background: TYPE_COLORS[s.type] }}
                                        />
                                        <span className="session-date">
                                            {new Date(s.date).toLocaleDateString("nl-NL", {
                                                weekday: "short",
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                        <span
                                            className="type-badge type-badge-sm"
                                            style={{ background: TYPE_COLORS[s.type] }}
                                        >
                                            {s.type}
                                        </span>
                                        <span className="session-km">{s.distance} km</span>
                                        <span className="stat-label session-notes">{s.notes}</span>
                                        {isLoading ? (
                                            <span className="stat-label">...</span>
                                        ) : done ? (
                                            <span className="check-mark">✓</span>
                                        ) : (
                                            <span className="check-mark-empty">○</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Overlay */}
            {modalSession && (
                <div className="modal-overlay" onClick={() => setModalSession(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Training volbracht? 🏃‍♂️</h3>
                        <p className="stat-label" style={{ marginBottom: "20px" }}>
                            {new Date(modalSession.date).toLocaleDateString("nl-NL", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                            })} - {modalSession.distance} km
                        </p>

                        <div className="form-group">
                            <label>Duur (minuten)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="Hoe lang heb je gelopen?"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && confirmCheckOff()}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setModalSession(null)}>
                                Annuleren
                            </button>
                            <button onClick={confirmCheckOff}>
                                Opslaan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                className="btn-secondary"
                onClick={() => setShowAll(!showAll)}
                style={{ marginTop: "16px", display: "block", width: "100%" }}
            >
                {showAll ? "Toon huidige weken" : "Toon volledig schema"}
            </button>
        </div>
    );
}
