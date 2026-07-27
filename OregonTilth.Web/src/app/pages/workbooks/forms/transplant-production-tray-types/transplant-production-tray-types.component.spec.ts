import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TransplantProductionTrayTypesComponent } from './transplant-production-tray-types.component';

describe('TransplantProductionTrayTypesComponent', () => {
  let component: TransplantProductionTrayTypesComponent;
  let fixture: ComponentFixture<TransplantProductionTrayTypesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TransplantProductionTrayTypesComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransplantProductionTrayTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
