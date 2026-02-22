import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const { login, signup } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isSignup) {
                await signup(email, password);
            } else {
                await login(email, password);
            }
        } catch (err) {
            setError(
                err.code === "auth/invalid-credential"
                    ? "Invalid email or password"
                    : err.code === "auth/email-already-in-use"
                        ? "This email is already registered"
                        : err.code === "auth/weak-password"
                            ? "Password should be at least 6 characters"
                            : "Something went wrong. Try again."
            );
        }
        setLoading(false);
    }

    return (
        <div className="login-wrapper">
            <div className="card login-card">
                <h1 style={{ marginBottom: "8px" }}>🏃 Marathon</h1>
                <p className="stat-label" style={{ marginBottom: "32px" }}>
                    {isSignup ? "Create your account" : "Sign in to your dashboard"}
                </p>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: "100%", marginTop: "8px" }}
                    >
                        {loading
                            ? "Loading..."
                            : isSignup
                                ? "Create Account"
                                : "Sign In"}
                    </button>
                </form>

                <p
                    className="toggle-auth"
                    onClick={() => {
                        setIsSignup(!isSignup);
                        setError("");
                    }}
                >
                    {isSignup
                        ? "Already have an account? Sign in"
                        : "Don't have an account? Sign up"}
                </p>
            </div>
        </div>
    );
}
