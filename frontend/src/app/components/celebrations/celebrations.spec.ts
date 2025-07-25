import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Celebrations } from './celebrations';

describe('Celebrations', () => {
  let component: Celebrations;
  let fixture: ComponentFixture<Celebrations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Celebrations],
    }).compileComponents();

    fixture = TestBed.createComponent(Celebrations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
