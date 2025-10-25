'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Download
} from 'lucide-react'

interface AnalysisResult {
  overall_score: number
  speaking_rate_wpm: number
  filler_words_count: number
  filler_words_list: string[]
  strengths: string[]
  improvement_areas: string[]
  duration_seconds: number
}

interface AnalysisResultsProps {
  result: AnalysisResult
  onNewPractice: () => void
  onFeedback: () => void
}

export default function AnalysisResults({ result, onNewPractice, onFeedback }: AnalysisResultsProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excelente! 🎉'
    if (score >= 80) return 'Muito bom! 👏'
    if (score >= 70) return 'Bom trabalho! 👍'
    if (score >= 60) return 'Continue praticando! 💪'
    return 'Há espaço para melhoria! 📈'
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    // Aqui você implementaria a lógica real de reprodução do áudio
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Análise Completa</h1>
          <p className="text-gray-600">Aqui está o feedback da sua prática</p>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-3xl shadow-lg p-6 text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold mb-4 ${getScoreColor(result.overall_score)}`}>
            {result.overall_score}
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {getScoreMessage(result.overall_score)}
          </h2>
          <p className="text-gray-600">Score geral da sua apresentação</p>
        </div>

        {/* Audio Player */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Sua Gravação</h3>
            <span className="text-sm text-gray-500">{formatDuration(result.duration_seconds)}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '30%' }} />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <RotateCcw size={16} />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Download size={16} />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="text-blue-600" size={20} />
              <span className="font-semibold text-gray-800">Ritmo</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{result.speaking_rate_wpm}</div>
            <div className="text-sm text-gray-600">palavras/min</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="text-orange-600" size={20} />
              <span className="font-semibold text-gray-800">Enchimento</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{result.filler_words_count}</div>
            <div className="text-sm text-gray-600">palavras</div>
          </div>
        </div>

        {/* Filler Words */}
        {result.filler_words_list.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Palavras de Enchimento Detectadas</h3>
            <div className="flex flex-wrap gap-2">
              {result.filler_words_list.map((word, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                >
                  "{word}"
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="text-green-600" size={20} />
            <h3 className="font-semibold text-gray-800">Pontos Fortes</h3>
          </div>
          <div className="space-y-2">
            {result.strengths.map((strength, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-gray-700 text-sm">{strength}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Areas */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-800">Áreas de Melhoria</h3>
          </div>
          <div className="space-y-2">
            {result.improvement_areas.map((area, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-gray-700 text-sm">{area}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onFeedback}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 shadow-lg"
          >
            Ver Dicas Personalizadas
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onNewPractice}
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
            >
              Nova Prática
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors">
              Salvar Progresso
            </button>
          </div>
        </div>

        {/* Progress Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start space-x-2">
            <BarChart3 className="text-blue-600 mt-1" size={16} />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">💡 Dica de Progresso</p>
              <p className="text-sm text-blue-700">
                Pratique diariamente por 5-10 minutos para ver melhorias significativas em 2 semanas!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}