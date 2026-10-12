import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private obs?: IntersectionObserver;

  ngOnInit(): void {
    const host = this.el.nativeElement;
    host.classList.add('reveal');

    this.obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            host.classList.add('visible');
            this.obs?.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 }
    );

    this.obs.observe(host);
  }

  ngOnDestroy(): void {
    this.obs?.disconnect();
  }
}