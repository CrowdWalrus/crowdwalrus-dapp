import { Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { TestPage } from "@/pages/TestPage";
import NewCampaignPage from "@/pages/NewCampaignPage";
import { CampaignPage } from "@/pages/CampaignPage";
import { ROUTES } from "@/shared/config/routes";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.TEST} element={<TestPage />} />
      <Route path={ROUTES.CAMPAIGNS_NEW} element={<NewCampaignPage />} />
      <Route path={ROUTES.CAMPAIGNS_DETAIL} element={<CampaignPage />} />
    </Routes>
  );
}
