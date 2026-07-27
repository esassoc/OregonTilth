import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransplantProductionStandardTimesComponent } from './transplant-production-standard-times.component';

describe('TransplantProductionStandardTimesComponent', () => {
  let component: TransplantProductionStandardTimesComponent;
  let fixture: ComponentFixture<TransplantProductionStandardTimesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TransplantProductionStandardTimesComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransplantProductionStandardTimesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
