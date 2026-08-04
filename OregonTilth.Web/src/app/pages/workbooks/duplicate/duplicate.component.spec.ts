import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DuplicateComponent } from './duplicate.component';

describe('DuplicateComponent', () => {
  let component: DuplicateComponent;
  let fixture: ComponentFixture<DuplicateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [DuplicateComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DuplicateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
