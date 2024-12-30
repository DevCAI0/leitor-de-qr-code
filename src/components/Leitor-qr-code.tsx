import { useState,} from 'react';
import QrReader from 'react-qr-scanner';
import { Camera, Play, Square } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ScanResult {
  text: string;
}

const QRCodeReader = () => {
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [key, setKey] = useState<number>(0); // Chave para forçar recriação do componente

  const handleError = (err: Error) => {
    console.error(err);
    setError(err.message);
  };

  const handleScan = (data: ScanResult | null) => {
    if (data) {
      setResult(data.text);
    }
  };

  const toggleScanner = () => {
    setIsScanning(prev => !prev);
    if (!isScanning) {
      setError(null);
      setResult('');
    }
  };

  const handleCameraSwitch = (checked: boolean) => {
    setIsFrontCamera(checked);
    setKey(prev => prev + 1); // Força recriação do componente QrReader
    if (isScanning) {
      setIsScanning(false);
      setTimeout(() => setIsScanning(true), 100);
    }
  };

  const previewStyle = {
    width: '100%',
    height: 'auto',
    aspectRatio: '4/3'
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-6 h-6" />
              Leitor de QR Code
            </div>
            <Button
              onClick={toggleScanner}
              variant={isScanning ? "destructive" : "default"}
              size="sm"
            >
              {isScanning ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Parar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="camera-switch"
                checked={isFrontCamera}
                onCheckedChange={handleCameraSwitch}
                disabled={isScanning}
              />
              <Label htmlFor="camera-switch">
                {isFrontCamera ? 'Câmera Frontal' : 'Câmera Traseira'}
              </Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Erro ao acessar a câmera: {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="w-full rounded-lg overflow-hidden bg-gray-100">
              {isScanning && (
                <QrReader
                  key={key} // Força recriação do componente quando a câmera muda
                  delay={300}
                  style={previewStyle}
                  onError={handleError}
                  onScan={handleScan}
                  constraints={{
                    video: {
                      facingMode: isFrontCamera ? 'user' : { exact: 'environment' }
                    }
                  }}
                />
              )}
            </div>

            {result && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Resultado:</h3>
                <p className="p-3 bg-gray-100 rounded-lg break-all">{result}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeReader;