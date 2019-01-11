import { TestBed, inject } from '@angular/core/testing';

import { DataModelService } from './data-model.service';

describe('DataModelService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataModelService]
    });
  });

  it('should be created', inject([DataModelService], (service: DataModelService) => {
    expect(service).toBeTruthy();
  }));
});
