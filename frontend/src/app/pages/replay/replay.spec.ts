import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplayPage } from './replay';

describe('Replay', () => {
  let component: ReplayPage;
  let fixture: ComponentFixture<ReplayPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplayPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ReplayPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
