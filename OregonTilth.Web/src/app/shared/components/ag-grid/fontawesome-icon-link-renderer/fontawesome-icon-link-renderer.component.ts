import { Component, OnInit } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'fresca-fontawesome-icon-link-renderer',
    templateUrl: './fontawesome-icon-link-renderer.component.html',
    styleUrls: ['./fontawesome-icon-link-renderer.component.scss'],
    standalone: true,
    imports: [NgIf, RouterLink]
})
export class FontAwesomeIconLinkRendererComponent implements AgRendererComponent {
  params: any;    

  agInit(params: any): void {
    if(params.value === null)
    {
      params = { value: "" }
    }
    else
    {
      this.params = params;
    }
  }

  refresh(params: any): boolean {
      return false;
  }    
}