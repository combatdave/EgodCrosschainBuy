import { TestBed } from '@angular/core/testing';

import { JoinDogechainService } from './join-dogechain.service';

describe('JoinDogechainService', () => {
  let service: JoinDogechainService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JoinDogechainService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
