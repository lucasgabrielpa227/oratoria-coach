import { supabase, isSupabaseAvailable } from './supabase'
import type { Database } from './supabase'

type User = Database['public']['Tables']['users']['Row']
type PracticeSession = Database['public']['Tables']['practice_sessions']['Row']
type AIAnalysisResult = Database['public']['Tables']['ai_analysis_results']['Row']
type UserFeedback = Database['public']['Tables']['user_feedback']['Row']

export class DatabaseService {
  // Verificar se Supabase está disponível
  private static checkSupabase() {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase não configurado. Configure suas credenciais em Configurações → Integrações → Supabase')
    }
    return supabase
  }

  // Usuários
  static async createUser(userData: {
    email: string
    name: string
    subscription_tier?: 'free' | 'premium'
  }): Promise<User> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserById(userId: string): Promise<User | null> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) return null
    return data
  }

  static async updateUserStreak(userId: string, streakCount: number): Promise<void> {
    const client = this.checkSupabase()
    const { error } = await client
      .from('users')
      .update({ 
        streak_count: streakCount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) throw error
  }

  static async upgradeUserSubscription(userId: string): Promise<void> {
    const client = this.checkSupabase()
    const { error } = await client
      .from('users')
      .update({ 
        subscription_tier: 'premium',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) throw error
  }

  // Sessões de Prática
  static async createPracticeSession(sessionData: {
    user_id: string
    audio_url?: string
    transcript_text?: string
    duration_seconds: number
  }): Promise<PracticeSession> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('practice_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserPracticeSessions(
    userId: string, 
    limit: number = 10
  ): Promise<PracticeSession[]> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async getPracticeSessionById(sessionId: string): Promise<PracticeSession | null> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('practice_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error) return null
    return data
  }

  // Resultados de Análise IA
  static async saveAnalysisResult(analysisData: {
    session_id: string
    filler_words_count: number
    speaking_rate_wpm: number
    overall_score: number
    strengths: string[]
    improvement_areas: string[]
    filler_words_list: string[]
  }): Promise<AIAnalysisResult> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('ai_analysis_results')
      .insert(analysisData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getAnalysisResult(sessionId: string): Promise<AIAnalysisResult | null> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('ai_analysis_results')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error) return null
    return data
  }

  static async getUserAnalysisHistory(
    userId: string, 
    limit: number = 20
  ): Promise<(AIAnalysisResult & { practice_sessions: PracticeSession })[]> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('ai_analysis_results')
      .select(`
        *,
        practice_sessions!inner(*)
      `)
      .eq('practice_sessions.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // Feedback dos Usuários
  static async saveFeedback(feedbackData: {
    session_id: string
    rating: number
    comments_text?: string
  }): Promise<UserFeedback> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('user_feedback')
      .insert(feedbackData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getFeedbackBySession(sessionId: string): Promise<UserFeedback | null> {
    const client = this.checkSupabase()
    const { data, error } = await client
      .from('user_feedback')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error) return null
    return data
  }

  // Estatísticas e Analytics
  static async getUserStats(userId: string): Promise<{
    totalSessions: number
    averageScore: number
    weeklyUsage: number
    improvementTrend: number
  }> {
    const client = this.checkSupabase()
    
    // Total de sessões
    const { count: totalSessions } = await client
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Score médio
    const { data: analysisData } = await client
      .from('ai_analysis_results')
      .select(`
        overall_score,
        practice_sessions!inner(user_id)
      `)
      .eq('practice_sessions.user_id', userId)

    const averageScore = analysisData?.length 
      ? Math.round(analysisData.reduce((sum, item) => sum + item.overall_score, 0) / analysisData.length)
      : 0

    // Uso semanal (últimos 7 dias)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { count: weeklyUsage } = await client
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString())

    // Tendência de melhoria (últimas 5 vs 5 anteriores)
    const recentScores = analysisData?.slice(0, 5) || []
    const previousScores = analysisData?.slice(5, 10) || []

    const recentAvg = recentScores.length 
      ? recentScores.reduce((sum, item) => sum + item.overall_score, 0) / recentScores.length
      : 0

    const previousAvg = previousScores.length 
      ? previousScores.reduce((sum, item) => sum + item.overall_score, 0) / previousScores.length
      : 0

    const improvementTrend = recentAvg - previousAvg

    return {
      totalSessions: totalSessions || 0,
      averageScore,
      weeklyUsage: weeklyUsage || 0,
      improvementTrend: Math.round(improvementTrend)
    }
  }

  // Verificar limites do plano gratuito
  static async checkFreeUserLimits(userId: string): Promise<{
    weeklyAnalyses: number
    canAnalyze: boolean
  }> {
    const client = this.checkSupabase()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { count: weeklyAnalyses } = await client
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString())

    const FREE_WEEKLY_LIMIT = 3
    const canAnalyze = (weeklyAnalyses || 0) < FREE_WEEKLY_LIMIT

    return {
      weeklyAnalyses: weeklyAnalyses || 0,
      canAnalyze
    }
  }
}