import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FieldStandardTimesComponent } from './field-standard-times.component';

describe('FieldStandardTimesComponent', () => {
  let component: FieldStandardTimesComponent;
  let fixture: ComponentFixture<FieldStandardTimesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [FieldStandardTimesComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldStandardTimesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
