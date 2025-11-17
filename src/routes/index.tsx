import { type RouteObject } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import PrivateRoute from "./PrivateRoute";
import HomePage from "../pages/Home/HomePage";
import CatalogPage from "../pages/Catalog/CatalogPage";
import ProductDetailPage from "../pages/Catalog/ProductDetailPage";
import CartPage from "../pages/Cart/CartPage";
import CheckoutPage from "../pages/Checkout/CheckoutPage";
import AuthPage from "../pages/Auth/AuthPage";
import ProfilePage from "../pages/Profile/ProfilePage";
import OrderHistoryPage from "../pages/Profile/OrderHistoryPage";
import NotFound from "./NotFound";
import AdminPage from "@/pages/Admin/AdminPage";
import AdminRoute from "./AdminRoute";
import OrdersAdmin from "@/pages/Admin/OrdersAdmin";
import BundlesAdmin from "@/pages/Admin/BundlesAdmin";
import ProductsAdmin from "@/pages/Admin/ProductsAdmin";
import UsersAdmin from "@/pages/Admin/UsersAdmin";
import AdminLayout from "@/layouts/AdminLayout";
import DummyPaymentPage from "@/pages/Payment/DummyPaymentPage";

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
      {
        path: "payment/dummy",
        element: (
          <PrivateRoute>
            <DummyPaymentPage />
          </PrivateRoute>
        ),
      },
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
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: (
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        ),
      },
      {
        path: "users",
        element: (
          <AdminRoute>
            <UsersAdmin />
          </AdminRoute>
        ),
      },
      {
        path: "products",
        element: (
          <AdminRoute>
            <ProductsAdmin />
          </AdminRoute>
        ),
      },
      {
        path: "bundles",
        element: (
          <AdminRoute>
            <BundlesAdmin />
          </AdminRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <AdminRoute>
            <OrdersAdmin />
          </AdminRoute>
        ),
      },
    ],
  },
];
