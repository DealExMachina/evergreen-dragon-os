'use client';

export function AssetOverview() {
  // TODO: Implement actual data fetching from Supabase
  const assets = [
    { id: '1', name: 'Asset 1', nav: 1000000, status: 'active' },
    { id: '2', name: 'Asset 2', nav: 2000000, status: 'active' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Asset Overview</h2>
      <div className="space-y-4">
        {assets.map((asset) => (
          <div key={asset.id} className="border-b pb-4 last:border-b-0">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{asset.name}</h3>
                <p className="text-sm text-gray-500">ID: {asset.id}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${asset.nav.toLocaleString()}</p>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                  {asset.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

