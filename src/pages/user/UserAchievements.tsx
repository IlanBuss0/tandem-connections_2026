import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Award, CheckCircle2, Flame, Loader2, Lock, Sparkles, Star, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Achievement, AchievementDashboard, fetchAchievementDashboardForUser } from '@/data/api';

function parseProgress(requirement: string): { current: number; target: number } | null {
  const match = requirement.match(/^(\d+)\/(\d+)/);
  if (!match) return null;
  return {
    current: Number(match[1]),
    target: Number(match[2]),
  };
}

function progressPercent(achievement: Achievement) {
  if (achievement.unlocked) return 100;
  const progress = parseProgress(achievement.requirement);
  if (!progress || progress.target === 0) return 0;
  return Math.min(100, Math.round((progress.current / progress.target) * 100));
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#f0e8f8] bg-white p-4 shadow-lg">
      <div className="flex items-center gap-2 text-xs text-[#8b7aa0]">
        <Icon size={15} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-[#6b4c9a]">{value}</p>
    </div>
  );
}

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const percent = progressPercent(achievement);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-2xl border p-4 shadow-lg ${
        achievement.unlocked
          ? 'border-amber-200 bg-white'
          : 'border-[#f0e8f8] bg-[#faf8ff] opacity-90'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`text-3xl ${achievement.unlocked ? '' : 'grayscale'}`}>{achievement.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm text-[#4a4a5a]">{achievement.title}</p>
              <p className="mt-0.5 text-xs text-[#8b7aa0]">{achievement.description}</p>
            </div>
            {achievement.unlocked ? (
              <CheckCircle2 size={17} className="shrink-0 text-green-600" />
            ) : (
              <Lock size={16} className="shrink-0 text-[#8b7aa0]" />
            )}
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[#8b7aa0]">
                {achievement.unlocked ? achievement.unlockedDate || 'Desbloqueado' : achievement.requirement}
              </span>
              <span className="text-[11px] font-semibold text-[#6b4c9a]">{percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#f0e8f8]">
              <div
                className={`h-2 rounded-full ${achievement.unlocked ? 'bg-amber-500' : 'bg-[#6b4c9a]'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="rounded-full bg-[#f5f0ff] px-2 py-1 capitalize text-[#8b7aa0]">{achievement.category}</span>
            <span className="font-semibold text-[#6b4c9a]">+{achievement.points} pts</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function UserAchievements() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<AchievementDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user || user.role !== 'user') return;
    setLoading(true);
    setError(null);

    try {
      setDashboard(await fetchAchievementDashboardForUser(user.id));
    } catch {
      setDashboard(null);
      setError('No se pudieron cargar los logros desde el backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const achievements = dashboard?.achievements || [];
  const unlocked = achievements.filter((achievement) => achievement.unlocked);
  const locked = achievements.filter((achievement) => !achievement.unlocked);

  const nextAchievements = useMemo(() => {
    return [...locked]
      .sort((a, b) => progressPercent(b) - progressPercent(a))
      .slice(0, 3);
  }, [locked]);

  if (!user || user.role !== 'user') return null;

  return (
    <div className="pb-24 lg:pb-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">Logros</h2>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">
            {unlocked.length} de {achievements.length} desbloqueados con datos del backend.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && !dashboard && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#f0e8f8] bg-white p-4 text-sm text-[#8b7aa0] shadow-lg">
          <Loader2 size={16} className="animate-spin" />
          Cargando logros...
        </div>
      )}

      {dashboard && (
        <>
          <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={Star} label="Puntos" value={dashboard.stats.points} />
            <StatCard icon={Trophy} label="Nivel" value={dashboard.stats.level} />
            <StatCard icon={CheckCircle2} label="Completadas" value={dashboard.stats.completedActivities} />
            <StatCard icon={Award} label="Asignadas" value={dashboard.stats.assignedActivities} />
            <StatCard icon={Flame} label="Dias emocionales" value={dashboard.stats.emotionDays} />
            <StatCard icon={Sparkles} label="XP avatar" value={dashboard.stats.avatarExperience} />
          </section>

          {nextAchievements.length > 0 && (
            <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 sm:p-5 shadow-lg">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#6b4c9a]">
                <Sparkles size={16} className="text-[#6b4c9a]" />
                Mas cerca de desbloquear
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                {nextAchievements.map((achievement, index) => (
                  <AchievementCard key={achievement.id} achievement={achievement} index={index} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#6b4c9a]">
              <Trophy size={16} className="text-amber-500" />
              Desbloqueados
            </h3>
            {unlocked.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {unlocked.map((achievement, index) => (
                  <AchievementCard key={achievement.id} achievement={achievement} index={index} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-6 py-14 text-center text-sm text-[#8b7aa0] shadow-sm">
                Todavia no hay logros desbloqueados.
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#6b4c9a]">
              <Lock size={16} className="text-[#8b7aa0]" />
              Por desbloquear
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {locked.map((achievement, index) => (
                <AchievementCard key={achievement.id} achievement={achievement} index={index} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
