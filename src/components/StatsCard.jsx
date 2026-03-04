export default function StatsCard({ title, value, unit, icon }) {
    return (
        <div className="card stat-card glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="stat-label">{title}</div>
                <div style={{ fontSize: "1.2rem" }}>{icon}</div>
            </div>
            <div className="stat-number" style={{ marginTop: "4px" }}>
                {value} <span style={{ fontSize: "0.9rem", opacity: 0.7 }}>{unit}</span>
            </div>
        </div>
    );
}
