import { useEffect, useState, useCallback, useMemo } from "react";
import Layout from "../components/Layout";
import AddRunForm from "../components/AddRunForm";
import TrainingPlan from "../components/TrainingPlan";
import { useAuth } from "../context/AuthContext";
import { getRuns, deleteRun } from "../services/runs";
import { trainingPlan, RACE_DATE } from "../data/trainingPlan";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

function formatPace(distanceKm, durationMin) {
    if (!distanceKm || distanceKm === 0) return "0:00";
    const pace = durationMin / distanceKm;
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getWeeklyData(runs) {
    const weeks = {};
    runs.forEach((run) => {
        const d = new Date(run.date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day; // Sunday → previous Monday
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() + diff);
        const key = startOfWeek.toISOString().split("T")[0];
        if (!weeks[key]) weeks[key] = 0;
        weeks[key] += run.distance;
    });

    return Object.entries(weeks)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8)
        .map(([week, km]) => ({
            week: new Date(week).toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "short",
            }),
            km: Math.round(km * 10) / 10,
        }));
}

function Countdown({ RACE_DATE }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = +new Date(RACE_DATE) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [RACE_DATE]);

    return (
        <div className="card countdown-card">
            <div className="countdown-label">ROAD TO GENK MARATHON 🏁</div>
            <div className="countdown-timer">
                <div className="countdown-item">
                    <span className="countdown-number">{timeLeft.days || 0}</span>
                    <span className="countdown-unit">Dagen</span>
                </div>
                <div className="countdown-divider">:</div>
                <div className="countdown-item">
                    <span className="countdown-number">{String(timeLeft.hours || 0).padStart(2, '0')}</span>
                    <span className="countdown-unit">Uur</span>
                </div>
                <div className="countdown-divider">:</div>
                <div className="countdown-item">
                    <span className="countdown-number">{String(timeLeft.minutes || 0).padStart(2, '0')}</span>
                    <span className="countdown-unit">Min</span>
                </div>
                <div className="countdown-divider">:</div>
                <div className="countdown-item">
                    <span className="countdown-number">{String(timeLeft.seconds || 0).padStart(2, '0')}</span>
                    <span className="countdown-unit">Sec</span>
                </div>
            </div>
        </div>
    );
}


