import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="v-stack" style={{ padding: 24 }}>
      <h1 className="v-h1">Page not found</h1>
      <div className="v-muted">The route does not exist.</div>
      <div style={{ marginTop: 12 }}>
        <Link className="v-link" to="/app/overview">Go to overview</Link>
      </div>
    </div>
  );
}
