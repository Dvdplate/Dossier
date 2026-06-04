import { useUpcomingBirthdays } from "../../hooks/useContacts.js";

export function ContactsThisWeek() {
  const { data: upcoming, isLoading } = useUpcomingBirthdays(7);

  if (isLoading) return null;

  if (!upcoming || upcoming.length === 0) {
    return (
      <div className="px-4 py-6">
        <h3 className="hud-label mb-4">Intel: Black Book</h3>
        <p className="text-sm text-ash">No contacts due this week.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h3 className="hud-label mb-4">Intel: Black Book</h3>
      <div className="flex flex-col gap-3">
        {upcoming.map(b => (
          <div key={b.id} className="flex items-center justify-between p-3 bg-midnight border border-gunmetal rounded-lg">
            <div>
              <div className="font-medium text-ash">{b.name}</div>
              {b.note && <div className="text-xs text-ash mt-1">{b.note}</div>}
            </div>
            <div className="text-right">
              <div className="text-sm text-amber font-mono">
                {b.birthMonth}/{b.birthDay}
              </div>
              {b.birthYear && (
                <div className="text-xs text-ash">
                  Age {new Date().getFullYear() - b.birthYear}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
