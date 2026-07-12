'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'
import { Moon, Sun, LayoutDashboard, FileText, ShieldCheck, Users } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/shared/logo'

export function Header() {
  const { user, logout, isDemoMode } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Logo size="md" showText={true} />

        <div className="flex items-center space-x-4">
          {isDemoMode && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              🎮 Demo Mode
            </Badge>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{user ? getInitials(user.name) : 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.role === 'ADMIN' && (
                <>
                  <DropdownMenuItem onClick={() => handleNavigate('/dashboards/admin')}>
                    <Users className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/dashboards/executive')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Executive Dashboard
                  </DropdownMenuItem>
                </>
              )}
              {user?.role === 'SUPERVISOR' && (
                <>
                  <DropdownMenuItem onClick={() => handleNavigate('/dashboards/supervisor')}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Supervisor Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/dashboards/executive')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Executive Dashboard
                  </DropdownMenuItem>
                </>
              )}
              {user?.role === 'INSPECTOR' && (
                <DropdownMenuItem onClick={() => handleNavigate('/dashboards/inspector')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Inspector Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
