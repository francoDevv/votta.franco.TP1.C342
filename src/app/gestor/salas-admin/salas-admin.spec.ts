import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalasAdmin } from './salas-admin';

describe('SalasAdmin', () => {
  let component: SalasAdmin;
  let fixture: ComponentFixture<SalasAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalasAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(SalasAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
