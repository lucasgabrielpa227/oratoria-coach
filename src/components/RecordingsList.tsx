'use client'

import { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  Clock, 
  Calendar, 
  BarChart3, 
  Trash2, 
  Download,
  Share2,
  ArrowLeft,
  Search
} from 'lucide-react'
import { getUserRecordings, Recording } from '@/lib/supabase'

interface RecordingsListProps {
  onBack: () => void
}

export default function RecordingsList({ onBack }: RecordingsListProps) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => {
    loadRecordings()
  }, [])

  const loadRecordings = async () => {
    try {
      const data = await getUserRecordings()
      setRecordings(data)
    } catch (error) {
      console.error('Erro ao carregar gravações:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecordings = recordings.filter(recording =>
    recording.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Hoje'
    if (diffDays === 2) return 'Ontem'
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`
    return date.toLocaleDateString('pt-BR')
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const handlePlay = (recordingId: string) => {
    if (playingId === recordingId) {
      setPlayingId(null)
    } else {
      setPlayingId(recordingId)
      // Aqui você implementaria a lógica real de reprodução
    }
  }

  const handleDelete = async (recordingId: string) => {
    if (confirm('Tem certeza que deseja excluir esta gravação?')) {
      // Implementar lógica de exclusão
      setRecordings(prev => prev.filter(r => r.id !== recordingId))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando suas gravações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Minhas Gravações</h1>
              <p className="text-sm text-gray-600">{recordings.length} gravações salvas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar gravações..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{recordings.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {recordings.filter(r => r.analysis_result?.overall_score >= 80).length}
            </div>
            <div className="text-sm text-gray-600">Excelentes</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(recordings.reduce((acc, r) => acc + (r.duration || 0), 0) / 60)}
            </div>
            <div className="text-sm text-gray-600">Min. total</div>
          </div>
        </div>

        {/* Recordings List */}
        <div className="space-y-4">
          {filteredRecordings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {searchTerm ? 'Nenhuma gravação encontrada' : 'Nenhuma gravação ainda'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Tente buscar por outro termo'
                  : 'Comece fazendo sua primeira prática!'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={onBack}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Fazer Primeira Prática
                </button>
              )}
            </div>
          ) : (
            filteredRecordings.map((recording) => (
              <div key={recording.id} className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{recording.title}</h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{formatDate(recording.created_at)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{formatDuration(recording.duration || 0)}</span>
                      </span>
                    </div>
                  </div>
                  
                  {recording.analysis_result?.overall_score && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(recording.analysis_result.overall_score)}`}>
                      {recording.analysis_result.overall_score}
                    </div>
                  )}
                </div>

                {/* Audio Player */}
                <div className="flex items-center space-x-3 mb-3">
                  <button
                    onClick={() => handlePlay(recording.id)}
                    className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    {playingId === recording.id ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: playingId === recording.id ? '45%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Analysis Summary */}
                {recording.analysis_result && (
                  <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="text-sm font-medium text-blue-800">
                        {recording.analysis_result.speaking_rate_wpm || 0}
                      </div>
                      <div className="text-xs text-blue-600">WPM</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-2">
                      <div className="text-sm font-medium text-orange-800">
                        {recording.analysis_result.filler_words_count || 0}
                      </div>
                      <div className="text-xs text-orange-600">Enchimento</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="text-sm font-medium text-green-800">
                        {recording.analysis_result.strengths?.length || 0}
                      </div>
                      <div className="text-xs text-green-600">Pontos+</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                      <Download size={16} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-green-600 transition-colors">
                      <Share2 size={16} />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(recording.id)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}