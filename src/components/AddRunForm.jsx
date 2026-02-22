import { useState } from "react";
import { addRun } from "../services/runs";
import { useAuth } from "../context/AuthContext";

export default function AddRunForm({ onRunAdded }) {
    const { user } = useAuth();
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!distance || !duration) return;

        setLoading(true);
        try {
            await addRun(user.uid, { date, distance, duration, notes });
            setDistance("");
            setDuration("");
            setNotes("");
            if (onRunAdded) onRunAdded();
        } catch (err) {
            console.error("Error adding run:", err);
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="add-run-form">
            <h3>Add Run</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Distance (km)</label>
                    <input
                        type="number"
                        step="0.1"
                        placeholder="10.5"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Duration (min)</label>
                    <input
                        type="number"
                        placeholder="55"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Notes</label>
                    <input
                        type="text"
                        placeholder="Easy run, tempo..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: "16px" }}>
                {loading ? "Saving..." : "Add Run"}
            </button>
        </form>
    );
}
