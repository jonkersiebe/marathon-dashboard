import "./styles/theme.css";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";

function AppContent() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
