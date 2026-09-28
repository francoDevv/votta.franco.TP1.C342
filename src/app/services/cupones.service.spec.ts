import { TestBed } from '@angular/core/testing';
import { CuponesService } from './cupones.service';

describe('CuponesService', () => {
  let service: CuponesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CuponesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
