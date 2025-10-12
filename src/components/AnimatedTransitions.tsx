/**
 * Animated Transitions - Animations fluides pour UX premium
 * 
 * Composants wrapper pour ajouter des animations élégantes
 */

import { ReactNode, useEffect, useState } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

/**
 * FadeIn - Apparition en fondu avec translation
 */
export const FadeIn = ({ children, delay = 0, duration = 300, className = '' }: FadeInProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {children}
    </div>
  )
}

/**
 * SlideIn - Glissement depuis la droite
 */
export const SlideIn = ({ children, delay = 0, duration = 300, className = '' }: FadeInProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {children}
    </div>
  )
}

/**
 * ScaleIn - Apparition avec zoom
 */
export const ScaleIn = ({ children, delay = 0, duration = 300, className = '' }: FadeInProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.9)',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {children}
    </div>
  )
}

/**
 * StaggeredList - Liste avec apparition échelonnée
 */
interface StaggeredListProps {
  children: ReactNode[]
  staggerDelay?: number
  className?: string
}

export const StaggeredList = ({ children, staggerDelay = 50, className = '' }: StaggeredListProps) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  )
}

/**
 * Pulse - Animation de pulsation (pour attention)
 */
export const Pulse = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`animate-pulse ${className}`}>
    {children}
  </div>
)

/**
 * Bounce - Animation de rebond
 */
export const Bounce = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`animate-bounce ${className}`}>
    {children}
  </div>
)

/**
 * Spin - Rotation (pour chargement)
 */
export const Spin = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`animate-spin ${className}`}>
    {children}
  </div>
)

/**
 * HoverScale - Scale au survol
 */
export const HoverScale = ({ children, scale = 1.05, className = '' }: { children: ReactNode; scale?: number; className?: string }) => (
  <div 
    className={`transition-transform duration-200 ${className}`}
    style={{
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = `scale(${scale})`
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)'
    }}
  >
    {children}
  </div>
)

/**
 * ProgressBar - Barre de progression animée
 */
interface ProgressBarProps {
  progress: number // 0-100
  className?: string
  showLabel?: boolean
  color?: 'blue' | 'green' | 'purple' | 'red'
}

export const ProgressBar = ({ progress, className = '', showLabel = false, color = 'blue' }: ProgressBarProps) => {
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600'
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        {showLabel && (
          <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}

/**
 * LoadingDots - Points de chargement animés
 */
export const LoadingDots = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center space-x-1 ${className}`}>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
)

/**
 * Shimmer - Effet shimmer (skeleton)
 */
export const Shimmer = ({ className = '', height = 'h-4' }: { className?: string; height?: string }) => (
  <div 
    className={`${height} ${className} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded`}
    style={{
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite'
    }}
  />
)

export default {
  FadeIn,
  SlideIn,
  ScaleIn,
  StaggeredList,
  Pulse,
  Bounce,
  Spin,
  HoverScale,
  ProgressBar,
  LoadingDots,
  Shimmer
}

