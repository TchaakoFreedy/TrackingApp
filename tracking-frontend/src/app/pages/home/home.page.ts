import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../core/directives/reveal.directive';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {}