export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  EXPLORE: "/explore",
  ADMIN: "/admin",
  CAMPAIGNS_NEW: "/campaigns/new",
  CAMPAIGNS_DETAIL: "/campaigns/:id",
  CAMPAIGNS_EDIT: "/campaigns/:id/edit",
  CAMPAIGNS_ADD_UPDATE: "/campaigns/:id/add-update",
  PROFILE_CREATE: "/profile/create",
  PROFILE_DETAIL: "/profile/:address",
  NOT_FOUND: "/404",
} as const;
