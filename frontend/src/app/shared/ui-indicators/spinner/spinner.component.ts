import { AfterViewInit, Component, ElementRef, Input, OnChanges, Renderer2, SimpleChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css'
})
export class SpinnerComponent implements OnChanges, AfterViewInit{
  @ViewChild('spinnerRef') spinnerRef!: ElementRef;
  @Input('size') size: string;
  @Input('border-width') borderWidth: string;
  @Input('color') color: string;

  constructor(
    private renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.spinnerRef) this.renderer.setStyle(this.spinnerRef.nativeElement, 'width', `${this.size}`);
    if (this.spinnerRef) this.renderer.setStyle(this.spinnerRef.nativeElement, 'height', `${this.size}`);
    if (this.spinnerRef) this.renderer.setStyle(this.spinnerRef.nativeElement, 'border', `${this.borderWidth} solid ${this.color}`);
    if (this.spinnerRef) this.renderer.setStyle(this.spinnerRef.nativeElement, 'border-top-color', `transparent`);
 
  }

  ngAfterViewInit(): void {
    this.renderer.setStyle(this.spinnerRef.nativeElement, 'width', `${this.size}`);
    this.renderer.setStyle(this.spinnerRef.nativeElement, 'height', `${this.size}`);
    this.renderer.setStyle(this.spinnerRef.nativeElement, 'border', `${this.borderWidth} solid ${this.color}`);
    this.renderer.setStyle(this.spinnerRef.nativeElement, 'border-top-color', `transparent`);
  }

}
