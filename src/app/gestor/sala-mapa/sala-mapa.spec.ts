import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalaMapa } from './sala-mapa';

describe('SalaMapa', () => {
  let component: SalaMapa;
  let fixture: ComponentFixture<SalaMapa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaMapa],
    }).compileComponents();

    fixture = TestBed.createComponent(SalaMapa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
