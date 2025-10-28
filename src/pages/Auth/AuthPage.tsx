import LoginForm from "../../components/auth/LoginForm";

export default function AuthPage() {
  return (
    <section className="flex flex-col justify-center mx-auto h-full items-center">
      <header>
        <h1>Masuk</h1>
      </header>
      <LoginForm />
    </section>
  );
}
