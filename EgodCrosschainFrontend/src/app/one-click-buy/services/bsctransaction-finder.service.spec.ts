import { TestBed } from '@angular/core/testing';

import { BSCTransactionFinderService } from './bsctransaction-finder.service';

describe('BSCTransactionFinderService', () => {
  let service: BSCTransactionFinderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BSCTransactionFinderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
