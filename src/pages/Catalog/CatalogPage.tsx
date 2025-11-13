import { useEffect } from "react";

export default function CatalogPage() {
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/product`);
      const data = await res.json();
      console.log(data);
    };
    fetchData();
  }, []);

  return <div>CatalogPage</div>;
}
