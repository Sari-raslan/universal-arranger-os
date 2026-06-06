import React, { useEffect, useState } from 'react';
import { checkUaosBackend } from '../services/uaosApi';

export default function PublicRuntimeStatus() {
  const [status, setStatus] = useState({
    checking: true,
    online: false,
    message: 'Checking UAOS runtime...'
  });

  useEffect(() => {
    let alive = true;

    checkUaosBackend().then((result) => {
      if (!alive) return;

      if (result.ok) {
        setStatus({
          checking: false,
          online: true,
          message: 'UAOS backend online'
        });
      } else {
        setStatus({
          checking: false,
          online: false,
          message:
            'Public demo mode: backend is not connected on this website. Desktop/local runtime enables uploads, parsing, OMR, live audio, and sound library.'
        });
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div
      className={`publicRuntimeStatus ${status.online ? 'online' : 'demo'}`}
      role="status"
      aria-live={status.checking ? 'polite' : 'off'}
    >
      <strong>{status.online ? 'Online' : 'Demo Mode'}</strong>
      <div>{status.message}</div>
    </div>
  );
}
