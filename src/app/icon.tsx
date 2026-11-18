import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

const LOGO_DATA_URI = 'data:image/png;base64,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';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <img
          src={LOGO_DATA_URI}
          width="64"
          height="64"
          style={{ objectFit: 'contain' }}
          alt="TaskLynk"
        />
      </div>
    ),
    size
  );
}
