import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransplantProductionInputsComponent } from './transplant-production-inputs.component';

describe('TransplantProductionInputsComponent', () => {
  let component: TransplantProductionInputsComponent;
  let fixture: ComponentFixture<TransplantProductionInputsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TransplantProductionInputsComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransplantProductionInputsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
