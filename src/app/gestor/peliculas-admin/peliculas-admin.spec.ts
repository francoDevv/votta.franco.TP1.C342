import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeliculasAdmin } from './peliculas-admin';

describe('PeliculasAdmin', () => {
  let component: PeliculasAdmin;
  let fixture: ComponentFixture<PeliculasAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeliculasAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(PeliculasAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
