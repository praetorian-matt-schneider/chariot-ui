import { Integrations } from '@/sections/overview/Integrations';

interface RiskNotificationsProps {
  riskNotifications: string[];
}

const RiskNotifications: React.FC<RiskNotificationsProps> = ({
  riskNotifications,
}) => {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-header-dark bg-header shadow-md">
      <div className="flex w-full p-8">
        <div className="flex flex-1 flex-col">
          <p className="text-xl font-bold text-white">Risk Notifications</p>
          <p className="text-xs font-normal text-gray-500">
            Your connected channels keep you informed with real-time risk
            alerts.
          </p>
        </div>
        <div>
          <div className="flex flex-col">
            <div className="mt-2 flex items-center justify-center space-x-4">
              {riskNotifications.map(notification => (
                <img
                  key={notification}
                  className="size-10"
                  src={
                    Integrations[notification as keyof typeof Integrations]
                      ?.logo || '/path-to-default-logo.svg'
                  }
                  alt={
                    Integrations[notification as keyof typeof Integrations]
                      ?.name
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskNotifications;
