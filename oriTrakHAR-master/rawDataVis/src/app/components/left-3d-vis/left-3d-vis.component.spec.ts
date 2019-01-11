import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Left3dVisComponent } from './left-3d-vis.component';

describe('Left3dVisComponent', () => {
  let component: Left3dVisComponent;
  let fixture: ComponentFixture<Left3dVisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Left3dVisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Left3dVisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
