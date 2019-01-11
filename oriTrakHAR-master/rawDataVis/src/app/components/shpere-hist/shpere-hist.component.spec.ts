import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShpereHistComponent } from './shpere-hist.component';

describe('ShpereHistComponent', () => {
  let component: ShpereHistComponent;
  let fixture: ComponentFixture<ShpereHistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShpereHistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShpereHistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
