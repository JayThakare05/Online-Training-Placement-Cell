import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Activity, Users, TrendingUp, AlertCircle, 
  Database, Server, Wifi, Clock 
} from 'lucide-react';

export default function MonitorData() {
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    serverLoad: 0,
    databaseConnections: 0,
    responseTime: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [systemStatus, setSystemStatus] = useState('healthy');

  useEffect(() => {
    // Simulate real-time monitoring
    const interval = setInterval(() => {
      setMetrics({
        activeUsers: Math.floor(Math.random() * 500) + 200,
        serverLoad: Math.floor(Math.random() * 100),
        databaseConnections: Math.floor(Math.random() * 50) + 10,
        responseTime: Math.floor(Math.random() * 200) + 50
      });
    }, 3000);

    // Mock alerts
    setAlerts([
      {
        id: 1,
        type: 'warning',
        message: 'High memory usage detected on server 2',
        time: '2 minutes ago'
      },
      {
        id: 2,
        type: 'info',
        message: 'Database backup completed successfully',
        time: '15 minutes ago'
      }
    ]);

    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ title, value, unit, icon: Icon, color, status }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value}
            <span className="text-lg text-gray-600">{unit}</span>
          </p>
          {status && (
            <p className={`text-sm mt-1 ${
              status === 'good' ? 'text-green-600' : 
              status === 'warning' ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {status === 'good' ? 'Healthy' : 
               status === 'warning' ? 'Warning' : 
               'Critical'}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">Real-time platform performance and health metrics</p>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${
              systemStatus === 'healthy' ? 'bg-green-500' :
              systemStatus === 'warning' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}></div>
            <span className="font-medium text-gray-900">
              System Status: {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
            </span>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers}
            unit=""
            icon={Users}
            color="bg-blue-500"
            status={metrics.activeUsers > 400 ? 'good' : 'warning'}
          />
          <MetricCard
            title="Server Load"
            value={metrics.serverLoad}
            unit="%"
            icon={Server}
            color="bg-purple-500"
            status={metrics.serverLoad < 70 ? 'good' : metrics.serverLoad < 90 ? 'warning' : 'critical'}
          />
          <MetricCard
            title="DB Connections"
            value={metrics.databaseConnections}
            unit=""
            icon={Database}
            color="bg-green-500"
            status="good"
          />
          <MetricCard
            title="Response Time"
            value={metrics.responseTime}
            unit="ms"
            icon={Clock}
            color="bg-orange-500"
            status={metrics.responseTime < 100 ? 'good' : metrics.responseTime < 200 ? 'warning' : 'critical'}
          />
        </div>

        {/* Charts and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart Placeholder */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Chart visualization would go here</p>
                <p className="text-sm text-gray-500">Integration with charting library needed</p>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 py-2 border-t border-gray-200">
              View All Alerts
            </button>
          </div>
        </div>

        {/* Additional Monitoring Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">API Gateway</span>
                <span className="text-sm text-green-600">Healthy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">CDN</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Database</span>
                  <span className="text-gray-900">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '65%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">File Storage</span>
                  <span className="text-gray-900">42%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '42%'}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                Clear Cache
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                Restart Services
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                Export Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
