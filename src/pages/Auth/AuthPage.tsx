import { Navigate } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import { useAuth } from "../../context/AuthContext";

export default function AuthPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={"/profile"} replace />;
  }
  return (
    <section className="flex flex-col justify-center mx-auto h-full items-center">
      <header>
        <h1>Masuk</h1>
      </header>
      <LoginForm />
    </section>
  );
}
