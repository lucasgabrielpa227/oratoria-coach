'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, RotateCcw, Check, X, AlertCircle } from 'lucide-react'

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
}

export default function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    checkMicrophonePermission()
    return () => {
      cleanup()
    }
  }, [])

  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Seu navegador não suporta gravação de áudio. Use Chrome, Firefox ou Safari.')
        setPermissionStatus('denied')
        return
      }

      // Verificar se estamos em contexto seguro (HTTPS)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setError('Gravação de áudio requer conexão segura (HTTPS)')
        setPermissionStatus('denied')
        return
      }

      // Verificar permissão
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      setPermissionStatus(permission.state)
      
      permission.onchange = () => {
        setPermissionStatus(permission.state)
      }
    } catch (error) {
      console.error('Erro ao verificar permissão:', error)
      setPermissionStatus('prompt')
    }
  }

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  const requestMicrophoneAccess = async (): Promise<MediaStream | null> => {
    try {
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      })
      
      setPermissionStatus('granted')
      return stream
    } catch (error: any) {
      console.error('Erro ao solicitar permissão do microfone:', error)
      
      let errorMessage = 'Erro desconhecido ao acessar o microfone'
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'Permissão negada. Clique no ícone do microfone na barra de endereços e permita o acesso.'
          setPermissionStatus('denied')
          break
        case 'NotFoundError':
          errorMessage = 'Nenhum microfone encontrado. Verifique se há um microfone conectado.'
          break
        case 'NotReadableError':
          errorMessage = 'Microfone está sendo usado por outro aplicativo. Feche outros programas que possam estar usando o microfone.'
          break
        case 'OverconstrainedError':
          errorMessage = 'Configurações de áudio não suportadas pelo seu microfone.'
          break
        case 'SecurityError':
          errorMessage = 'Erro de segurança. Certifique-se de estar usando HTTPS.'
          break
        default:
          errorMessage = `Erro ao acessar microfone: ${error.message}`
      }
      
      setError(errorMessage)
      return null
    }
  }

  const startRecording = async () => {
    try {
      const stream = await requestMicrophoneAccess()
      if (!stream) return

      streamRef.current = stream
      chunksRef.current = []

      // Configurar MediaRecorder com melhor qualidade
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus'
      }

      // Fallback para outros formatos se webm não for suportado
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options.mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          options.mimeType = 'audio/wav'
        } else {
          delete options.mimeType // Usar formato padrão
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/wav' 
        })
        setAudioBlob(blob)
        
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        // Limpar stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.onerror = (event: any) => {
        console.error('Erro no MediaRecorder:', event.error)
        setError(`Erro na gravação: ${event.error?.message || 'Erro desconhecido'}`)
        setIsRecording(false)
      }

      mediaRecorder.start(100) // Coletar dados a cada 100ms
      setIsRecording(true)
      setDuration(0)
      setError(null)

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

    } catch (error: any) {
      console.error('Erro ao iniciar gravação:', error)
      setError(`Erro ao iniciar gravação: ${error.message}`)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
      setIsPaused(!isPaused)
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setDuration(0)
    setIsPlaying(false)
    setError(null)
  }

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleConfirm = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Renderizar erro de permissão
  if (permissionStatus === 'denied' || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex flex-col justify-center px-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-6">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Acesso ao Microfone Necessário
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {error || 'Para analisar sua fala, precisamos acessar seu microfone. Por favor, permita o acesso quando solicitado.'}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={checkMicrophonePermission}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 shadow-lg"
            >
              Tentar Novamente
            </button>
            
            <button
              onClick={onCancel}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium transition-colors"
            >
              Voltar
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-left">
            <p className="text-sm text-blue-800 font-medium mb-2">💡 Como permitir acesso:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Clique no ícone do microfone na barra de endereços</li>
              <li>• Selecione "Sempre permitir" para este site</li>
              <li>• Recarregue a página se necessário</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        {/* Recording Status */}
        <div className="mb-8">
          <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-6 transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 shadow-2xl animate-pulse' 
              : audioBlob 
              ? 'bg-green-500 shadow-lg' 
              : 'bg-indigo-600 shadow-lg hover:shadow-xl'
          }`}>
            {isRecording ? (
              <Mic className="text-white animate-pulse" size={48} />
            ) : audioBlob ? (
              <Check className="text-white" size={48} />
            ) : (
              <Mic className="text-white" size={48} />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isRecording 
              ? (isPaused ? 'Gravação Pausada' : 'Gravando...') 
              : audioBlob 
              ? 'Gravação Concluída' 
              : 'Pronto para Gravar'
            }
          </h1>
          
          <p className="text-lg font-mono text-indigo-600">
            {formatTime(duration)}
          </p>
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mb-8">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={playAudio}
                  className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
                
                <span className="text-sm text-gray-600">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-4">
          {!audioBlob ? (
            <div className="flex justify-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={permissionStatus === 'checking'}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg disabled:opacity-50"
                >
                  {permissionStatus === 'checking' ? 'Verificando...' : 'Iniciar Gravação'}
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={pauseRecording}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                  </button>
                  
                  <button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    <Square size={20} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={resetRecording}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw size={16} />
                  <span>Gravar Novamente</span>
                </button>
                
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Check size={16} />
                  <span>Analisar</span>
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={onCancel}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start space-x-2">
            <Mic className="text-blue-600 mt-1" size={16} />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-2">
                💡 Dicas para uma boa gravação
              </p>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Fale em ambiente silencioso</li>
                <li>• Mantenha o microfone próximo</li>
                <li>• Fale de forma natural e clara</li>
                <li>• Grave por pelo menos 30 segundos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}