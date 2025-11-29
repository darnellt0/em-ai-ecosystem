import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h2>404 - Page Not Found</h2>
      <p style={{ color: '#666', marginTop: '1rem' }}>
        Could not find the requested resource
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
        }}
      >
        Return Home
      </Link>
    </div>
  );
}
