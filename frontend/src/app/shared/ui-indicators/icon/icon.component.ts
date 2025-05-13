import { Component, Input, OnInit, Renderer2, ElementRef, SimpleChanges, OnChanges } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: `<div id='icon-container'></div>`,
  styles: [`
    div {
      width: 100%;
      height: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class IconComponent implements OnInit, OnChanges {
  @Input() src!: string;  // Putanja do SVG fajla
  @Input() color: string; // Boja ikonice

  constructor(
    private renderer: Renderer2,
    public _el: ElementRef) {}

  ngOnInit(): void {
    this.loadSvgIcon();
  }

  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['color'] && changes['color'].previousValue !== undefined) {
      let containerInnerHtml = this._el.nativeElement.querySelector('#icon-container').innerHTML;
      const escapedPreviousValue = this.escapeRegExp(changes['color'].previousValue);
      containerInnerHtml = containerInnerHtml.replace(new RegExp(escapedPreviousValue, 'g'), changes['color'].currentValue);
      this._el.nativeElement.querySelector('#icon-container').innerHTML = containerInnerHtml;
    }
  }

  private loadSvgIcon(): void {
    fetch(this.src)
      .then(response => response.text())
      .then(svgContent => {
        const svgElement = this.renderer.createElement('div');
        svgContent = svgContent.replace(new RegExp('~color~', 'g'), this.color)
        svgElement.innerHTML = svgContent;

        const svg = svgElement.querySelector('svg');
        if (svg) {
          this.renderer.setAttribute(svg, 'width', '100%');
          this.renderer.setAttribute(svg, 'height', '100%');
          this._el.nativeElement.querySelector('#icon-container').appendChild(svg);
        }
      })
      .catch(error => console.error('Error loading SVG (icon.component):', error));
  }

}