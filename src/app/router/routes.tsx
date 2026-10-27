import { Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { ROUTES } from "@/shared/config/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AboutPage } from "@/pages/AboutPage";
import { ContactPage } from "@/pages/ContactPage";
import { TermsOfServicePage } from "@/pages/TermsOfServicePage";
import { ArchivedFeaturePage } from "@/pages/ArchivedFeaturePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.ABOUT} element={<AboutPage />} />
      <Route path={ROUTES.CONTACT} element={<ContactPage />} />
      <Route path={ROUTES.TERMS} element={<TermsOfServicePage />} />
      {/* Retired platform features (CrowdWalrus has sunset) */}
      <Route path={`${ROUTES.EXPLORE}/*`} element={<ArchivedFeaturePage />} />
      <Route path={`${ROUTES.ADMIN}/*`} element={<ArchivedFeaturePage />} />
      <Route path="/campaigns/*" element={<ArchivedFeaturePage />} />
      <Route path="/profile/*" element={<ArchivedFeaturePage />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
