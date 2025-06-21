import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { environment } from "../../environments/environment";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // Redirect to backend for login with GitHub
  login(provider: "github"): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe(() => {
        this.router.navigate(["/login"]);
      });
  }

  getUser(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/me`, {
      withCredentials: true,
    });
  }
}
