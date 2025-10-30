import { useAuthStore } from "../../store/authStore";

export default function ProfilePage() {
  const { logout } = useAuthStore();
  return (
    <div>
      <button
        onClick={() => {
          logout();
        }}
      >
        Logout
      </button>
    </div>
  );
}
