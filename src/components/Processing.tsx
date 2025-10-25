'use client'

import { useEffect, useState } from 'react'
import { Brain, Zap, Sparkles, Wifi, WifiOff } from 'lucide-react'

interface ProcessingProps {
  progress: number
  currentAPI?: string
  isOnline?: boolean
}

const processingSteps = [
  'Preparando áudio para análise...',
  'Conectando com APIs de análise...',
  'Transcrevendo fala com IA...',
  'Analisando ritmo e fluência...',
  'Detectando palavras de enchimento...',
  'Avaliando clareza e articulação...',
  'Calculando scores de performance...',
  'Gerando insights personalizados...',
  'Finalizando análise completa...'
]

const apiNames: Record<string, string> = {
  'openai': 'OpenAI Whisper',
  'azure': 'Azure Speech',
  'google': 'Google Cloud Speech',
  'web': 'Web Speech API',
  'fallback': 'Análise Local'
}

export default function Processing({ progress, currentAPI = 'auto', isOnline = true }: ProcessingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [apiStatus, setApiStatus] = useState<'connecting' | 'processing' | 'fallback'>('connecting')

  useEffect(() => {
    const stepIndex = Math.floor((progress / 100) * processingSteps.length)
    setCurrentStep(Math.min(stepIndex, processingSteps.length - 1))
    
    // Determinar status da API baseado no progresso
    if (progress < 20) {
      setApiStatus('connecting')
    } else if (progress < 90) {
      setApiStatus('processing')
    } else {
      setApiStatus('processing')
    }
  }, [progress])

  useEffect(() => {
    const text = processingSteps[currentStep]
    let index = 0
    setDisplayText('')
    
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [currentStep])

  const getAPIStatusColor = () => {
    if (!isOnline) return 'text-red-500'
    switch (apiStatus) {
      case 'connecting': return 'text-yellow-500'
      case 'processing': return 'text-green-500'
      case 'fallback': return 'text-orange-500'
      default: return 'text-gray-500'
    }
  }

  const getAPIStatusText = () => {
    if (!isOnline) return 'Offline - Usando análise local'
    switch (apiStatus) {
      case 'connecting': return `Conectando com ${apiNames[currentAPI] || 'API de análise'}...`
      case 'processing': return `Processando com ${apiNames[currentAPI] || 'IA avançada'}`
      case 'fallback': return 'Usando análise local (APIs indisponíveis)'
      default: return 'Preparando análise...'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center px-6">
      <div className="max-w-md mx-auto w-full text-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
            <Brain className="text-white animate-pulse" size={40} />
          </div>
          
          {/* Floating particles */}
          <div className="absolute -top-2 -right-2">
            <Sparkles className="text-yellow-400 animate-bounce" size={20} />
          </div>
          <div className="absolute -bottom-2 -left-2">
            <Zap className="text-blue-400 animate-pulse" size={16} />
          </div>
          
          {/* Connection Status */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            {isOnline ? (
              <Wifi className={`${getAPIStatusColor()} animate-pulse`} size={16} />
            ) : (
              <WifiOff className="text-red-500" size={16} />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Analisando sua fala
        </h1>
        
        {/* API Status */}
        <p className={`text-sm mb-6 ${getAPIStatusColor()}`}>
          {getAPIStatusText()}
        </p>

        {/* Current Step */}
        <div className="mb-8">
          <p className="text-lg text-gray-600 h-7">
            {displayText}
            <span className="animate-pulse">|</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Processing Steps Indicator */}
        <div className="space-y-2 mb-8">
          {processingSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
                index < currentStep
                  ? 'text-green-600 bg-green-50'
                  : index === currentStep
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                index < currentStep
                  ? 'bg-green-500'
                  : index === currentStep
                  ? 'bg-indigo-500 animate-pulse'
                  : 'bg-gray-300'
              }`} />
              <span className="text-sm">{step}</span>
            </div>
          ))}
        </div>

        {/* API Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-2">
            <Brain className="text-blue-600 mt-1" size={16} />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                🚀 Análise Avançada com IA
              </p>
              <p className="text-sm text-blue-700">
                {isOnline 
                  ? 'Usando APIs de última geração para análise precisa de fala, incluindo transcrição automática, detecção de emoções e métricas avançadas de oratória.'
                  : 'Modo offline ativo. A análise será feita localmente com algoritmos otimizados.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
            <p>API: {currentAPI}</p>
            <p>Status: {apiStatus}</p>
            <p>Online: {isOnline ? 'Sim' : 'Não'}</p>
            <p>Passo: {currentStep + 1}/{processingSteps.length}</p>
          </div>
        )}
      </div>
    </div>
  )
}