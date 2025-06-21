import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StripeService } from "../../services/stripe";
import { AuthService } from "../../services/auth";
import { Router } from "@angular/router";

@Component({
  selector: "app-membership",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./membership.html",
  styleUrls: ["./membership.scss"],
})
export class Membership {
  isLoading = false;
  selectedPlan: "monthly" | "yearly" | null = null;

  constructor(
    private subscriptionService: StripeService,
    private authService: AuthService,
    private router: Router,
  ) {}

  selectMonthlyPlan(): void {
    this.selectedPlan = "monthly";
    this.isLoading = true;

    this.subscriptionService.redirectToCheckout("monthly_plan");
  }

  selectYearlyPlan(): void {
    this.selectedPlan = "yearly";
    this.isLoading = true;

    this.subscriptionService.redirectToCheckout("yearly_plan");
  }

  goBack(): void {
    this.router.navigate(["/"]);
  }

  logout(): void {
    this.authService.logout();
  }
}
