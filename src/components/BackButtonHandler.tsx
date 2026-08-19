import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";

// Primary entry/dashboard pages where pressing back should exit or minimize the app
const ROOT_PATHS = [
  "/",
  "/login",
  "/dashboard",
  "/admin",
  "/org-admin",
  "/canteen-owner",
];

export const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let handler: any;

    const setupBackButton = async () => {
      try {
        handler = await CapApp.addListener("backButton", () => {
          const currentPath = window.location.pathname;
          const isRoot = ROOT_PATHS.includes(currentPath);

          if (!isRoot) {
            // Step back to the previous screen in navigation history
            navigate(-1);
          } else {
            // On top-level root pages, exit/minimize the app
            CapApp.exitApp();
          }
        });
      } catch (err) {
        // Fallback for pure web browser environment
      }
    };

    setupBackButton();

    return () => {
      if (handler && typeof handler.remove === "function") {
        handler.remove();
      }
    };
  }, [navigate, location]);

  return null;
};

export default BackButtonHandler;
