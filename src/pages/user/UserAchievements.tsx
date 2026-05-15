import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Achievement, fetchAchievementsForUser } from '@/data/api';
import { Lock, Sparkles } from 'lucide-react';

export default function UserAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  useEffect(() => {
    let mounted = true;
    if (!user || user.role !== 'user') return;
    fetchAchievementsForUser(user.id).then(r => mounted && setAchievements(r)).catch(() => mounted && setAchievements([]));
    return () => { mounted = false; };
  }, [user]);
  if (!user || user.role !== 'user') return null;
  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);
  return <div className="space-y-6 pb-20 lg:pb-6">{/* same UI */}
    <div><h2 className="text-2xl font-heading font-bold text-foreground">🏆 Logros</h2><p className="text-muted-foreground text-sm">{unlocked.length} de {achievements.length} desbloqueados</p></div>
    <div className="grid grid-cols-3 gap-3"><div className="bg-card rounded-xl p-4 border border-border text-center"><p className="text-2xl font-bold text-foreground">{user.points}</p><p className="text-xs text-muted-foreground">Puntos</p></div><div className="bg-card rounded-xl p-4 border border-border text-center"><p className="text-2xl font-bold text-foreground">{user.streak}</p><p className="text-xs text-muted-foreground">Días de racha</p></div><div className="bg-card rounded-xl p-4 border border-border text-center"><p className="text-2xl font-bold text-foreground">{user.level}</p><p className="text-xs text-muted-foreground">Nivel</p></div></div>
    <div><h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Sparkles size={16} className="text-amber-500" /> Desbloqueados</h3><div className="grid grid-cols-2 gap-3">{unlocked.map((ach, i) => <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl p-4 border border-amber-200 shadow-sm"><span className="text-3xl block mb-2">{ach.icon}</span><p className="font-semibold text-sm text-foreground">{ach.title}</p><p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p></motion.div>)}</div></div>
    <div><h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><Lock size={16} className="text-muted-foreground" /> Por desbloquear</h3><div className="grid grid-cols-2 gap-3">{locked.map(ach => <div key={ach.id} className="bg-muted/30 rounded-xl p-4 border border-border opacity-70"><span className="text-3xl block mb-2 grayscale">{ach.icon}</span><p className="font-semibold text-sm text-foreground">{ach.title}</p><p className="text-xs text-muted-foreground mt-0.5">{ach.requirement}</p></div>)}</div></div>
  </div>;
}
