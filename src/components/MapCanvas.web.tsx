import React from 'react';

export default function MapCanvas({ html }: { html: string }) {
  return <iframe title="여행지 지도" srcDoc={html} style={{ border: 0, width: '100%', flex: 1, minHeight: 320 }} />;
}
