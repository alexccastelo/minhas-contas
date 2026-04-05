export function SectionTitle({
  title,
  count,
  icon,
  accentColor = "text-gray-400",
}: {
  title: string;
  count: number;
  icon: string;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <span className="text-base">{icon}</span>
      <h2 className={`text-sm font-semibold ${accentColor}`}>{title}</h2>
      <span className="ml-auto rounded-full bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-400">
        {count}
      </span>
    </div>
  );
}
