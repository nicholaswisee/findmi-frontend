import { type RouteObject } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import HomePage from "../pages/Home/HomePage";
import CatalogPage from "../pages/Catalog/CatalogPage";
import ProductDetailPage from "../pages/Catalog/ProductDetailPage";
import CartPage from "../pages/Cart/CartPage";
import CheckoutPage from "../pages/Checkout/CheckoutPage";
import AuthPage from "../pages/Auth/AuthPage";
import ProfilePage from "../pages/Profile/ProfilePage";
import OrderHistoryPage from "../pages/Profile/OrderHistoryPage";
import NotFound from "./NotFound";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "catalog",
        element: (
          <PublicRoute>
            <CatalogPage />
          </PublicRoute>
        ),
      },
      {
        path: "catalog/:product_id",
        element: (
          <PublicRoute>
            <ProductDetailPage />
          </PublicRoute>
        ),
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
        path: "auth",
        element: (
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        ),
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
];
