import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomTimeLineComponent } from './bottom-time-line.component';

describe('BottomTimeLineComponent', () => {
  let component: BottomTimeLineComponent;
  let fixture: ComponentFixture<BottomTimeLineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BottomTimeLineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BottomTimeLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
