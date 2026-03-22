import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Angular HTTP interceptor that attaches JWT Bearer token to all outgoing requests.
 * Reads token from localStorage on each request.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('auth_token');

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    return next(req);
};
