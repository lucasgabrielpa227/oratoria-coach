'use client'

import { useState } from 'react'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { Mail, Chrome } from 'lucide-react'

interface AuthProps {
  onAuthSuccess: () => void
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!isSupabaseAvailable() || !supabase) {
        throw new Error('Supabase não configurado. Configure suas credenciais em Configurações → Integrações → Supabase')
      }

      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password: 'temp-password' })
        : await supabase.auth.signInWithOtp({ email })

      if (error) throw error

      alert(isSignUp 
        ? 'Verifique seu email para confirmar a conta!' 
        : 'Link de acesso enviado para seu email!'
      )
    } catch (error) {
      console.error('Erro na autenticação:', error)
      alert('Erro na autenticação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    try {
      if (!isSupabaseAvailable() || !supabase) {
        throw new Error('Supabase não configurado. Configure suas credenciais em Configurações → Integrações → Supabase')
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Erro no login com Google:', error)
      alert('Erro no login com Google. Tente novamente.')
      setIsLoading(false)
    }
  }

  // Se Supabase não estiver configurado, mostrar mensagem
  if (!isSupabaseAvailable()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center px-6">
        <div className="max-w-md mx-auto w-full">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🎤</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">OratóriaFlow</h1>
            <p className="text-gray-600">Seu coach pessoal de comunicação</p>
          </div>

          {/* Configuration Message */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Configuração Necessária
              </h2>
              <p className="text-gray-600 mb-6">
                Para usar a autenticação, conecte sua conta Supabase nas configurações do projeto.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Como configurar:</strong><br />
                  Configurações → Integrações → Supabase
                </p>
              </div>
              <button
                onClick={onAuthSuccess}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Continuar sem Autenticação (Demo)
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center px-6">
      <div className="max-w-md mx-auto w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-3xl">🎤</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">OratóriaFlow</h1>
          <p className="text-gray-600">Seu coach pessoal de comunicação</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </h2>

          {/* Google Auth */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-3 transition-colors mb-4 disabled:opacity-50"
          >
            <Chrome size={20} />
            <span>Continuar com Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Email Auth */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enviando...' : (isSignUp ? 'Criar Conta' : 'Enviar Link de Acesso')}
            </button>
          </form>

          {/* Toggle Sign Up/In */}
          <div className="text-center mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
            </button>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-indigo-600 hover:underline">Termos de Uso</a>
          {' '}e{' '}
          <a href="#" className="text-indigo-600 hover:underline">Política de Privacidade</a>
        </p>
      </div>
    </div>
  )
}