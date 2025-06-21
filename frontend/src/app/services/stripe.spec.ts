import { TestBed } from "@angular/core/testing";

import { StripeService } from "./stripe";

describe("Stripe", () => {
  let service: StripeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StripeService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
