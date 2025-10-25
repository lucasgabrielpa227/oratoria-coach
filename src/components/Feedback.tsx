'use client'

import { useState } from 'react'
import { 
  Star, 
  MessageCircle, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  Lightbulb,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react'

interface FeedbackProps {
  sessionId: string
  onComplete: () => void
}

const personalizedTips = [
  {
    icon: Target,
    title: 'Reduza Palavras de Enchimento',
    description: 'Tente pausar em vez de usar "ahn", "é", "tipo". Pausas estratégicas tornam sua fala mais impactante.',
    action: 'Pratique lendo em voz alta e fazendo pausas conscientes.'
  },
  {
    icon: TrendingUp,
    title: 'Melhore o Ritmo',
    description: 'Varie a velocidade da sua fala. Fale mais devagar em pontos importantes e acelere em transições.',
    action: 'Grave-se lendo notícias e varie o ritmo conforme o conteúdo.'
  },
  {
    icon: BookOpen,
    title: 'Exercício Recomendado',
    description: 'Pratique o "Método dos 3 Pontos": escolha 3 ideias principais e desenvolva cada uma por 1 minuto.',
    action: 'Tente este exercício na próxima prática.'
  }
]

export default function Feedback({ sessionId, onComplete }: FeedbackProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTip, setCurrentTip] = useState(0)

  const handleRating = (value: number) => {
    setRating(value)
  }

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert('Por favor, avalie sua experiência')
      return
    }

    setIsSubmitting(true)
    
    // Simular envio do feedback
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitting(false)
    onComplete()
  }

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % personalizedTips.length)
  }

  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + personalizedTips.length) % personalizedTips.length)
  }

  const tip = personalizedTips[currentTip]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Dicas Personalizadas</h1>
          <p className="text-gray-600">Baseadas na sua análise de hoje</p>
        </div>

        {/* Personalized Tips Carousel */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Dica {currentTip + 1} de {personalizedTips.length}</h2>
            <div className="flex space-x-1">
              {personalizedTips.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTip ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <tip.icon className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">{tip.title}</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">{tip.description}</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <Lightbulb className="text-blue-600 mt-1" size={16} />
                <div className="text-left">
                  <p className="text-sm text-blue-800 font-medium mb-1">Ação Recomendada:</p>
                  <p className="text-sm text-blue-700">{tip.action}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={prevTip}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={currentTip === 0}
            >
              ← Anterior
            </button>
            <button
              onClick={nextTip}
              className="px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              disabled={currentTip === personalizedTips.length - 1}
            >
              Próxima →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
              <Target className="text-green-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Definir Meta</h3>
            <p className="text-sm text-gray-600">Para próxima prática</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
              <BookOpen className="text-purple-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Exercícios</h3>
            <p className="text-sm text-gray-600">Práticas dirigidas</p>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Como foi sua experiência?</h3>
          
          {/* Star Rating */}
          <div className="flex justify-center space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                className={`p-1 transition-colors ${
                  star <= rating ? 'text-yellow-500' : 'text-gray-300'
                }`}
              >
                <Star size={32} fill={star <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentário (opcional)
            </label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-3 text-gray-400" size={20} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte-nos sobre sua experiência..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Quick Feedback Buttons */}
          <div className="flex space-x-2 mb-4">
            <button className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors">
              <ThumbsUp size={16} />
              <span>Útil</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">
              <Lightbulb size={16} />
              <span>Insights valiosos</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || rating === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Send size={16} />
                <span>Enviar Feedback</span>
              </>
            )}
          </button>
        </div>

        {/* Skip Button */}
        <button
          onClick={onComplete}
          className="w-full text-gray-600 hover:text-gray-800 py-3 font-medium transition-colors"
        >
          Pular por agora
        </button>
      </div>
    </div>
  )
}