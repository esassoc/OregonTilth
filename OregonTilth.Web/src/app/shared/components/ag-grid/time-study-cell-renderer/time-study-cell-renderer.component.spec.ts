import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TimeStudyCellRendererComponent } from './time-study-cell-renderer.component';

describe('TimeStudyCellRendererComponent', () => {
  let component: TimeStudyCellRendererComponent;
  let fixture: ComponentFixture<TimeStudyCellRendererComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TimeStudyCellRendererComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeStudyCellRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
