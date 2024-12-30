// QrReaderWrapper.tsx
import QrReader from 'react-qr-scanner';
import { CSSProperties } from 'react';

interface QrReaderWrapperProps {
  delay?: number;
  onError: (error: Error) => void;
  onScan: (data: { text: string } | null) => void;
  style?: CSSProperties;
  className?: string;
  constraints?: MediaStreamConstraints;
}

const QrReaderWrapper = ({
  delay = 300,
  onError,
  onScan,
  style,
  className,
  constraints
}: QrReaderWrapperProps) => {
  return (
    <QrReader
      delay={delay}
      onError={onError}
      onScan={onScan}
      style={style}
      className={className}
      constraints={constraints}
    />
  );
};

export default QrReaderWrapper;