import { InjectionToken } from '@angular/core';

/** Endereço base da API. Único lugar onde a URL é definida. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:5215',
});
