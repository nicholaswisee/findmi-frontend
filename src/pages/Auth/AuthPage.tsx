import { Navigate } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import { useAuthStore } from "../../store/authStore";

export default function AuthPage() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/profile" />;
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
