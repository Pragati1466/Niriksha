'use client'

import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  textClassName?: string
  variant?: 'light' | 'dark'
}

export function Logo({ className = '', size = 'md', showText = true, textClassName = '', variant = 'dark' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900 dark:text-white'
  const subTextColor = variant === 'light' ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'

  const imageSize = {
    sm: 32,
    md: 40,
    lg: 48
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden flex items-center justify-center shadow-lg bg-white`}>
        <Image 
          src="/logo.png" 
          alt="Niriksha Logo" 
          width={imageSize[size]}
          height={imageSize[size]}
          className="object-contain p-1"
          priority
        />
      </div>
      {showText && (
        <div>
          <h1 className={`${textSizeClasses[size]} font-bold ${textColor} ${textClassName}`}>
            NIRIKSHA
          </h1>
          <p className={`text-xs ${subTextColor} hidden sm:block`}>
            Government Inspection Platform
          </p>
        </div>
      )}
    </div>
  )
}
