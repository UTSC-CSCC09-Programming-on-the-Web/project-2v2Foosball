import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpectatorList } from './spectator-list';

describe('SpectatorList', () => {
  let component: SpectatorList;
  let fixture: ComponentFixture<SpectatorList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpectatorList],
    }).compileComponents();

    fixture = TestBed.createComponent(SpectatorList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
