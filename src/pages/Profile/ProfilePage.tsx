import { useAuthStore } from "../../store/authStore";

export default function ProfilePage() {
  const { logout } = useAuthStore();
  return (
    <div>
      <p>Profile Page</p>
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
