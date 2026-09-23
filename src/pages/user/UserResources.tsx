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

  return <div className="pb-24 lg:pb-6 space-y-6">
    <div><h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight flex items-center gap-3"><BookOpen size={22} className="text-[#6b4c9a]" /> Recursos</h2><p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">Tips, guías y estrategias para el día a día</p></div>
    <div className="space-y-3">{resources.map((res, i) => <motion.div key={res.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`p-4 sm:p-5 rounded-3xl shadow-lg border ${catColors[res.category] || 'bg-white border-[#f0e8f8]'}`}><div className="flex items-start gap-3"><span className="text-2xl">{res.emoji}</span><div className="flex-1"><p className="font-semibold text-sm text-[#4a4a5a]">{res.title}</p><p className="text-xs text-[#8b7aa0] mt-1">{res.description}</p><div className="flex items-center gap-2 mt-2"><span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f0ff] text-[#8b7aa0] border border-[#ede4f8]">{res.category}</span><span className="text-[10px] text-[#8b7aa0] flex items-center gap-1"><Clock size={10} /> {res.readTime}</span></div></div></div></motion.div>)}</div>
  </div>;
}
