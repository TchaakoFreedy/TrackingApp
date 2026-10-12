import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './services.page.html',
  styleUrl: './services.page.scss'
})
export class ServicesPage {}