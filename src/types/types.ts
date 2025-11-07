export type UserDepartmentEnum =
  | "Ketua AMI"
  | "Kesekjenan"
  | "Manajemen Personalia"
  | "Materi dan Metode"
  | "Relasi"
  | "ITB Day"
  | "Paguyuban Membangun"
  | "Diseminasi"
  | "Kreatif"
  | "Fundraising"
  | "Operasional"
  | "Perangkat Lapangan Utama"
  | "IT"
  | "Panitia"
  | "none";

export type OrderPaymentStatusEnum = "Pending" | "Paid" | "Failed" | "Refunded";

export type OrderPaymentMethodEnum = "Manual" | "Midtrans";

export type Product = {
  id: number;
  name: string;
  price: number;
  category: UserDepartmentEnum;
  description: string;
  image_url: string;
  remaining_stock: number;
};

export type BundleItem = {
  product_id: number;
  amount: number;
};

export type Bundle = {
  id: number;
  name: string;
  price: number;
  category: UserDepartmentEnum;
  description: string;
  image_url: string;
  bundle_items: BundleItem[];
  is_hidden: boolean;
};
