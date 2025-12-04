'use client';

export function EventTimeline() {
  // TODO: Implement actual data fetching from Supabase Realtime
  const events = [
    { id: '1', type: 'ASSET_ONBOARD', timestamp: new Date().toISOString(), message: 'New asset onboarded' },
    { id: '2', type: 'VALUATION_CYCLE', timestamp: new Date().toISOString(), message: 'Quarterly valuation completed' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Event Timeline</h2>
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-medium">{event.type}</p>
              <p className="text-sm text-gray-500">{event.message}</p>
              <p className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

