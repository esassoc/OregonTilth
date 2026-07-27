import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LaborHoursComponent } from './labor-hours.component';

describe('LaborHoursComponent', () => {
  let component: LaborHoursComponent;
  let fixture: ComponentFixture<LaborHoursComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [LaborHoursComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LaborHoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
