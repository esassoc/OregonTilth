import { Component, NgZone, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgRendererComponent } from 'ag-grid-angular';
import { NgIf } from '@angular/common';

@Component({
    selector: 'fresca-link-renderer',
    templateUrl: './link-renderer.component.html',
    styleUrls: ['./link-renderer.component.scss'],
    standalone: true,
    imports: [NgIf, RouterLink]
})

export class LinkRendererComponent implements AgRendererComponent {
  params: any;    
  
  constructor(
    private ngZone: NgZone,
    private router: Router) { }
    
  agInit(params: any): void {
    if(params.value === null)
    {
      params = { value: { LinkDisplay: "", LinkValue: ""}, inRouterLink: ""}
    }
    else
    {
      this.params = params;
    }
  }

  refresh(params: any): boolean {
      return false;
  }    
  
  navigate(link) {
    this.ngZone.run(() => {
        this.router.navigate([link, this.params.value.LinkValue]);
    });
  }
}