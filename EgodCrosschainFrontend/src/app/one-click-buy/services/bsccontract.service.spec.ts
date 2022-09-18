import { TestBed } from '@angular/core/testing';

import { BSCContractService } from './bsccontract.service';

describe('BSCContractService', () => {
  let service: BSCContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BSCContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
