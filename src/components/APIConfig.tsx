'use client'

import { useState, useEffect } from 'react'
import { Settings, Key, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { getAvailableAPIs } from '@/lib/speechAnalysis'

interface APIConfigProps {
  onClose: () => void
}

export default function APIConfig({ onClose }: APIConfigProps) {
  const [availableAPIs, setAvailableAPIs] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>({})

  useEffect(() => {
    setAvailableAPIs(getAvailableAPIs())
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const testAPI = async (apiName: string) => {
    setTestResults(prev => ({ ...prev, [apiName]: 'testing' }))
    
    try {
      // Simular teste da API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Verificar se a API está configurada
      let isConfigured = false
      switch (apiName) {
        case 'openai':
          isConfigured = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY
          break
        case 'azure':
          isConfigured = !!(process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY && 
                           process.env.NEXT_PUBLIC_AZURE_SPEECH_ENDPOINT)
          break
        case 'google':
          isConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_SPEECH_KEY
          break
        case 'web':
          isConfigured = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
          break
      }
      
      setTestResults(prev => ({ 
        ...prev, 
        [apiName]: isConfigured ? 'success' : 'error' 
      }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, [apiName]: 'error' }))
    }
  }

  const getAPIStatus = (apiName: string) => {
    switch (apiName) {
      case 'OpenAI Whisper':
        return process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Configurado' : 'Não configurado'
      case 'Azure Speech Services':
        return (process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY && 
                process.env.NEXT_PUBLIC_AZURE_SPEECH_ENDPOINT) ? 'Configurado' : 'Não configurado'
      case 'Google Cloud Speech':
        return process.env.NEXT_PUBLIC_GOOGLE_SPEECH_KEY ? 'Configurado' : 'Não configurado'
      case 'Web Speech API (Nativo)':
        return ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) 
          ? 'Disponível' : 'Não suportado'
      default:
        return 'Desconhecido'
    }
  }

  const getStatusIcon = (apiName: string) => {
    const status = getAPIStatus(apiName)
    const testResult = testResults[apiName.toLowerCase().split(' ')[0]]
    
    if (testResult === 'testing') {
      return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    }
    
    if (testResult === 'success' || status.includes('Configurado') || status.includes('Disponível')) {
      return <CheckCircle className="text-green-500" size={16} />
    }
    
    return <AlertCircle className="text-red-500" size={16} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="text-indigo-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-800">Configuração de APIs</h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Connection Status */}
        <div className={`p-4 rounded-2xl border ${
          isOnline 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="text-green-600" size={20} />
            ) : (
              <WifiOff className="text-red-600" size={20} />
            )}
            <span className={`font-medium ${
              isOnline ? 'text-green-800' : 'text-red-800'
            }`}>
              {isOnline ? 'Conectado à Internet' : 'Sem conexão com a Internet'}
            </span>
          </div>
        </div>

        {/* APIs Status */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="font-semibold text-gray-800 mb-4">Status das APIs</h2>
          
          <div className="space-y-4">
            {[
              'OpenAI Whisper',
              'Azure Speech Services', 
              'Google Cloud Speech',
              'Web Speech API (Nativo)'
            ].map((apiName) => (
              <div key={apiName} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(apiName)}
                  <div>
                    <p className="font-medium text-gray-800">{apiName}</p>
                    <p className="text-sm text-gray-600">{getAPIStatus(apiName)}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => testAPI(apiName.toLowerCase().split(' ')[0])}
                  disabled={testResults[apiName.toLowerCase().split(' ')[0]] === 'testing'}
                  className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {testResults[apiName.toLowerCase().split(' ')[0]] === 'testing' ? 'Testando...' : 'Testar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start space-x-2">
            <Key className="text-blue-600 mt-1" size={16} />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-2">
                Como configurar as APIs
              </p>
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>OpenAI:</strong> Obtenha sua chave em platform.openai.com/api-keys</p>
                <p><strong>Azure:</strong> Configure no portal.azure.com (Speech Services)</p>
                <p><strong>Google:</strong> Ative no console.cloud.google.com (Speech-to-Text)</p>
                <p><strong>Web Speech:</strong> Funciona nativamente no Chrome/Edge</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Configuration */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="font-semibold text-gray-800 mb-4">Configuração Atual</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">APIs Disponíveis:</span>
              <span className="font-medium text-gray-800">{availableAPIs.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Modo Preferido:</span>
              <span className="font-medium text-gray-800">
                {availableAPIs.length > 1 ? 'Automático' : availableAPIs[0] || 'Nenhum'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fallback:</span>
              <span className="font-medium text-gray-800">Web Speech API</span>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="text-yellow-600 mt-1" size={16} />
            <div>
              <p className="text-sm text-yellow-800 font-medium mb-2">
                💡 Dicas de Performance
              </p>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• OpenAI Whisper oferece a melhor precisão</p>
                <p>• Azure Speech é ideal para análise em tempo real</p>
                <p>• Web Speech API funciona offline</p>
                <p>• Configure múltiplas APIs para redundância</p>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 shadow-lg"
        >
          Fechar Configurações
        </button>
      </div>
    </div>
  )
}