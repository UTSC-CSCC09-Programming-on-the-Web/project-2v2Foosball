import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Replay } from './replay';

describe('Replay', () => {
  let component: Replay;
  let fixture: ComponentFixture<Replay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Replay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Replay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
