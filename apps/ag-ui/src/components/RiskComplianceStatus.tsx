'use client';

export function RiskComplianceStatus() {
  // TODO: Implement actual data fetching from Risk Guardian and Compliance Sentinel
  const riskLevel = 'moderate';
  const complianceStatus = 'compliant';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Risk & Compliance</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">Risk Level</p>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              riskLevel === 'low'
                ? 'bg-green-100 text-green-800'
                : riskLevel === 'moderate'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {riskLevel.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Compliance Status</p>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              complianceStatus === 'compliant'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {complianceStatus.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

