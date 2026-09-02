import { MessageCircle, Stethoscope, Trophy } from 'lucide-react';

type Props = { level: number; points: number; onNavigate?: (tab: string) => void };

const cards = [
  { title: 'Mis apoyos', action: 'Ver profesionales', tab: 'professional-directory', icon: Stethoscope },
  { title: 'Comunicador', action: 'Abrir', tab: 'communicator', icon: MessageCircle },
] as const;

export default function BelongingHomeSecondaryAccess({ level, points, onNavigate }: Props) {
  return (
    <section className="mt-6 lg:hidden" aria-labelledby="secondary-access-title">
      <h2 id="secondary-access-title" className="mb-3 text-lg font-bold text-[#2e2344]">Más para mí</h2>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <article className="min-w-[74%] snap-start rounded-3xl border border-[#e9def5] bg-white p-4 sm:min-w-[45%]">
          <Trophy className="text-amber-500" aria-hidden /><h3 className="mt-2 font-bold text-[#3f2c55]">Mi progreso</h3><p className="text-sm text-[#756a82]">Nivel {level} · {points} puntos</p><button onClick={() => onNavigate?.('achievements')} className="mt-3 min-h-11 text-sm font-bold text-[#6b3faf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">Ver mis logros</button>
        </article>
        {cards.map(card => <article key={card.tab} className="min-w-[74%] snap-start rounded-3xl border border-[#e9def5] bg-white p-4 sm:min-w-[45%]"><card.icon className="text-[#7650a2]" aria-hidden /><h3 className="mt-2 font-bold text-[#3f2c55]">{card.title}</h3><p className="text-sm text-[#756a82]">Acceso rápido</p><button onClick={() => onNavigate?.(card.tab)} className="mt-3 min-h-11 text-sm font-bold text-[#6b3faf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">{card.action}</button></article>)}
      </div>
    </section>
  );
}