import { TestBed } from '@angular/core/testing';
import { MiServicio } from './mi-servicio';

describe('MiServicio', () => {
  let service: MiServicio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MiServicio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
