import { Routes } from "@angular/router";
import { Login } from "./pages/login/login";
import { Index } from "./pages/index";
import { authGuard } from "./guards/auth-guard";

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
    path: "**",
    redirectTo: "/",
  },
];
