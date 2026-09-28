import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CuponesAdmin } from './cupones-admin';

describe('CuponesAdmin', () => {
  let component: CuponesAdmin;
  let fixture: ComponentFixture<CuponesAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuponesAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(CuponesAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
