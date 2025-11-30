'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Ticket, User, LogOut, LayoutDashboard, Settings, CreditCard } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin';
      case 'moderator':
        return '/moderator';
      case 'organizer':
        return '/organizer';
      case 'attendee':
        return '/dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Ticket className="h-6 w-6" />
            <span className="text-xl font-bold">Runtown</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/events">
              <Button variant="ghost">Browse Events</Button>
            </Link>

            {user ? (
              <>
                <Link href={getDashboardLink()}>
                  <Button variant="ghost">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground capitalize">
                          {user.role}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'attendee' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/my-tickets">
                            <Ticket className="mr-2 h-4 w-4" />
                            My Tickets
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/transactions">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Transactions
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.role === 'organizer' && (
                      <DropdownMenuItem asChild>
                        <Link href="/organizer/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
