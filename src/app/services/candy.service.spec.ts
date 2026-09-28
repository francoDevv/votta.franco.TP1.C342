import { TestBed } from '@angular/core/testing';
import { CandyService } from './candy.service';

describe('CandyService', () => {
  let service: CandyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CandyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
