import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RightLegendComponent } from './right-legend.component';

describe('RightLegendComponent', () => {
  let component: RightLegendComponent;
  let fixture: ComponentFixture<RightLegendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RightLegendComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RightLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
