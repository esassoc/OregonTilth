import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransplantProductionInputCostsComponent } from './transplant-production-input-costs.component';

describe('TransplantProductionInputCostsComponent', () => {
  let component: TransplantProductionInputCostsComponent;
  let fixture: ComponentFixture<TransplantProductionInputCostsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TransplantProductionInputCostsComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransplantProductionInputCostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
