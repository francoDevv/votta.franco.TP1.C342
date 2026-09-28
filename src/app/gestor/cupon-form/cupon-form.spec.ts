import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CuponForm } from './cupon-form';

describe('CuponForm', () => {
  let component: CuponForm;
  let fixture: ComponentFixture<CuponForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuponForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CuponForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
