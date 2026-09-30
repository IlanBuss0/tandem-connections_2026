import { HomeButton, HomeCard } from '@/components/professional/home/HomeUi';

/** Paciente abierto que todavía no se pudo resolver: esqueleto mientras carga, tarjeta simple si no existe. */
export default function PatientMissing({ loading, onBack }: { loading: boolean; onBack: () => void }) {
  if (loading) return <div aria-busy="true" aria-label="Cargando paciente" className="space-y-4">
    <div className="h-14 animate-pulse rounded-2xl border border-[#EFE7F9] bg-white" />
    <div className="h-36 animate-pulse rounded-[28px] border border-[#EFE7F9] bg-white" />
    <div className="h-48 animate-pulse rounded-[28px] border border-[#EFE7F9] bg-white" />
  </div>;
  return <HomeCard className="mx-auto max-w-md p-6 text-center">
    <p role="alert" className="text-[14px] font-bold text-[#2B2145]">No encontramos a este paciente.</p>
    <HomeButton primary onClick={onBack} className="mt-4">Volver a pacientes</HomeButton>
  </HomeCard>;
}
