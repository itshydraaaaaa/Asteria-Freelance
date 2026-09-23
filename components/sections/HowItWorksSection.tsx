'use client'
import { StepConnector } from '@/components/sections/StepConnector'
import StepModel from '@/components/3d/StepModel'
import { useLanguage } from '@/components/providers/LanguageContext'

export function HowItWorksSection() {
  const { t } = useLanguage()

  const steps = [
    {
      num: '01',
      title: t('step1Title'),
      body: t('step1Body'),
      accent: 'text-ast-primary',
      border: 'border-ast-primary/30',
      badgeLabel: t('step1Badge'),
      variant: 'post' as const,
      reverse: false,
    },
    {
      num: '02',
      title: t('step2Title'),
      body: t('step2Body'),
      accent: 'text-ast-light-contrast',
      border: 'border-ast-light-contrast/30',
      badgeLabel: t('step2Badge'),
      variant: 'match' as const,
      reverse: true,
    },
    {
      num: '03',
      title: t('step3Title'),
      body: t('step3Body'),
      accent: 'text-ast-sky-contrast',
      border: 'border-ast-sky-contrast/30',
      badgeLabel: t('step3Badge'),
      variant: 'deliver' as const,
      reverse: false,
    },
  ]

  return (
    <section id="how-it-works" className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-20">
          <p className="font-mono text-ast-primary text-xs tracking-[0.3em] uppercase mb-3">
            {t('hiwProcess')}
          </p>
          <h2 className="font-heading font-bold text-5xl lg:text-6xl text-black tracking-tight">
            {t('hiwTitle')}
          </h2>
          <p className="text-ast-gray mt-4 max-w-xl mx-auto text-lg">
            {t('hiwSubtitle')}
          </p>
        </div>

        <div className="relative">
          <StepConnector />
          <div className="space-y-24">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex flex-col ${step.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20 rounded-3xl border border-black/5 bg-ast-surface/80 p-8 lg:p-10 shadow-sm`}
              >
                <div className="flex-1">
                  <span className={`font-mono text-sm tracking-[0.28em] ${step.accent} mb-3 block`}>
                    {t('stepLabel')} {step.num}
                  </span>
                  <h3 className="font-heading font-bold text-3xl lg:text-4xl text-black mb-4">{step.title}</h3>
                  <p className="text-ast-gray text-lg leading-relaxed max-w-md">{step.body}</p>
                  <div className={`mt-6 inline-flex items-center gap-2 border ${step.border} rounded-full px-4 py-2`}> 
                    <span className={`w-2 h-2 rounded-full ${step.accent.replace('text-', 'bg-')} animate-pulse`} />
                    <span className={`font-mono text-xs ${step.accent}`}>
                      {step.badgeLabel}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex justify-center">
                  <div className="w-72 h-72 lg:w-80 lg:h-80 rounded-3xl bg-white p-4 shadow-inner">
                    <StepModel variant={step.variant} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
