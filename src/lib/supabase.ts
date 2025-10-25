'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseAvailable = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabase)
}

// Tipos para o banco de dados
export interface Recording {
  id: string
  user_id: string
  title: string
  audio_url: string
  duration: number
  analysis_result: any
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string
  subscription_tier: 'free' | 'premium'
  streak_count: number
  created_at: string
  updated_at: string
}

// Funções utilitárias
export const saveRecording = async (audioBlob: Blob, title: string, analysisResult: any) => {
  if (!isSupabaseAvailable() || !supabase) {
    throw new Error('Supabase não configurado')
  }

  try {
    // Upload do arquivo de áudio
    const fileName = `recording_${Date.now()}.wav`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(fileName, audioBlob)

    if (uploadError) throw uploadError

    // Obter URL público do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('recordings')
      .getPublicUrl(fileName)

    // Salvar registro no banco
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('recordings')
      .insert({
        user_id: user.user.id,
        title,
        audio_url: publicUrl,
        duration: Math.round(audioBlob.size / 1000), // Estimativa baseada no tamanho
        analysis_result: analysisResult
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao salvar gravação:', error)
    throw error
  }
}

export const getUserRecordings = async () => {
  if (!isSupabaseAvailable() || !supabase) {
    return []
  }

  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return []

    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar gravações:', error)
    return []
  }
}