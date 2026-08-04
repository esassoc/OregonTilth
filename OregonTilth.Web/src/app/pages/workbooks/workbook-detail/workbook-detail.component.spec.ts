import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WorkbookDetailComponent } from './workbook-detail.component';

describe('WorkbookDetailComponent', () => {
  let component: WorkbookDetailComponent;
  let fixture: ComponentFixture<WorkbookDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [WorkbookDetailComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkbookDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
