import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreciosAdmin } from './precios-admin';

describe('PreciosAdmin', () => {
  let component: PreciosAdmin;
  let fixture: ComponentFixture<PreciosAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreciosAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(PreciosAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
