import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useEffect } from 'react';

const Index = () => {
  const { user, isLoading, signOut } = useAuth();
  const { isSuperAdmin } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 p-8 font-saira">
      <div className="text-center space-y-8">
        <h1 className="text-6xl md:text-8xl font-extrabold text-white tracking-tight">
          ArtisteConnect
        </h1>
        <p className="text-2xl md:text-3xl text-white/90 font-medium">
          Connect with your fans. Share your music. Grow your art.
        </p>
        
        {isLoading ? (
          <p className="text-white">Loading...</p>
        ) : user ? (
          <div className="space-y-4">
            <p className="text-xl text-white">Welcome back, {user.email}!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-orange-500 hover:bg-gray-100 px-10 py-6 text-xl">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
              {isSuperAdmin && (
                <Button asChild size="lg" className="bg-purple-600 text-white hover:bg-purple-700 px-10 py-6 text-xl">
                  <Link to="/admin">Admin Dashboard</Link>
                </Button>
              )}
            </div>
            <Button onClick={signOut} variant="link" className="text-white hover:text-yellow-200">
              Logout
            </Button>
          </div>
        ) : (
          <Button asChild size="lg" className="bg-white text-orange-500 hover:bg-gray-100 px-10 py-6 text-xl">
            <Link to="/auth">Get Started / Login</Link>
          </Button>
        )}
      </div>
      <footer className="absolute bottom-8 text-white/70 text-sm">
        © {new Date().getFullYear()} ArtisteConnect. All rights reserved. (Concept)
      </footer>
    </div>
  );
};

export default Index;
