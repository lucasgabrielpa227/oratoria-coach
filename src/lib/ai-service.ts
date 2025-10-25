// Serviços para integração com APIs de IA
export class AIService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1'
  
  // Transcrição de áudio usando Whisper
  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')

    try {
      const response = await fetch(`${this.OPENAI_API_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Erro na transcrição: ${response.statusText}`)
      }

      const data = await response.json()
      return data.text
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error)
      throw new Error('Falha na transcrição do áudio')
    }
  }

  // Análise de fala usando GPT-4o
  static async analyzeSpeech(transcript: string, durationSeconds: number): Promise<AnalysisResult> {
    const wordsCount = transcript.split(' ').length
    const speakingRateWpm = Math.round((wordsCount / durationSeconds) * 60)

    const prompt = `Analise esta transcrição de fala em português e retorne um JSON com:
- filler_words_count: número total de palavras de enchimento
- filler_words_list: array das palavras encontradas (máximo 10 mais frequentes)
- strengths: array com 2 pontos fortes específicos
- improvement_areas: array com 2 áreas para melhorar específicas
- overall_score: 0-100 baseado na qualidade geral da fala

Considere:
- Palavras de enchimento comuns: 'ahn', 'é', 'tipo', 'então', 'né', 'tá', 'assim', 'meio', 'sei lá', 'tipo assim'
- Clareza, coerência, fluência
- Estrutura do discurso
- Vocabulário utilizado

Transcrição (${wordsCount} palavras em ${durationSeconds}s): "${transcript}"

Responda APENAS com JSON válido:`

    try {
      const response = await fetch(`${this.OPENAI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em análise de comunicação e oratória. Retorne sempre JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro na análise: ${response.statusText}`)
      }

      const data = await response.json()
      const analysisText = data.choices[0].message.content

      // Parse do JSON retornado pela IA
      const analysis = JSON.parse(analysisText)

      return {
        overall_score: analysis.overall_score,
        speaking_rate_wpm: speakingRateWpm,
        filler_words_count: analysis.filler_words_count,
        filler_words_list: analysis.filler_words_list,
        strengths: analysis.strengths,
        improvement_areas: analysis.improvement_areas,
        duration_seconds: durationSeconds
      }
    } catch (error) {
      console.error('Erro ao analisar fala:', error)
      
      // Fallback com análise básica
      return this.generateFallbackAnalysis(transcript, durationSeconds, speakingRateWpm)
    }
  }

  // Análise de fallback caso a IA falhe
  private static generateFallbackAnalysis(
    transcript: string, 
    durationSeconds: number, 
    speakingRateWpm: number
  ): AnalysisResult {
    const fillerWords = ['ahn', 'é', 'tipo', 'então', 'né', 'tá', 'assim']
    const foundFillers = fillerWords.filter(word => 
      transcript.toLowerCase().includes(word)
    )
    
    const fillerCount = foundFillers.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      return count + (transcript.match(regex) || []).length
    }, 0)

    let score = 70 // Base score
    if (speakingRateWpm >= 120 && speakingRateWpm <= 180) score += 10
    if (fillerCount < 5) score += 10
    if (transcript.length > 100) score += 5
    score = Math.min(score, 100)

    return {
      overall_score: score,
      speaking_rate_wpm: speakingRateWpm,
      filler_words_count: fillerCount,
      filler_words_list: foundFillers.slice(0, 5),
      strengths: [
        speakingRateWpm >= 120 && speakingRateWpm <= 180 
          ? "Ritmo de fala adequado" 
          : "Conteúdo bem estruturado",
        transcript.length > 100 
          ? "Boa elaboração das ideias" 
          : "Comunicação direta e objetiva"
      ],
      improvement_areas: [
        fillerCount > 5 
          ? "Reduzir palavras de enchimento" 
          : "Trabalhar pausas estratégicas",
        speakingRateWpm < 120 
          ? "Aumentar velocidade da fala" 
          : speakingRateWpm > 180 
          ? "Diminuir velocidade da fala" 
          : "Melhorar entonação"
      ],
      duration_seconds: durationSeconds
    }
  }

  // Processar áudio completo (transcrição + análise)
  static async processAudio(audioBlob: Blob, durationSeconds: number): Promise<AnalysisResult> {
    try {
      // 1. Transcrever áudio
      const transcript = await this.transcribeAudio(audioBlob)
      
      // 2. Analisar transcrição
      const analysis = await this.analyzeSpeech(transcript, durationSeconds)
      
      return analysis
    } catch (error) {
      console.error('Erro no processamento completo:', error)
      throw new Error('Falha no processamento do áudio')
    }
  }
}

export interface AnalysisResult {
  overall_score: number
  speaking_rate_wpm: number
  filler_words_count: number
  filler_words_list: string[]
  strengths: string[]
  improvement_areas: string[]
  duration_seconds: number
}