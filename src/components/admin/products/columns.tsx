"use client";

import type { Product } from "@/types/types";
import { type ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "id",
    header: "Product ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      return <p>IDR {row.getValue("price")}</p>;
    },
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "image_url",
    header: "Image URL",
    cell: ({ row }) => {
      const imgUrl = row.getValue("image_url");

      return (
        <div className="aspect-square relative w-8 h-8 overflow-hidden flex items-center justify-center">
          <img
            src={`${imgUrl ? imgUrl : "https://picsum.photos/200/300"}`}
            alt="Product Image"
            className="object-contain w-full h-full"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "",
    header: "Modify",
    cell: ({ row }) => {
      // TO-DO: Create a hovering Card that will help edit the products
      return <div></div>;
    },
  },
];
