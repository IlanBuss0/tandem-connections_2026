import { useAuth } from '@/contexts/AuthContext';
import { getTutorById, getProfessionalById, pricingPlans } from '@/data/mockData';
import { User, Mail, Shield, Star, Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserProfile() {
  const { user, logout } = useAuth();
  if (!user || user.role !== 'user') return null;

  const tutor = user.linkedTutorIds?.[0] ? getTutorById(user.linkedTutorIds[0]) : null;
  const professional = user.linkedProfessionalIds?.[0] ? getProfessionalById(user.linkedProfessionalIds[0]) : null;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Mi perfil</h2>
      </div>

      {/* Avatar & info */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm text-center">
        <span className="text-6xl block mb-3">{user.avatar}</span>
        <h3 className="text-xl font-heading font-bold text-foreground">{user.name}</h3>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
        {user.bio && <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>}
        <div className="flex justify-center gap-4 mt-4">
          <div className="text-center">
            <p className="font-bold text-foreground">{user.level}</p>
            <p className="text-xs text-muted-foreground">Nivel</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">{user.points}</p>
            <p className="text-xs text-muted-foreground">Puntos</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">{user.streak}</p>
            <p className="text-xs text-muted-foreground">Racha</p>
          </div>
        </div>
        {user.plan === 'premium' && (
          <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            <Crown size={12} /> Premium
          </div>
        )}
      </div>

      {/* Linked people */}
      <div className="space-y-3">
        <h3 className="font-heading font-semibold text-foreground">Mi red de apoyo</h3>
        {tutor && (
          <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
            <span className="text-3xl">{tutor.avatar}</span>
            <div>
              <p className="font-semibold text-sm text-foreground">{tutor.name}</p>
              <p className="text-xs text-muted-foreground">{tutor.relation}</p>
              <p className="text-xs text-primary">{tutor.phone}</p>
            </div>
          </div>
        )}
        {professional && (
          <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
            <span className="text-3xl">{professional.avatar}</span>
            <div>
              <p className="font-semibold text-sm text-foreground">{professional.name}</p>
              <p className="text-xs text-muted-foreground">{professional.specialty}</p>
              <p className="text-xs text-primary">{professional.modality}</p>
            </div>
          </div>
        )}
      </div>

      {/* Plan */}
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-3">Plan actual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pricingPlans.map(plan => (
            <div key={plan.id} className={`rounded-xl p-5 border ${plan.highlighted ? 'gradient-primary text-primary-foreground border-transparent relative' : 'bg-card border-border'}`}>
              {plan.badge && (
                <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold">{plan.badge}</span>
              )}
              <h4 className="font-heading font-bold text-lg">{plan.name}</h4>
              <p className="text-2xl font-bold mt-1">{plan.price}<span className="text-sm font-normal opacity-70"> {plan.period}</span></p>
              <ul className="mt-4 space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs">
                    <Check size={14} className="shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {plan.highlighted && user.plan === 'premium' ? (
                <p className="mt-4 text-xs font-medium opacity-80">✓ Tu plan actual</p>
              ) : plan.highlighted ? (
                <Button size="sm" variant="outline" className="mt-4 w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Probar gratis 1 mes
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
