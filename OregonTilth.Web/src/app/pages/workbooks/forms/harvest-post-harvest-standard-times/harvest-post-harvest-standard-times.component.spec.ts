import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HarvestPostHarvestStandardTimesComponent } from './harvest-post-harvest-standard-times.component';

describe('HarvestPostHarvestStandardTimesComponent', () => {
  let component: HarvestPostHarvestStandardTimesComponent;
  let fixture: ComponentFixture<HarvestPostHarvestStandardTimesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [HarvestPostHarvestStandardTimesComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HarvestPostHarvestStandardTimesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
