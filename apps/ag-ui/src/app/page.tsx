import { AssetOverview } from '@/components/AssetOverview';
import { EventTimeline } from '@/components/EventTimeline';
import { RiskComplianceStatus } from '@/components/RiskComplianceStatus';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Evergreen Dragon OS</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AssetOverview />
          </div>
          <div>
            <RiskComplianceStatus />
          </div>
        </div>

        <div className="mt-8">
          <EventTimeline />
        </div>
      </div>
    </main>
  );
}

