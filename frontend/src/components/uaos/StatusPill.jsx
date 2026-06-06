import React from 'react';

export default function StatusPill({ online, label }) {
  return (
    <span className={online ? 'uaos-pill online' : 'uaos-pill offline'}>
      <span className="uaos-pill-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
