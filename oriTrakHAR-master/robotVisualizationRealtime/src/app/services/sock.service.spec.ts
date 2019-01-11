import { TestBed, inject } from '@angular/core/testing';

import { SockService } from './sock.service';

describe('SockService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SockService]
    });
  });

  it('should be created', inject([SockService], (service: SockService) => {
    expect(service).toBeTruthy();
  }));
});
