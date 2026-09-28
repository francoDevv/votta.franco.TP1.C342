import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoriasAdmin } from './categorias-admin';

describe('CategoriasAdmin', () => {
  let component: CategoriasAdmin;
  let fixture: ComponentFixture<CategoriasAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriasAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
