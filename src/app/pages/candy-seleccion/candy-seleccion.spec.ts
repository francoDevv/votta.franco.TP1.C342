import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CandySeleccion } from './candy-seleccion';

describe('CandySeleccion', () => {
  let component: CandySeleccion;
  let fixture: ComponentFixture<CandySeleccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandySeleccion],
    }).compileComponents();

    fixture = TestBed.createComponent(CandySeleccion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
