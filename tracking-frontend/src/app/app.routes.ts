import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about.page').then((m) => m.AboutPage)
  },
  {
    path: 'services',
    loadComponent: () =>
      import('./pages/services/services.page').then((m) => m.ServicesPage)
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact.page').then((m) => m.ContactPage)
  },
  {
    path: 'track',
    loadComponent: () =>
      import('./pages/track/track.page').then((m) => m.TrackPage)
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./pages/admin/admin-login.page').then((m) => m.AdminLoginPage)
  },
  {
    path: 'admin/colis',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin-dashboard.page').then(
        (m) => m.AdminDashboardPage
      )
  },
  {
  path: 'admin/profile',
  loadComponent: () =>
    import('./pages/profile/profile.page').then(m => m.ProfilePage)
},
{
  path: 'admin/users',
  loadComponent: () =>
    import('./pages/admin-users/admin-users.page').then(m => m.AdminUsersPage)
},
  {
    path: 'admin/colis/nouveau',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin-colis-form.page').then(
        (m) => m.AdminColisFormPage
      )
  },
  {
    path: 'admin/colis/:id',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin-colis-form.page').then(
        (m) => m.AdminColisFormPage
      )
  },
  // ⬇️ NOUVELLE ROUTE
  {
    path: 'admin/messages',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin-messages.page').then(
        (m) => m.AdminMessagesPage
      )
  },
  { path: '**', redirectTo: '' }
];