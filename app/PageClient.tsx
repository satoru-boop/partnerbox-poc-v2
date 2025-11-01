'use client';

import React, { useState } from 'react';

type Role = 'founder' | 'investor' | 'admin';

export default function PageClient() {
  const [role, setRole] = useState<Role>('founder');

  return (
    <div>
      <h1>Partner Box — 役割を選択</h1>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <button onClick={() => setRole('founder')}>起業家</button>
        <button onClick={() => setRole('investor')}>投資家</button>
        <button onClick={() => setRole('admin')}>運営</button>
      </div>
      <p style={{ marginTop: '20px' }}>現在の選択: {role}</p>
    </div>
  );
}
