import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerRodComponent } from './player-rod';

describe('PlayerRodComponent', () => {
  let component: PlayerRodComponent;
  let fixture: ComponentFixture<PlayerRodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerRodComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerRodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
