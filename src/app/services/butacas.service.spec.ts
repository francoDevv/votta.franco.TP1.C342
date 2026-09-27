import { TestBed } from '@angular/core/testing';
import { ButacasService } from './butacas.service';

describe('ButacasService', () => {
  let service: ButacasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ButacasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
