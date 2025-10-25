'use client'

import { useState, useEffect } from 'react'
import { Plus, Flame, Trophy, Clock, Mic, Target, History, Crown, Settings, User } from 'lucide-react'
import Onboarding from '@/components/Onboarding'
import Auth from '@/components/Auth'
import AudioRecorder from '@/components/AudioRecorder'
import Processing from '@/components/Processing'
import AnalysisResults from '@/components/AnalysisResults'
import Feedback from '@/components/Feedback'
import RecordingsList from '@/components/RecordingsList'
import { analyzeSpeech, getAvailableAPIs, type SpeechAnalysisResult } from '@/lib/speechAnalysis'

type AppState = 'onboarding' | 'auth' | 'dashboard' | 'recording' | 'processing' | 'results' | 'feedback' | 'recordings'

interface User {
  id: string
  name: string
  email: string
  subscription_tier: 'free' | 'premium'
  streak_count: number
}

interface PracticeSession {
  id: string
  date: string
  score: number
  duration: string
}

// Mock data
const mockUser: User = {
  id: '1',
  name: 'João Silva',
  email: 'joao@email.com',
  subscription_tier: 'free',
  streak_count: 7
}

const mockSessions: PracticeSession[] = [
  { id: '1', date: 'Hoje', score: 85, duration: '2:30' },
  { id: '2', date: 'Ontem', score: 78, duration: '1:45' },
  { id: '3', date: '2 dias atrás', score: 82, duration: '3:15' }
]

const dailyChallenges = [
  "Apresente-se em 60 segundos",
  "Explique um conceito complexo de forma simples",
  "Conte uma história pessoal inspiradora",
  "Defenda uma opinião polêmica",
  "Descreva seu projeto dos sonhos"
]

