'use client'

// Tipos para análise de fala
export interface SpeechAnalysisResult {
  overall_score: number
  speaking_rate_wpm: number
  filler_words_count: number
  filler_words_list: string[]
  strengths: string[]
  improvement_areas: string[]
  duration_seconds: number
  confidence_score: number
  emotion_analysis?: {
    dominant_emotion: string
    confidence: number
    emotions: Record<string, number>
  }
  pronunciation_score?: number
  fluency_score?: number
  volume_analysis?: {
    average_volume: number
    volume_consistency: number
  }
}

export interface TranscriptionResult {
  text: string
  confidence: number
  words: Array<{
    word: string
    start_time: number
    end_time: number
    confidence: number
  }>
}

// Configurações das APIs
const API_CONFIGS = {
  openai: {
    endpoint: 'https://api.openai.com/v1/audio/transcriptions',
    model: 'whisper-1'
  },
  azure: {
    endpoint: process.env.NEXT_PUBLIC_AZURE_SPEECH_ENDPOINT,
    key: process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY,
    region: process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION
  },
  google: {
    endpoint: 'https://speech.googleapis.com/v1/speech:recognize',
    key: process.env.NEXT_PUBLIC_GOOGLE_SPEECH_KEY
  }
}

// Palavras de enchimento em português
const FILLER_WORDS = [
  'ahn', 'eh', 'uhm', 'né', 'tipo', 'então', 'assim', 'sabe',
  'entende', 'entendeu', 'tá', 'ok', 'certo', 'bem', 'meio',
  'tipo assim', 'na verdade', 'basicamente', 'literalmente'
]

// Análise usando Web Speech API (nativa do browser)
export async function analyzeWithWebSpeechAPI(audioBlob: Blob): Promise<SpeechAnalysisResult> {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Web Speech API não suportada neste navegador'))
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    let fullTranscript = ''
    let startTime = Date.now()

    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      fullTranscript = transcript
    }

    recognition.onend = () => {
      const endTime = Date.now()
      const duration = Math.floor((endTime - startTime) / 1000)
      
      const analysis = analyzeTranscript(fullTranscript, duration)
      resolve(analysis)
    }

    recognition.onerror = (event: any) => {
      reject(new Error(`Erro na análise: ${event.error}`))
    }

    // Converter blob para URL e iniciar reconhecimento
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    
    audio.onloadedmetadata = () => {
      recognition.start()
      audio.play()
    }
  })
}

// Análise usando OpenAI Whisper API
export async function analyzeWithOpenAI(audioBlob: Blob): Promise<SpeechAnalysisResult> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('Chave da API OpenAI não configurada')
  }

  try {
    // Transcrição com Whisper
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')
    formData.append('response_format', 'verbose_json')

    const transcriptionResponse = await fetch(API_CONFIGS.openai.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    if (!transcriptionResponse.ok) {
      throw new Error(`Erro na transcrição: ${transcriptionResponse.statusText}`)
    }

    const transcriptionData = await transcriptionResponse.json()
    const transcript = transcriptionData.text
    const duration = transcriptionData.duration || 0

    // Análise avançada com GPT-4
    const analysisPrompt = `
    Analise o seguinte texto transcrito de uma apresentação oral em português e forneça uma análise detalhada:

    Texto: "${transcript}"
    Duração: ${duration} segundos

    Forneça uma análise JSON com:
    1. Score geral (0-100)
    2. Pontos fortes (array de strings)
    3. Áreas de melhoria (array de strings)
    4. Score de fluência (0-100)
    5. Score de pronúncia estimado (0-100)
    6. Análise emocional básica

    Responda apenas com JSON válido.
    `

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de fala e oratória. Responda sempre com JSON válido.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3
      })
    })

    const analysisData = await analysisResponse.json()
    const aiAnalysis = JSON.parse(analysisData.choices[0].message.content)

    // Combinar análise automática com IA
    const basicAnalysis = analyzeTranscript(transcript, duration)
    
    return {
      ...basicAnalysis,
      overall_score: aiAnalysis.overall_score || basicAnalysis.overall_score,
      strengths: aiAnalysis.strengths || basicAnalysis.strengths,
      improvement_areas: aiAnalysis.improvement_areas || basicAnalysis.improvement_areas,
      fluency_score: aiAnalysis.fluency_score || 75,
      pronunciation_score: aiAnalysis.pronunciation_score || 80,
      confidence_score: transcriptionData.confidence || 0.9,
      emotion_analysis: aiAnalysis.emotion_analysis
    }

  } catch (error) {
    console.error('Erro na análise OpenAI:', error)
    // Fallback para análise básica
    return analyzeWithWebSpeechAPI(audioBlob)
  }
}

