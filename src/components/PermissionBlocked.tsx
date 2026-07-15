import { Lock } from "lucide-react";

export default function PermissionBlocked({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Lock size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}
