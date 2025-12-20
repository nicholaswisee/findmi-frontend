export type UserDepartmentEnum =
  | "All"
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
  | "Tutor"
  | "Umum"
  | "Panitia"
  | "CASIO x Zebra x FindMi"
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

export type UserMultikampusEnum = "Bandung" | "Jatinangor" | "Cirebon" | "none";

export type UserRoleEnum = "user" | "admin" | "subadmin";

export type OrderPaymentStatusEnum = "Pending" | "Paid" | "Failed" | "Refunded";

export type OrderPaymentMethodEnum = "Manual" | "Midtrans";

export type OrderFulfillmentMethod = "OTS" | "Delivery";

export type ManualPaymentProof = {
  id: number;
  order_id: number;
  user_id: number;
  image_url: string;
  storage_provider?: string;
  storage_key?: string | null;
  status: "Pending" | "Approved" | "Rejected";
  reviewer_note?: string | null;
  reviewer_id?: number | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ManualPaymentProofWithOrderUser = ManualPaymentProof & {
  order: Pick<
    Order,
    "id" | "total_amount" | "payment_status" | "transaction_id" | "created_at"
  >;
  user: Pick<User, "id" | "name" | "nim" | "department">;
};

export type ManualPaymentSummary = {
  order_id: number;
  payment_method: OrderPaymentMethodEnum;
  payment_status: OrderPaymentStatusEnum;
  total_amount: string;
  qris_image_url: string;
  instructions: string;
  contact: string;
  expires_at: string | null;
  latest_proof: ManualPaymentProof | null;
};

export type ProductOption = {
  label: string;
  additional_price: number;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  category: UserDepartmentEnum;
  description: string;
  image_urls: string[];
  remaining_stock: number;
  available_sizes: string[];
  options?: ProductOption[];
};

export type BundleItem = {
  product_id: number;
  amount: number;
  product?: Product;
};

export type BundleSelection = {
  product_id: number;
  size?: string;
  option?: string;
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
  multikampus: UserMultikampusEnum;
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
  selected_option?: string | null;
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
  fulfillment_method: OrderFulfillmentMethod;
  delivery_fee: number;
  delivery_contact_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
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

export type ManualPaymentUploadResponse = {
  proof: ManualPaymentProof;
  order_id: number;
  payment_status: OrderPaymentStatusEnum;
};

export type ManualPaymentProofListResponse = {
  proofs: ManualPaymentProofWithOrderUser[];
  total: number;
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

export type DivisionRevenueBreakdown = {
  division: UserDivisionEnum;
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
  user: Pick<User, "id" | "name" | "department" | "division">;
};

export type RevenueAnalyticsResponse = {
  summary: RevenueAnalyticsSummary;
  weeklyRevenue: WeeklyRevenuePoint[];
  departmentBreakdown: DepartmentRevenueBreakdown[];
  divisionBreakdown: DivisionRevenueBreakdown[];
  recentOrders: RecentRevenueOrder[];
};
