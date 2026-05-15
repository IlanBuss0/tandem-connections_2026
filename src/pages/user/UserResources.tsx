import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchResourcesForUser, Resource } from '@/data/api';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Clock } from 'lucide-react';

export default function UserResources() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    fetchResourcesForUser(user.id).then(r => mounted && setResources(r)).catch(() => mounted && setResources([]));
    return () => { mounted = false; };
  }, [user]);

  const catColors: Record<string, string> = {
    familias: 'bg-pink-50 border-pink-200', estrategias: 'bg-blue-50 border-blue-200', educativo: 'bg-amber-50 border-amber-200', bienestar: 'bg-green-50 border-green-200',
  };

  return <div className="space-y-4 pb-20 lg:pb-6">{/* unchanged UI */}
    <div><h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2"><BookOpen size={22} className="text-primary" /> Recursos</h2><p className="text-muted-foreground text-sm">Tips, guías y estrategias para el día a día</p></div>
    <div className="space-y-3">{resources.map((res, i) => <motion.div key={res.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`p-4 rounded-xl border ${catColors[res.category] || 'bg-card border-border'}`}><div className="flex items-start gap-3"><span className="text-2xl">{res.emoji}</span><div className="flex-1"><p className="font-semibold text-sm text-foreground">{res.title}</p><p className="text-xs text-muted-foreground mt-1">{res.description}</p><div className="flex items-center gap-2 mt-2"><span className="text-[10px] px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground border border-border/50">{res.category}</span><span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {res.readTime}</span></div></div></div></motion.div>)}</div>
  </div>;
}
