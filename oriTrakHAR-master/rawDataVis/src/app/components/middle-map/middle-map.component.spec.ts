import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MiddleMapComponent } from './middle-map.component';

describe('MiddleMapComponent', () => {
  let component: MiddleMapComponent;
  let fixture: ComponentFixture<MiddleMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MiddleMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MiddleMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
