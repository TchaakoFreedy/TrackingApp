
import { HttpInterceptorFn } from '@angular/common/http';

const API_BASE_URL =
  'https://trackingapp-production-b577.up.railway.app';

export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api/')) {
    const apiRequest = req.clone({
      url: `${API_BASE_URL}${req.url}`
    });

    return next(apiRequest);
  }

  return next(req);
};
