import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FieldLaborByCropComponent } from './field-labor-by-crop.component';

describe('FieldLaborByCropComponent', () => {
  let component: FieldLaborByCropComponent;
  let fixture: ComponentFixture<FieldLaborByCropComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [FieldLaborByCropComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldLaborByCropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
