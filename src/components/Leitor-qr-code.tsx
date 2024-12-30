import { useState, useCallback, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Image, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const qrConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1,
  showTorchButtonIfSupported: true,
  videoConstraints: {
    width: { min: 640, ideal: 1080, max: 1920 },
    height: { min: 480, ideal: 1080, max: 1080 }
  }
};

const QRCodeReader = () => {
  const [result, setResult] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Adiciona estilos CSS necessários para exibir o vídeo corretamente
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      #qr-reader video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        border-radius: 0.5rem !important;
      }
      #qr-reader {
        width: 100% !important;
        border: none !important;
        padding: 0 !important;
      }
      #qr-reader__scan_region {
        min-height: unset !important;
      }
      #qr-reader__dashboard {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("qr-reader");

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
    setResult(decodedText);
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }, []);

  const startScanning = async () => {
    if (!scannerRef.current) {
      setErrorMessage('Aguarde a inicialização do scanner...');
      return;
    }

    try {
      const config = {
        ...qrConfig,
        videoConstraints: {
          ...qrConfig.videoConstraints,
          facingMode: isFrontCamera ? 'user' : { exact: 'environment' }
        }
      };

      await scannerRef.current.start(
        { facingMode: isFrontCamera ? 'user' : { exact: 'environment' } },
        config,
        handleScanSuccess,
        () => {} // Ignore errors durante o scanning
      );
      setIsScanning(true);
      setErrorMessage(null);
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err);
      // Se falhar com 'exact: environment', tenta sem exact
      if (!isFrontCamera) {
        try {
          const fallbackConfig = {
            ...qrConfig,
            videoConstraints: {
              ...qrConfig.videoConstraints,
              facingMode: 'environment'
            }
          };
          await scannerRef.current?.start(
            { facingMode: 'environment' },
            fallbackConfig,
            handleScanSuccess,
            () => {}
          );
          setIsScanning(true);
          setErrorMessage(null);
          return;
        } catch (fallbackErr) {
          console.error('Erro ao tentar fallback:', fallbackErr);
        }
      }
      setErrorMessage('Erro ao acessar a câmera. Verifique as permissões.');
    }
  };

  const stopScanning = async () => {
    if (!scannerRef.current) return;

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
      setIsScanning(false);
    } catch (err) {
      console.error('Erro ao parar scanner:', err);
    }
  };

  const handleCameraSwitch = async (checked: boolean) => {
    try {
      await stopScanning();
      setIsFrontCamera(checked);
      if (isScanning) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await startScanning();
      }
    } catch (err) {
      console.error('Erro ao trocar câmera:', err);
      setErrorMessage('Erro ao trocar de câmera. Tente novamente.');
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    try {
      setErrorMessage('Processando imagem...');
      const result = await scannerRef.current.scanFile(file, true);
      setResult(result);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage('Erro ao processar imagem. Tente novamente.');
    }
  };

  const resetScanner = async () => {
    await stopScanning();
    setResult('');
    setErrorMessage(null);
  };

  const toggleScanner = async () => {
    try {
      if (isScanning) {
        await stopScanning();
      } else {
        await startScanning();
      }
    } catch (err) {
      console.error('Erro ao alternar scanner:', err);
      setErrorMessage('Erro ao alternar o scanner. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="flex justify-between items-center p-4 safe-area-top">
        <Button 
          variant="ghost" 
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={resetScanner}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Camera Switch */}
        <div className="flex items-center gap-2">
          <Label htmlFor="camera-switch" className="text-white text-sm">
            {isFrontCamera ? 'Câmera Frontal' : 'Câmera Traseira'}
          </Label>
          <Switch
            id="camera-switch"
            checked={isFrontCamera}
            onCheckedChange={handleCameraSwitch}
          />
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="absolute top-16 left-4 right-4 z-50">
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-white">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="relative w-full max-w-[280px] aspect-square">
          {/* Corner Markers */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-white rounded-tl-lg z-10" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-white rounded-tr-lg z-10" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-white rounded-bl-lg z-10" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-white rounded-br-lg z-10" />

          {/* QR Scanner - Sempre presente mas oculto quando não estiver escaneando */}
          <div 
            id="qr-reader"
            className={`w-full h-full overflow-hidden rounded-lg bg-black ${
              isScanning ? 'block' : 'hidden'
            }`}
          />

          {/* Botão de iniciar - Mostrado apenas quando não estiver escaneando */}
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={toggleScanner}
                size="lg"
                className="h-20 w-20 rounded-full bg-white hover:bg-white/90"
              >
                <Camera className="w-8 h-8 text-black" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-white/80 mt-6 text-center text-sm">
          {isScanning ? 'Posicione o QR Code dentro da área' : 'Clique para iniciar o scanner'}
        </p>
      </div>

      {/* Bottom Action */}
      <div className="safe-area-bottom">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="file-input"
          onChange={handleFileInput}
        />
        <Button 
          variant="ghost" 
          className="w-full text-white py-6 hover:bg-white/10 rounded-none flex items-center justify-center gap-2"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Image className="h-5 w-5" />
          <span>Escolher da galeria</span>
        </Button>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">QR Code detectado</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setResult('');
                  setErrorMessage(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="break-all bg-gray-100 p-3 rounded-md">{result}</p>
            <div className="flex gap-2 mt-4">
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  alert('Copiado para a área de transferência!');
                }}
              >
                Copiar
              </Button>
              <Button 
                className="w-full"
                onClick={() => {
                  setResult('');
                  setErrorMessage(null);
                }}
              >
                Escanear novamente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeReader;


// import { useState,} from 'react';
// import QrReader from 'react-qr-scanner';
// import { Camera, Play, Square } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Switch } from '@/components/ui/switch';
// import { Label } from '@/components/ui/label';
// import { Button } from '@/components/ui/button';

// interface ScanResult {
//   text: string;
// }

// const QRCodeReader = () => {
//   const [result, setResult] = useState<string>('');
//   const [error, setError] = useState<string | null>(null);
//   const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
//   const [isScanning, setIsScanning] = useState<boolean>(false);
//   const [key, setKey] = useState<number>(0); // Chave para forçar recriação do componente

//   const handleError = (err: Error) => {
//     console.error(err);
//     setError(err.message);
//   };

//   const handleScan = (data: ScanResult | null) => {
//     if (data) {
//       setResult(data.text);
//     }
//   };

//   const toggleScanner = () => {
//     setIsScanning(prev => !prev);
//     if (!isScanning) {
//       setError(null);
//       setResult('');
//     }
//   };

//   const handleCameraSwitch = (checked: boolean) => {
//     setIsFrontCamera(checked);
//     setKey(prev => prev + 1); // Força recriação do componente QrReader
//     if (isScanning) {
//       setIsScanning(false);
//       setTimeout(() => setIsScanning(true), 100);
//     }
//   };

//   const previewStyle = {
//     width: '100%',
//     height: 'auto',
//     aspectRatio: '4/3'
//   };

//   return (
//     <div className="container mx-auto p-4 max-w-md">
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Camera className="w-6 h-6" />
//               Leitor de QR Code
//             </div>
//             <Button
//               onClick={toggleScanner}
//               variant={isScanning ? "destructive" : "default"}
//               size="sm"
//             >
//               {isScanning ? (
//                 <>
//                   <Square className="w-4 h-4 mr-2" />
//                   Parar
//                 </>
//               ) : (
//                 <>
//                   <Play className="w-4 h-4 mr-2" />
//                   Iniciar
//                 </>
//               )}
//             </Button>
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div className="flex items-center space-x-2">
//               <Switch
//                 id="camera-switch"
//                 checked={isFrontCamera}
//                 onCheckedChange={handleCameraSwitch}
//                 disabled={isScanning}
//               />
//               <Label htmlFor="camera-switch">
//                 {isFrontCamera ? 'Câmera Frontal' : 'Câmera Traseira'}
//               </Label>
//             </div>

//             {error && (
//               <Alert variant="destructive">
//                 <AlertDescription>
//                   Erro ao acessar a câmera: {error}
//                 </AlertDescription>
//               </Alert>
//             )}

//             <div className="w-full rounded-lg overflow-hidden bg-gray-100">
//               {isScanning && (
//                 <QrReader
//                   key={key} // Força recriação do componente quando a câmera muda
//                   delay={300}
//                   style={previewStyle}
//                   onError={handleError}
//                   onScan={handleScan}
//                   constraints={{
//                     video: {
//                       facingMode: isFrontCamera ? 'user' : { exact: 'environment' }
//                     }
//                   }}
//                 />
//               )}
//             </div>

//             {result && (
//               <div className="mt-4">
//                 <h3 className="font-semibold mb-2">Resultado:</h3>
//                 <p className="p-3 bg-gray-100 rounded-lg break-all">{result}</p>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default QRCodeReader;