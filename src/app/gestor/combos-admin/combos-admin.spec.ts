import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CombosAdmin } from './combos-admin';

describe('CombosAdmin', () => {
  let component: CombosAdmin;
  let fixture: ComponentFixture<CombosAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombosAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(CombosAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
