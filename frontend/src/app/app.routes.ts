import { Routes } from "@angular/router";
import { Login } from "./pages/login/login";
import { Index } from "./pages/index";
import { authGuard } from "./guards/auth-guard";
import { Membership } from "./pages/membership/membership";

export const routes: Routes = [
  {
    path: "",
    component: Index,
    canActivate: [authGuard],
  },
  {
    path: "login",
    component: Login,
  },
  {
    path: "membership",
    component: Membership,
  },
  {
    path: "**",
    redirectTo: "/",
  },
];