export default function Dashboard() {
    const { user, logout } = useAuth();
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchRuns = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getRuns(user.uid);
            setRuns(data);
        } catch (err) {
            console.error("Error fetching runs:", err);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchRuns();
    }, [fetchRuns]);

    async function handleDelete(id) {
        await deleteRun(id);
        fetchRuns();
    }

    const motivationStats = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let completed = 0;
        let missed = 0;
        let upcoming = 0;

        const completedDates = {};
        runs.forEach(r => completedDates[r.date] = true);

        trainingPlan.forEach(session => {
            const sessionDate = new Date(session.date);
            if (completedDates[session.date]) {
                completed++;
            } else if (sessionDate < now) {
                missed++;
            } else {
                upcoming++;
            }
        });

        const totalPast = completed + missed;
        const consistency = totalPast > 0 ? Math.round((completed / totalPast) * 100) : 100;
        const totalPlan = trainingPlan.length;
        const overallProgress = Math.round((completed / totalPlan) * 100);

        let quote = "Lekker bezig! Elke stap telt. 🏃‍♂️";
        if (consistency >= 90) quote = "Legendarische discipline! Je bent een machine. 🔥";
        else if (consistency >= 75) quote = "Sterk werk, houd dit ritme vast! 🚀";
        else if (consistency < 50) quote = "Tijd voor een comeback! Je kunt het. 💪";

        return { completed, missed, upcoming, consistency, overallProgress, quote };
    }, [runs]);

    // Stats
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const thisWeekRuns = runs.filter((r) => new Date(r.date) >= weekAgo);
    const weeklyDistance = thisWeekRuns.reduce((sum, r) => sum + r.distance, 0);
    const longestRun = runs.length
        ? Math.max(...runs.map((r) => r.distance))
        : 0;

    const totalDist = runs.reduce((s, r) => s + r.distance, 0);
    const totalDur = runs.reduce((s, r) => s + Number(r.duration), 0);
    const avgPace = formatPace(totalDist, totalDur);

    const weeklyData = getWeeklyData(runs);

    return (
        <Layout>
            <div className="dashboard-header">
                <h1>Marathon Dashboard</h1>
                <button onClick={logout} className="btn-secondary">
                    Sign Out
                </button>
            </div>

            <Countdown RACE_DATE={RACE_DATE} />

            <div className="motivation-grid">
                <div className="card motivation-card">
                    <div className="motivation-content">
                        <div className="stat-label" style={{ color: '#a1a1a6', fontWeight: 600, fontSize: '12px' }}>DISCIPLINE SCORE</div>
                        <div className="consistency-score">{motivationStats.consistency}%</div>
                        <div style={{ color: '#a1a1a6', fontSize: '13px', marginTop: '4px' }}>
                            Je hebt <strong>{motivationStats.completed}</strong> van de {motivationStats.completed + motivationStats.missed} geplande sessies voltooid.
                        </div>

                        <div className="status-pills">
                            <div className="status-pill pill-done">
                                <span className="pill-label">Done</span>
                                <span className="pill-value">{motivationStats.completed}</span>
                            </div>
                            <div className="status-pill pill-missed">
                                <span className="pill-label">Missed</span>
                                <span className="pill-value">{motivationStats.missed}</span>
                            </div>
                            <div className="status-pill pill-upcoming">
                                <span className="pill-label">To Go</span>
                                <span className="pill-value">{motivationStats.upcoming}</span>
                            </div>
                        </div>

                        <div className="motivation-quote">
                            {motivationStats.consistency >= 75 ? "✅" : "💡"} {motivationStats.quote}
                        </div>
                    </div>
                </div>

                <div className="card circle-progress-container stat-card">
                    <div className="circle-progress-wrapper">
                        <svg className="circle-progress-svg">
                            <circle className="circle-bg" cx="70" cy="70" r="64" />
                            <circle
                                className="circle-fill"
                                cx="70" cy="70" r="64"
                                strokeDasharray={`${(motivationStats.overallProgress / 100) * 402} 402`}
                            />
                        </svg>
                        <div className="circle-text">
                            <span className="circle-percentage">{motivationStats.overallProgress}%</span>
                            <span className="circle-label">Progress</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginTop: "24px" }}>
                <div className="card stat-card">
                    <div className="stat-number">
                        {Math.round(weeklyDistance * 10) / 10} km
                    </div>
                    <div className="stat-label">Weekly Distance</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-number">
                        {Math.round(longestRun * 10) / 10} km
                    </div>
                    <div className="stat-label">Longest Run</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-number">{avgPace}</div>
                    <div className="stat-label">Average Pace</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-number">4:30</div>
                    <div className="stat-label">Goal Time</div>
                </div>
            </div>

            <div className="card" style={{ marginTop: "32px" }}>
                <h3>Weekly Mileage</h3>
                <div style={{ height: "300px", marginTop: "16px" }}>
                    {weeklyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="week" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12 }} unit=" km" axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f5f5f7' }}
                                    formatter={(value) => [`${value} km`, "Distance"]}
                                    contentStyle={{
                                        borderRadius: "16px",
                                        border: "none",
                                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                        padding: '12px'
                                    }}
                                />
                                <Bar dataKey="km" fill="#0071e3" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="stat-label">
                            No runs yet. Add your first run below!
                        </p>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginTop: "32px" }}>
                <TrainingPlan completedRuns={runs} onRefresh={fetchRuns} />
            </div>

            <div className="card" style={{ marginTop: "32px" }}>
                <AddRunForm onRunAdded={fetchRuns} />
            </div>

            <div className="card" style={{ marginTop: "32px" }}>
                <h3 style={{ marginBottom: '16px' }}>Run History</h3>
                {loading ? (
                    <p className="stat-label">Loading...</p>
                ) : runs.length === 0 ? (
                    <p className="stat-label">No runs recorded yet.</p>
                ) : (
                    <div className="runs-list">
                        {runs.map((run) => (
                            <div key={run.id} className="run-item">
                                <div className="run-info">
                                    <strong style={{ fontSize: '15px' }}>{run.date}</strong>
                                    <span style={{ fontWeight: 600 }}>{run.distance} km</span>
                                    <span>{run.duration} min</span>
                                    <span className="stat-label" style={{ background: '#f2f2f7', padding: '2px 8px', borderRadius: '6px' }}>
                                        {formatPace(run.distance, Number(run.duration))} /km
                                    </span>
                                    {run.notes && (
                                        <span className="stat-label" style={{ fontStyle: 'italic' }}>"{run.notes}"</span>
                                    )}
                                </div>
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDelete(run.id)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
