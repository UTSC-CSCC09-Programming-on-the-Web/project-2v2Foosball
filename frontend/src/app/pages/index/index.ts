import { Component } from "@angular/core";
import { Header } from "../../components/header/header";
import { AuthService } from "../../services/auth";
import { User } from "../../types/user";

@Component({
  selector: "app-index",
  imports: [Header],
  templateUrl: "./index.html",
  styleUrl: "./index.scss",
})
export class Index {
  user!: User;

  constructor(private authService: AuthService) {
    this.authService.getUser().subscribe((user) => {
      this.user = user!;
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
