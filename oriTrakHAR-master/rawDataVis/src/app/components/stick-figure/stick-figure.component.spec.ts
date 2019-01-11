import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StickFigureComponent } from './stick-figure.component';

describe('StickFigureComponent', () => {
  let component: StickFigureComponent;
  let fixture: ComponentFixture<StickFigureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StickFigureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StickFigureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
