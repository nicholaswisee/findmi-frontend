import { Suspense, lazy, type ReactElement } from "react";
import { type RouteObject } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import PrivateRoute from "./PrivateRoute";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/Home/HomePage";
import CatalogPage from "../pages/Catalog/CatalogPage";
import CollabPage from "../pages/Collab/CollabPage";
import ProductDetailPage from "../pages/Catalog/ProductDetailPage";
import CartPage from "../pages/Cart/CartPage";
import CheckoutPage from "../pages/Checkout/CheckoutPage";
// Legacy payment pages kept for reference (currently not routed)
import AuthPage from "../pages/Auth/AuthPage";
import ProfilePage from "../pages/Profile/ProfilePage";
import OrderHistoryPage from "../pages/Profile/OrderHistoryPage";
import NotFound from "./NotFound";
import RouteFallback from "./RouteFallback";

const AdminLayout = lazy(() => import("@/layouts/AdminLayout"));
const AdminPage = lazy(() => import("@/pages/Admin/AdminPage"));
const UsersAdmin = lazy(() => import("@/pages/Admin/UsersAdmin"));
const ProductsAdmin = lazy(() => import("@/pages/Admin/ProductsAdmin"));
const BundlesAdmin = lazy(() => import("@/pages/Admin/BundlesAdmin"));
const OrdersAdmin = lazy(() => import("@/pages/Admin/OrdersAdmin"));
const ManualPaymentsAdmin = lazy(
  () => import("@/pages/Admin/ManualPaymentsAdmin")
);

const withSuspense = (element: ReactElement) => (
  <Suspense fallback={<RouteFallback />}>{element}</Suspense>
);

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "catalog",
        element: <CatalogPage />,
      },
      {
        path: "collab",
        element: <CollabPage />,
      },
      {
        path: "catalog/:product_id",
        element: <ProductDetailPage />,
      },
      {
        path: "catalog/bundle/:bundle_id",
        element: <ProductDetailPage />,
      },
      {
        path: "cart",
        element: (
          <PrivateRoute>
            <CartPage />
          </PrivateRoute>
        ),
      },
      {
        path: "checkout",
        element: (
          <PrivateRoute>
            <CheckoutPage />
          </PrivateRoute>
        ),
      },
      // Manual/dummy payment pages are handled inside the Checkout page now.
      {
        path: "login",
        element: <AuthPage />,
      },
      {
        path: "profile",
        element: (
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        ),
      },
      {
        path: "profile/history",
        element: (
          <PrivateRoute>
            <OrderHistoryPage />
          </PrivateRoute>
        ),
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: withSuspense(<AdminLayout />),
    children: [
      {
        index: true,
        element: withSuspense(
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        ),
      },
      {
        path: "users",
        element: withSuspense(
          <AdminRoute>
            <UsersAdmin />
          </AdminRoute>
        ),
      },
      {
        path: "products",
        element: withSuspense(
          <AdminRoute>
            <ProductsAdmin />
          </AdminRoute>
        ),
      },
      {
        path: "bundles",
        element: withSuspense(
          <AdminRoute>
            <BundlesAdmin />
          </AdminRoute>
        ),
      },
      {
        path: "orders",
        element: withSuspense(
          <AdminRoute>
            <OrdersAdmin />
          </AdminRoute>
        ),
      },
      {
        path: "manual-payments",
        element: withSuspense(
          <AdminRoute>
            <ManualPaymentsAdmin />
          </AdminRoute>
        ),
      },
    ],
  },
];
