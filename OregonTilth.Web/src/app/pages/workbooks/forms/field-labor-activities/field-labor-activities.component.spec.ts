import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FieldLaborActivitiesComponent } from './field-labor-activities.component';

describe('FieldLaborActivitiesComponent', () => {
  let component: FieldLaborActivitiesComponent;
  let fixture: ComponentFixture<FieldLaborActivitiesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [FieldLaborActivitiesComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldLaborActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
