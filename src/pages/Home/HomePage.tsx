import { toast } from "sonner";

export default function HomePage() {
  return (
    <div>
      <button
        onClick={() => {
          toast.success("Hello World", {
            description: "This is an example toast",
          });
        }}
      >
        Hi
      </button>
    </div>
  );
}
