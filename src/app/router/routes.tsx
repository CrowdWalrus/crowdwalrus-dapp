import { Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { ExplorePage } from "@/pages/ExplorePage";
import { AdminPage } from "@/pages/AdminPage";
import NewCampaignPage from "@/pages/NewCampaignPage";
import { CampaignPage } from "@/pages/CampaignPage";
import EditCampaignPage from "@/pages/EditCampaignPage";
import PostCampaignUpdatePage from "@/pages/PostCampaignUpdatePage";
import CreateProfilePage from "@/pages/CreateProfilePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ROUTES } from "@/shared/config/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AboutPage } from "@/pages/AboutPage";
import { ContactPage } from "@/pages/ContactPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.ABOUT} element={<AboutPage />} />
      <Route path={ROUTES.CONTACT} element={<ContactPage />} />
      <Route path={ROUTES.EXPLORE} element={<ExplorePage />} />
      <Route path={ROUTES.ADMIN} element={<AdminPage />} />
      <Route path={ROUTES.CAMPAIGNS_NEW} element={<NewCampaignPage />} />
      <Route path={ROUTES.CAMPAIGNS_EDIT} element={<EditCampaignPage />} />
      <Route path={ROUTES.CAMPAIGNS_DETAIL} element={<CampaignPage />} />
      <Route
        path={ROUTES.CAMPAIGNS_ADD_UPDATE}
        element={<PostCampaignUpdatePage />}
      />
      <Route path={ROUTES.PROFILE_CREATE} element={<CreateProfilePage />} />
      <Route path={ROUTES.PROFILE_DETAIL} element={<ProfilePage />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
