import React from 'react'
import { Card, CardContent } from './Card'
import { cn } from '../../lib/utils'

const StatCard = ({ title, value, icon: Icon, trend, trendValue, className, variant = 'default' }) => {
  const variants = {
    default: '',
    success: '',
    warning: '',
    danger: '',
  }

  return (
    <Card className={cn(variants[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <p className={cn(
                'text-sm mt-2',
                trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-muted-foreground'
              )}>
                {trendValue}
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default StatCard
