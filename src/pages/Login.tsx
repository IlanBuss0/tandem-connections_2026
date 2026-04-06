import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { users, tutors, professionals } from '@/data/mockData';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
  const { login, loginAs } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!login(username, password)) {
      setError('Usuario o contraseña incorrectos');
    }
  };

  const demoProfiles = [
    { label: '🧒 Juan (Usuario)', user: users[0] },
    { label: '👩 Laura (Tutora)', user: tutors[0] as any },
    { label: '👩‍⚕️ Lic. Martina (Profesional)', user: professionals[0] as any },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(210 80% 94%), hsl(270 40% 94%), hsl(200 60% 96%))' }}>
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-80 h-80 rounded-full opacity-30" style={{ background: 'hsl(210 70% 80%)' }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20" style={{ background: 'hsl(270 40% 80%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border/50">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <h1 className="text-4xl font-heading font-bold text-gradient mb-1">TÁNDEM</h1>
              <p className="text-muted-foreground text-sm font-medium tracking-wide">Avanzamos juntos</p>
            </motion.div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Usuario o email</label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ej: juan123"
                className="h-11"
              />
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-foreground mb-1 block">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground font-semibold">
              <LogIn size={18} className="mr-2" /> Iniciar sesión
            </Button>
          </form>

          {/* Links */}
          <div className="flex justify-between mt-4 text-sm">
            <button className="text-primary hover:underline">Crear cuenta</button>
            <button className="text-muted-foreground hover:underline">Recuperar contraseña</button>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 border-t border-border pt-4">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
            >
              <Sparkles size={14} />
              {showCredentials ? 'Ocultar' : 'Ver'} credenciales demo
            </button>

            {showCredentials && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 rounded-lg bg-muted/50 text-sm"
              >
                <p className="font-medium text-foreground mb-1">Usuario demo:</p>
                <p className="text-muted-foreground">Usuario: <span className="font-mono text-foreground">juan123</span></p>
                <p className="text-muted-foreground">Contraseña: <span className="font-mono text-foreground">123456</span></p>
              </motion.div>
            )}
          </div>

          {/* Quick demo access */}
          <div className="mt-4 space-y-2">
            <p className="text-xs text-center text-muted-foreground">Acceso rápido a demo</p>
            <div className="flex flex-col gap-2">
              {demoProfiles.map((dp) => (
                <Button
                  key={dp.label}
                  variant="outline"
                  size="sm"
                  onClick={() => loginAs(dp.user)}
                  className="w-full text-sm justify-start"
                >
                  {dp.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          © 2026 TÁNDEM · Avanzamos juntos
        </p>
      </motion.div>
    </div>
  );
}
