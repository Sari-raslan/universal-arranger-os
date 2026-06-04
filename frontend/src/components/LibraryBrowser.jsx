import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';

export default function LibraryBrowser() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/library/uploads')
      .then((response) => setItems(response.data))
      .catch((err) => setError(err.response?.data?.error || err.message));
  }, []);

  return (
    <div className="libraryBrowser">
      <h2>UAOS Library</h2>
      {error && <p className="error">{error}</p>}
      {items.map((item) => (
        <div key={item.id}>
          {item.filename} ({item.type || 'unknown'})
        </div>
      ))}
      {!items.length && !error && <p className="muted">No uploaded files yet.</p>}
    </div>
  );
}
