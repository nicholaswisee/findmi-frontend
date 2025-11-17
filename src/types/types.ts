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

export type UserDivisionEnum =
  | "Sekretaris"
  | "Bendahara"
  | "Sekretaris & Bendahara"
  | "Perizinan"
  | "MSDM"
  | "PSDM"
  | "Pengawasan"
  | "Eksekusi"
  | "Lapangan"
  | "Tour"
  | "Event Organizer"
  | "Exhibition"
  | "Pre-Event"
  | "Intrakampus"
  | "Ekstrakampus"
  | "Grafis"
  | "Dokumentasi"
  | "Publikasi"
  | "Musik"
  | "Properti"
  | "Diseminasi Umum"
  | "Diseminasi Khusus"
  | "Roadshow Paguyuban"
  | "Forum Paguyuban"
  | "Sponsorship"
  | "Entrepreneurship"
  | "Logistik"
  | "Produksi"
  | "Akomodasi dan Transportasi"
  | "IT"
  | "Panitia"
  | "none";

export type UserRankEnum =
  | "Ketua"
  | "Kepala Bidang"
  | "Wakil Kepala Bidang"
  | "Kepala Divisi"
  | "Wakil Kepala Divisi"
  | "Kepala Subdivisi"
  | "Wakil Kepala Subdivisi"
  | "Staff"
  | "none";

export type UserRoleEnum = "user" | "admin" | "subadmin";

export type OrderPaymentStatusEnum = "Pending" | "Paid" | "Failed" | "Refunded";

export type OrderPaymentMethodEnum = "Manual" | "Midtrans";

export type Product = {
  id: number;
  name: string;
  price: number;
  category: UserDepartmentEnum;
  description: string;
  image_urls: string[];
  remaining_stock: number;
  available_sizes: string[];
};

export type BundleItem = {
  product_id: number;
  amount: number;
  product?: Product;
};

export type BundleSelection = {
  product_id: number;
  size: string;
};

export type Bundle = {
  id: number;
  name: string;
  price: number;
  category: UserDepartmentEnum;
  description: string;
  image_urls: string[];
  bundle_items: BundleItem[];
  is_hidden: boolean;
};

export type User = {
  id: number;
  name: string;
  department: UserDepartmentEnum;
  division: UserDivisionEnum;
  rank: UserRankEnum;
  nim: string;
  no_wa: string;
  line_id: string;
  role: UserRoleEnum;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id?: number | null;
  bundle_id?: number | null;
  quantity: number;
  unit_price: number;
  product: Product | null;
  bundle: Bundle | null;
  selected_size?: string | null;
  selected_bundle_items?: BundleSelection[];
};

export type Order = {
  id: number;
  user_id: number;
  total_amount: number;
  payment_status: OrderPaymentStatusEnum;
  payment_method: OrderPaymentMethodEnum;
  transaction_id?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  admin_note?: string | null;
  is_taken: boolean;
};

export type UserWithOrders = User & {
  orders: Order[];
};

export type UsersWithOrdersResponse = {
  total: number;
  limit: number;
  offset: number;
  users: UserWithOrders[];
};

export type OrderWithUser = Order & {
  user: User;
};

export type OrdersWithUsersResponse = {
  orders: OrderWithUser[];
  total: number;
  limit: number;
  offset: number;
};

export type ProductsResponse = {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
};

export type BundlesResponse = {
  bundles: Bundle[];
  total: number;
  limit: number;
  offset: number;
};

export type UploadedFile = {
  filename: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
};

export type RevenueAnalyticsSummary = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
};

export type DepartmentRevenueBreakdown = {
  department: UserDepartmentEnum;
  revenue: number;
  orders: number;
};

export type WeeklyRevenuePoint = {
  week: string;
  revenue: number;
};

export type RecentRevenueOrder = {
  id: number;
  total_amount: number;
  payment_status: OrderPaymentStatusEnum;
  created_at: string;
  user: Pick<User, "id" | "name" | "department">;
};

export type RevenueAnalyticsResponse = {
  summary: RevenueAnalyticsSummary;
  weeklyRevenue: WeeklyRevenuePoint[];
  departmentBreakdown: DepartmentRevenueBreakdown[];
  recentOrders: RecentRevenueOrder[];
};