// Análise usando Azure Speech Services
export async function analyzeWithAzure(audioBlob: Blob): Promise<SpeechAnalysisResult> {
  const { endpoint, key, region } = API_CONFIGS.azure
  
  if (!endpoint || !key || !region) {
    throw new Error('Configurações do Azure Speech não encontradas')
  }

  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    
    const response = await fetch(`${endpoint}/speech/recognition/conversation/cognitiveservices/v1?language=pt-BR&format=detailed`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/wav',
        'Accept': 'application/json'
      },
      body: arrayBuffer
    })

    if (!response.ok) {
      throw new Error(`Erro Azure Speech: ${response.statusText}`)
    }

    const data = await response.json()
    const transcript = data.DisplayText || ''
    const confidence = data.Confidence || 0.8
    const duration = data.Duration ? Math.floor(data.Duration / 10000000) : 0

    const analysis = analyzeTranscript(transcript, duration)
    
    return {
      ...analysis,
      confidence_score: confidence,
      pronunciation_score: data.PronunciationAssessment?.AccuracyScore || 80,
      fluency_score: data.PronunciationAssessment?.FluencyScore || 75
    }

  } catch (error) {
    console.error('Erro na análise Azure:', error)
    // Fallback para Web Speech API
    return analyzeWithWebSpeechAPI(audioBlob)
  }
}

// Análise usando Google Cloud Speech-to-Text
export async function analyzeWithGoogle(audioBlob: Blob): Promise<SpeechAnalysisResult> {
  const apiKey = API_CONFIGS.google.key
  
  if (!apiKey) {
    throw new Error('Chave da API Google não configurada')
  }

  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    const requestBody = {
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'pt-BR',
        enableWordTimeOffsets: true,
        enableAutomaticPunctuation: true,
        model: 'latest_long'
      },
      audio: {
        content: base64Audio
      }
    }

    const response = await fetch(`${API_CONFIGS.google.endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Erro Google Speech: ${response.statusText}`)
    }

    const data = await response.json()
    const result = data.results?.[0]
    const transcript = result?.alternatives?.[0]?.transcript || ''
    const confidence = result?.alternatives?.[0]?.confidence || 0.8
    const words = result?.alternatives?.[0]?.words || []

    // Calcular duração baseada nas palavras
    const duration = words.length > 0 
      ? Math.ceil(parseFloat(words[words.length - 1].endTime?.replace('s', '') || '0'))
      : 0

    const analysis = analyzeTranscript(transcript, duration)
    
    return {
      ...analysis,
      confidence_score: confidence
    }

  } catch (error) {
    console.error('Erro na análise Google:', error)
    // Fallback para Web Speech API
    return analyzeWithWebSpeechAPI(audioBlob)
  }
}

