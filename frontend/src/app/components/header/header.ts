import { Component, EventEmitter, Input, Output } from "@angular/core";
import { User } from "../../types/user";

@Component({
  selector: "app-header",
  imports: [],
  templateUrl: "./header.html",
  styleUrl: "./header.scss",
})
export class Header {
  constructor() {}

  @Input() user!: User;
  @Output() logout = new EventEmitter<void>();

  onLogout(): void {
    this.logout.emit();
  }
}
