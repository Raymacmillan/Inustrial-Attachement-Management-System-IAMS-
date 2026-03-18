import { useState } from 'react'
import './App.css'

import { Bell, CheckCircle, Smartphone } from 'lucide-react';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-8">
      {/* Testing the .card component class and custom shadows */}
      <div className="card max-w-md w-full space-y-6">
        
        {/* Testing font-display and brand-900 color */}
        <h1 className="font-display text-3xl text-brand-900 border-b pb-4">
          IAMS System Test
        </h1>

        <div className="space-y-4">
          {/* Testing brand-600 (Primary) and lucide-react */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <CheckCircle className="text-brand-600 w-6 h-6" />
            </div>
            <p className="font-body text-gray-700">
              <strong className="text-brand-600">Tailwind v4:</strong> Verified
            </p>
          </div>

          {/* Testing accent color and font-mono */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-light rounded-lg">
              <Bell className="text-accent w-6 h-6" />
            </div>
            <p className="font-mono text-sm text-gray-600">
              Ref: <span className="text-warning">AUTH-INIT-2026</span>
            </p>
          </div>
        </div>

        {/* Testing .btn-primary component class */}
        <button className="btn-primary w-full flex items-center justify-center gap-2">
          <Smartphone size={18} />
          Initialize Portal
        </button>

        <p className="text-xs text-center text-gray-400 italic">
          Standardizing with DM Sans & JetBrains Mono
        </p>
      </div>
    </div>
    </>
  )
}

export default App
