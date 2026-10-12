import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './about.page.html',
  styleUrl: './about.page.scss'
})
export class AboutPage {}