export default function OratóriaFlow() {
  const [appState, setAppState] = useState<AppState>('onboarding')
  const [user, setUser] = useState<User | null>(null)
  const [currentChallenge, setCurrentChallenge] = useState('')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [currentSessionId, setCurrentSessionId] = useState('')
  const [analysisResult, setAnalysisResult] = useState<SpeechAnalysisResult | null>(null)
  const [currentAPI, setCurrentAPI] = useState<string>('auto')
  const [isOnline, setIsOnline] = useState(true)
  const [availableAPIs, setAvailableAPIs] = useState<string[]>([])

  useEffect(() => {
    // Verificar APIs disponíveis
    setAvailableAPIs(getAvailableAPIs())
    
    // Verificar status online
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

  useEffect(() => {
    // Simular verificação de autenticação
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    
    if (hasSeenOnboarding && isAuthenticated) {
      setAppState('dashboard')
      setUser(mockUser)
    }
  }, [])

  useEffect(() => {
    // Selecionar desafio diário aleatório
    const today = new Date().getDate()
    setCurrentChallenge(dailyChallenges[today % dailyChallenges.length])
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setAppState('auth')
  }

  const handleAuthSuccess = () => {
    localStorage.setItem('isAuthenticated', 'true')
    setUser(mockUser)
    setAppState('dashboard')
  }

  const handleStartRecording = () => {
    setAppState('recording')
  }

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setAppState('processing')
    setProcessingProgress(0)
    
    const sessionId = Date.now().toString()
    setCurrentSessionId(sessionId)
    
    try {
      // Simular progresso inicial
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + Math.random() * 10
        })
      }, 500)

      // Determinar qual API usar baseado na disponibilidade
      let apiToUse: 'auto' | 'openai' | 'azure' | 'google' | 'web' = 'auto'
      
      if (!isOnline) {
        apiToUse = 'web'
        setCurrentAPI('web')
      } else if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        apiToUse = 'openai'
        setCurrentAPI('openai')
      } else if (process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY) {
        apiToUse = 'azure'
        setCurrentAPI('azure')
      } else if (process.env.NEXT_PUBLIC_GOOGLE_SPEECH_KEY) {
        apiToUse = 'google'
        setCurrentAPI('google')
      } else {
        apiToUse = 'web'
        setCurrentAPI('web')
      }

      console.log(`Iniciando análise com API: ${apiToUse}`)
      
      // Realizar análise real
      const result = await analyzeSpeech(audioBlob, apiToUse)
      
      // Finalizar progresso
      clearInterval(progressInterval)
      setProcessingProgress(100)
      setAnalysisResult(result)
      
      // Aguardar um pouco antes de mostrar resultados
      setTimeout(() => {
        setAppState('results')
      }, 1000)
      
    } catch (error) {
      console.error('Erro na análise:', error)
      
      // Fallback para análise mock em caso de erro
      const mockResult: SpeechAnalysisResult = {
        overall_score: 78,
        speaking_rate_wpm: 145,
        filler_words_count: 8,
        filler_words_list: ["ahn", "é", "tipo", "então"],
        strengths: [
          "Ritmo de fala adequado para o contexto",
          "Boa articulação das palavras"
        ],
        improvement_areas: [
          "Reduzir o uso de palavras de enchimento",
          "Trabalhar pausas estratégicas"
        ],
        duration_seconds: duration,
        confidence_score: 0.75
      }
      
      setAnalysisResult(mockResult)
      setProcessingProgress(100)
      
      setTimeout(() => {
        setAppState('results')
      }, 1000)
    }
  }

  const handleRecordingCancel = () => {
    setAppState('dashboard')
  }

  const handleNewPractice = () => {
    setAppState('dashboard')
  }

  const handleShowFeedback = () => {
    setAppState('feedback')
  }

  const handleFeedbackComplete = () => {
    setAppState('dashboard')
  }

  const handleShowRecordings = () => {
    setAppState('recordings')
  }

  const handleBackFromRecordings = () => {
    setAppState('dashboard')
  }

  const getLevel = (streak: number) => {
    return Math.floor(streak / 7) + 1
  }

  const getLevelProgress = (streak: number) => {
    return (streak % 7) * (100 / 7)
  }

  if (appState === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  if (appState === 'auth') {
    return <Auth onAuthSuccess={handleAuthSuccess} />
  }

  if (appState === 'recording') {
    return (
      <AudioRecorder
        onRecordingComplete={handleRecordingComplete}
        onCancel={handleRecordingCancel}
      />
    )
  }

  if (appState === 'processing') {
    return (
      <Processing 
        progress={processingProgress} 
        currentAPI={currentAPI}
        isOnline={isOnline}
      />
    )
  }

  if (appState === 'results' && analysisResult) {
    return (
      <AnalysisResults
        result={analysisResult}
        onNewPractice={handleNewPractice}
        onFeedback={handleShowFeedback}
      />
    )
  }

  if (appState === 'feedback') {
    return (
      <Feedback
        sessionId={currentSessionId}
        onComplete={handleFeedbackComplete}
      />
    )
  }

  if (appState === 'recordings') {
    return <RecordingsList onBack={handleBackFromRecordings} />
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">OratóriaFlow</h1>
              <p className="text-sm text-gray-600">Olá, {user?.name?.split(' ')[0]}! 👋</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Flame className="text-orange-500" size={20} />
                <span className="font-bold text-orange-600">{user?.streak_count}</span>
              </div>
              {user?.subscription_tier === 'premium' && (
                <Crown className="text-yellow-500" size={20} />
              )}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="text-gray-600" size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* API Status Banner */}
        {availableAPIs.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium text-green-800">Análise Avançada Ativa</span>
            </div>
            <p className="text-sm text-green-700">
              APIs disponíveis: {availableAPIs.join(', ')}
            </p>
            {!isOnline && (
              <p className="text-sm text-orange-600 mt-1">
                ⚠️ Modo offline - usando análise local
              </p>
            )}
          </div>
        )}

        {/* Level Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Trophy className="text-indigo-600" size={20} />
              <span className="font-semibold text-gray-800">Nível {getLevel(user?.streak_count || 0)}</span>
            </div>
            <span className="text-sm text-gray-500">
              {Math.round(getLevelProgress(user?.streak_count || 0))}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getLevelProgress(user?.streak_count || 0)}%` }}
            />
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="text-white" size={20} />
            <span className="font-semibold">Desafio Diário</span>
          </div>
          <p className="text-lg mb-4 leading-relaxed">{currentChallenge}</p>
          <button
            onClick={handleStartRecording}
            className="bg-white text-indigo-600 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold transition-colors shadow-md"
          >
            Iniciar Desafio
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleStartRecording}
            className="bg-white hover:bg-gray-50 border-2 border-dashed border-indigo-300 hover:border-indigo-400 rounded-2xl p-6 transition-all duration-200 group"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-full flex items-center justify-center transition-colors">
                <Plus className="text-indigo-600" size={20} />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 text-sm mb-1">Nova Prática</h3>
                <p className="text-xs text-gray-600">Discurso livre</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleShowRecordings}
            className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl p-6 transition-all duration-200 group"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors">
                <History className="text-purple-600" size={20} />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 text-sm mb-1">Gravações</h3>
                <p className="text-xs text-gray-600">Ver histórico</p>
              </div>
            </div>
          </button>
        </div>

        {/* Usage Stats for Free Users */}
        {user?.subscription_tier === 'free' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-amber-800">Plano Gratuito</span>
              <span className="text-sm text-amber-600">2/3 análises esta semana</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2 mb-3">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: '66%' }} />
            </div>
            <button className="text-sm text-amber-700 hover:text-amber-800 font-medium">
              Upgrade para Premium →
            </button>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <History className="text-gray-600" size={20} />
              <h3 className="font-semibold text-gray-800">Últimas Práticas</h3>
            </div>
            <button
              onClick={handleShowRecordings}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ver todas
            </button>
          </div>
          
          <div className="space-y-3">
            {mockSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800">{session.date}</p>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{session.duration}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    session.score >= 80 ? 'text-green-600' :
                    session.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {session.score}
                  </div>
                  <div className="text-xs text-gray-500">score</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="text-green-600" size={20} />
            <h3 className="font-semibold text-gray-800">Meta Semanal</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">5 práticas por semana</span>
            <span className="text-sm text-gray-500">3/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }} />
          </div>
          <p className="text-sm text-gray-600">
            Faltam apenas 2 práticas para completar sua meta! 🎯
          </p>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleStartRecording}
            className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105"
          >
            <Mic size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}