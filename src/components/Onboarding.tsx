'use client'

import { useState } from 'react'
import { ChevronRight, Mic, BarChart3, Trophy, Sparkles } from 'lucide-react'

interface OnboardingProps {
  onComplete: () => void
}

const onboardingSteps = [
  {
    icon: Mic,
    title: 'Grave Sua Voz',
    description: 'Fale naturalmente sobre qualquer tema. Nossa IA analisa sua comunicação em tempo real.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: BarChart3,
    title: 'Análise Inteligente',
    description: 'Receba feedback detalhado sobre ritmo, clareza, palavras de enchimento e muito mais.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Trophy,
    title: 'Evolua Diariamente',
    description: 'Acompanhe seu progresso, mantenha sequências e desbloqueie novos níveis de comunicação.',
    color: 'from-orange-500 to-red-500'
  }
]

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const currentStepData = onboardingSteps[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Skip Button */}
      <div className="flex justify-end p-6">
        <button
          onClick={handleSkip}
          className="text-gray-500 hover:text-gray-700 font-medium"
        >
          Pular
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-20">
        <div className="max-w-md mx-auto w-full text-center">
          {/* Icon */}
          <div className={`w-24 h-24 bg-gradient-to-r ${currentStepData.color} rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl`}>
            <currentStepData.icon className="text-white" size={40} />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {currentStepData.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 leading-relaxed mb-12">
            {currentStepData.description}
          </p>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mb-12">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-indigo-600 scale-125'
                    : index < currentStep
                    ? 'bg-indigo-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span>{currentStep === onboardingSteps.length - 1 ? 'Começar' : 'Próximo'}</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Brand Footer */}
      <div className="text-center pb-8">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <Sparkles size={16} />
          <span className="text-sm font-medium">OratóriaFlow</span>
        </div>
      </div>
    </div>
  )
}