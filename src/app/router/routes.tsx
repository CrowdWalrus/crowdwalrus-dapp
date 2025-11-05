import { Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { ExplorePage } from "@/pages/ExplorePage";
import { AdminPage } from "@/pages/AdminPage";
import NewCampaignPage from "@/pages/NewCampaignPage";
import { CampaignPage } from "@/pages/CampaignPage";
import EditCampaignPage from "@/pages/EditCampaignPage";
import PostCampaignUpdatePage from "@/pages/PostCampaignUpdatePage";
import ProfileCreatePage from "@/pages/ProfileCreatePage";
import { ROUTES } from "@/shared/config/routes";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.EXPLORE} element={<ExplorePage />} />
      <Route path={ROUTES.ADMIN} element={<AdminPage />} />
      <Route path={ROUTES.CAMPAIGNS_NEW} element={<NewCampaignPage />} />
      <Route path={ROUTES.CAMPAIGNS_EDIT} element={<EditCampaignPage />} />
      <Route path={ROUTES.CAMPAIGNS_DETAIL} element={<CampaignPage />} />
      <Route
        path={ROUTES.CAMPAIGNS_ADD_UPDATE}
        element={<PostCampaignUpdatePage />}
      />
      <Route path={ROUTES.PROFILE_CREATE} element={<ProfileCreatePage />} />
    </Routes>
  );
}
