import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/app/router';

export const App = () => (
  <AppProviders>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </AppProviders>
);
