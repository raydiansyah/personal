/**
 * Module: TanStack route registry
 * Purpose: Compose the public route tree and mount the application providers
 * Used by: src/main.tsx and index.html
 * Dependencies: TanStack Router/Query, page modules, shared CSS
 * Public functions: AppRouter()
 * Side effects: Mounts the browser router and query cache
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';
import { SiteShell } from './components/site-shell';
import { AboutPage } from './pages/about-page';
import { AdminApp } from './admin';
import { ContactPage } from './pages/contact-page';
import { HomePage } from './pages/home-page';
import { PortfolioDetailPage, PortfolioPage } from './pages/portfolio-pages';
import { ServicesPage } from './pages/services-page';
import { SlidePage } from './pages/slide-page';
import './app.css';
import '../styles.css';
import '../a11y.css';
import '../motion.css';
import '../portfolio.css';
import '../conversion.css';
import '../promotions.css';
import './shell.css';
import './theme.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });
const rootRoute = createRootRoute({ component: SiteShell });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage });
const portfolioRoute = createRoute({ getParentRoute: () => rootRoute, path: '/portfolio', component: PortfolioPage });
const portfolioDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/portfolio/$slug', component: PortfolioDetailPage });
const servicesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/services', component: ServicesPage });
const contactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/contact', component: ContactPage });
const slideRoute = createRoute({ getParentRoute: () => rootRoute, path: '/s/$slug', component: SlidePage });
const authLoginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/login', component: AdminApp });
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminApp });
const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, portfolioRoute, portfolioDetailRoute, servicesRoute, contactRoute, slideRoute, authLoginRoute, adminRoute]);
export const router = createRouter({ routeTree, context: { queryClient }, defaultPreload: 'intent', scrollRestoration: true });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
export function AppRouter() { return <QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>; }
const root = document.getElementById('root');
if (root) createRoot(root).render(<AppRouter />);
