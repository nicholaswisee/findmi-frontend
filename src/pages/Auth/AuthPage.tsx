import { useAuth } from "../../context/AuthContext";

export default function AuthPage() {
  const { login } = useAuth();
  const handleLogin = () => {
    const dummyToken = "jwt_token_dari_backend";
    const dummyUser = { id: "1", name: "Ami User", email: "user@findmi.com" };
    login(dummyToken, dummyUser);
  };

  return (
    <div>
      <h2>Authentication Page</h2>
      <div>
        <p>Silakan login untuk melanjutkan</p>
        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}
