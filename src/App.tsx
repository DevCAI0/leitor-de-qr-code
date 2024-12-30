
import './App.css'
import QRCodeReader from './components/Leitor-qr-code'
import { BrowserRouter as Router } from 'react-router-dom';


function App() {

  return (
    <div className="min-h-screen bg-gray-100 py-8">
       <Router>
    <QRCodeReader />

       </Router>
  </div>
  )
}

export default App
