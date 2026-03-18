import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <section className="not-found">
    <p className="eyebrow">404</p>
    <h2>That trail does not exist.</h2>
    <p>The page you asked for wandered off the route.</p>
    <Link className="primary-button" to="/">
      Return home
    </Link>
  </section>
);
