import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MiComponente } from './mi-componente';

describe('MiComponente', () => {
  let component: MiComponente;
  let fixture: ComponentFixture<MiComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiComponente],
    }).compileComponents();

    fixture = TestBed.createComponent(MiComponente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
