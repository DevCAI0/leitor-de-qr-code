declare module 'react-qr-scanner' {
    import { Component } from 'react';
  
    export interface QrReaderProps {
      delay?: number | false;
      style?: object;
      onError: (error: Error) => void;
      onScan: (data: { text: string } | null) => void;
      constraints?: MediaStreamConstraints;
      className?: string;
    }
  
    export default class QrReader extends Component<QrReaderProps> {}
  }