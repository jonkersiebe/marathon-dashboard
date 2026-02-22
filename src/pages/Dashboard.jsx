import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import AddRunForm from "../components/AddRunForm";
import TrainingPlan from "../components/TrainingPlan";
import { useAuth } from "../context/AuthContext";
import { getRuns, deleteRun } from "../services/runs";
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

            <div className="grid grid-4" style={{ marginTop: "30px" }}>
                <div className="card">
                    <div className="stat-number">
                        {Math.round(weeklyDistance * 10) / 10} km
                    </div>
                    <div className="stat-label">Weekly Distance</div>
                </div>
                <div className="card">
                    <div className="stat-number">
                        {Math.round(longestRun * 10) / 10} km
                    </div>
                    <div className="stat-label">Longest Run</div>
                </div>
                <div className="card">
                    <div className="stat-number">{avgPace}</div>
                    <div className="stat-label">Average Pace</div>
                </div>
                <div className="card">
                    <div className="stat-number">4:30</div>
                    <div className="stat-label">Goal Time</div>
                </div>
            </div>

            <div className="card" style={{ marginTop: "40px" }}>
                <h3>Weekly Mileage</h3>
                <div style={{ height: "300px", marginTop: "16px" }}>
                    {weeklyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} unit=" km" />
                                <Tooltip
                                    formatter={(value) => [`${value} km`, "Distance"]}
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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

            <div className="card" style={{ marginTop: "30px" }}>
                <TrainingPlan completedRuns={runs} onRefresh={fetchRuns} />
            </div>

            <div className="card" style={{ marginTop: "30px" }}>
                <AddRunForm onRunAdded={fetchRuns} />
            </div>

            <div className="card" style={{ marginTop: "30px" }}>
                <h3>Run History</h3>
                {loading ? (
                    <p className="stat-label">Loading...</p>
                ) : runs.length === 0 ? (
                    <p className="stat-label">No runs recorded yet.</p>
                ) : (
                    <div className="runs-list">
                        {runs.map((run) => (
                            <div key={run.id} className="run-item">
                                <div className="run-info">
                                    <strong>{run.date}</strong>
                                    <span>{run.distance} km</span>
                                    <span>{run.duration} min</span>
                                    <span className="stat-label">
                                        {formatPace(run.distance, Number(run.duration))} /km
                                    </span>
                                    {run.notes && (
                                        <span className="stat-label">{run.notes}</span>
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
