import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dot-loader',
  templateUrl: './dot-loader.component.html',
  styleUrl: './dot-loader.component.css'
})
export class DotLoaderComponent {
  @Input() color: string = 'white'; 
  @Input() size: number = 10; 
}
