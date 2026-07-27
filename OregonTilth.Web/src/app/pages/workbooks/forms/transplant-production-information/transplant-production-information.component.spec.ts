import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransplantProductionInformationComponent } from './transplant-production-information.component';

describe('TransplantProductionInformationComponent', () => {
  let component: TransplantProductionInformationComponent;
  let fixture: ComponentFixture<TransplantProductionInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TransplantProductionInformationComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransplantProductionInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