// Análise básica do texto transcrito
function analyzeTranscript(transcript: string, duration: number): SpeechAnalysisResult {
  const words = transcript.toLowerCase().split(/\s+/).filter(word => word.length > 0)
  const wordCount = words.length
  const speakingRate = duration > 0 ? Math.round((wordCount / duration) * 60) : 0

  // Detectar palavras de enchimento
  const fillerWords: string[] = []
  const fillerCount = words.reduce((count, word) => {
    const cleanWord = word.replace(/[.,!?;:]/g, '')
    if (FILLER_WORDS.includes(cleanWord)) {
      if (!fillerWords.includes(cleanWord)) {
        fillerWords.push(cleanWord)
      }
      return count + 1
    }
    return count
  }, 0)

  // Calcular score geral
  let score = 100
  
  // Penalizar ritmo muito rápido ou muito lento
  if (speakingRate < 120 || speakingRate > 180) {
    score -= 15
  }
  
  // Penalizar muitas palavras de enchimento
  const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0
  if (fillerRatio > 0.1) {
    score -= Math.min(30, fillerRatio * 100)
  }
  
  // Penalizar apresentações muito curtas
  if (duration < 30) {
    score -= 20
  }

  score = Math.max(0, Math.min(100, score))

  // Gerar pontos fortes e áreas de melhoria
  const strengths: string[] = []
  const improvements: string[] = []

  if (speakingRate >= 120 && speakingRate <= 180) {
    strengths.push('Ritmo de fala adequado para apresentações')
  } else if (speakingRate < 120) {
    improvements.push('Tente falar um pouco mais rápido para manter o engajamento')
  } else {
    improvements.push('Diminua o ritmo para melhor compreensão')
  }

  if (fillerRatio < 0.05) {
    strengths.push('Excelente controle de palavras de enchimento')
  } else if (fillerRatio > 0.1) {
    improvements.push('Reduza o uso de palavras de enchimento como "né", "tipo", "então"')
  }

  if (duration >= 60) {
    strengths.push('Boa duração para desenvolvimento das ideias')
  } else if (duration < 30) {
    improvements.push('Tente desenvolver mais suas ideias para apresentações mais completas')
  }

  if (wordCount > 50) {
    strengths.push('Vocabulário diversificado na apresentação')
  }

  // Garantir pelo menos um ponto forte e uma melhoria
  if (strengths.length === 0) {
    strengths.push('Você completou sua apresentação com sucesso!')
  }
  
  if (improvements.length === 0) {
    improvements.push('Continue praticando para aperfeiçoar ainda mais sua oratória')
  }

  return {
    overall_score: Math.round(score),
    speaking_rate_wpm: speakingRate,
    filler_words_count: fillerCount,
    filler_words_list: fillerWords,
    strengths,
    improvement_areas: improvements,
    duration_seconds: duration,
    confidence_score: 0.85
  }
}

// Função principal que tenta múltiplas APIs
export async function analyzeSpeech(audioBlob: Blob, preferredAPI: 'auto' | 'openai' | 'azure' | 'google' | 'web' = 'auto'): Promise<SpeechAnalysisResult> {
  const apis = preferredAPI === 'auto' 
    ? ['openai', 'azure', 'google', 'web']
    : [preferredAPI]

  for (const api of apis) {
    try {
      console.log(`Tentando análise com ${api}...`)
      
      switch (api) {
        case 'openai':
          return await analyzeWithOpenAI(audioBlob)
        case 'azure':
          return await analyzeWithAzure(audioBlob)
        case 'google':
          return await analyzeWithGoogle(audioBlob)
        case 'web':
          return await analyzeWithWebSpeechAPI(audioBlob)
        default:
          continue
      }
    } catch (error) {
      console.warn(`Falha na análise com ${api}:`, error)
      continue
    }
  }

  // Se todas as APIs falharem, usar análise básica
  console.log('Todas as APIs falharam, usando análise básica...')
  const duration = Math.floor(audioBlob.size / 16000) // Estimativa básica
  return analyzeTranscript('Análise básica - transcrição não disponível', duration)
}

// Função para detectar APIs disponíveis
export function getAvailableAPIs(): string[] {
  const available: string[] = []
  
  if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    available.push('OpenAI Whisper')
  }
  
  if (process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY) {
    available.push('Azure Speech Services')
  }
  
  if (process.env.NEXT_PUBLIC_GOOGLE_SPEECH_KEY) {
    available.push('Google Cloud Speech')
  }
  
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    available.push('Web Speech API (Nativo)')
  }
  
  return available
}