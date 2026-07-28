import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TimeStudyModal } from './time-study-modal.component';

describe('TimeStudyModal', () => {
  let component: TimeStudyModal;
  let fixture: ComponentFixture<TimeStudyModal>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TimeStudyModal]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeStudyModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
