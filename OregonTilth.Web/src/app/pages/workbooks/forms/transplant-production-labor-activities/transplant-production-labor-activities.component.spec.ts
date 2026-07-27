import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransplantProductionLaborActivitiesComponent } from './transplant-production-labor-activities.component';

describe('TransplantProductionLaborActivitiesComponent', () => {
  let component: TransplantProductionLaborActivitiesComponent;
  let fixture: ComponentFixture<TransplantProductionLaborActivitiesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TransplantProductionLaborActivitiesComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransplantProductionLaborActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
