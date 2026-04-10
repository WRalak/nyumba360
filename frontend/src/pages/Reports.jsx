import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { RevenueStatsCard, PropertyStatsCard, TenantStatsCard } from '../components/StatsCard';
import Button from '../components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/Card';
import Select from '../components/Select';
import DatePicker from '../components/DatePicker';
import { formatCurrency, formatDate } from '../utils/formatters';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');

  const reportTypes = [
    { value: 'revenue', label: 'Revenue Report', icon: CurrencyDollarIcon },
    { value: 'occupancy', label: 'Occupancy Report', icon: BuildingOfficeIcon },
    { value: 'tenants', label: 'Tenant Report', icon: UserGroupIcon },
    { value: 'expenses', label: 'Expense Report', icon: DocumentTextIcon },
    { value: 'maintenance', label: 'Maintenance Report', icon: ChartBarIcon },
  ];

  const dateRanges = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last 12 Months' },
    { value: 'custom', label: 'Custom Range' },
  ];

  // Mock data for demonstration
  const { data: reportData, isLoading } = useQuery(
    ['reports', selectedReport, dateRange, startDate, endDate, propertyFilter],
    () => Promise.resolve({
      summary: {
        totalRevenue: 1500000,
        totalExpenses: 450000,
        netIncome: 1050000,
        occupancyRate: 85,
        totalProperties: 12,
        totalUnits: 120,
        occupiedUnits: 102,
        totalTenants: 98,
        pendingMaintenance: 8
      },
      data: [
        { month: 'Jan', revenue: 120000, expenses: 35000, occupancy: 82 },
        { month: 'Feb', revenue: 125000, expenses: 38000, occupancy: 85 },
        { month: 'Mar', revenue: 130000, expenses: 40000, occupancy: 88 },
      ]
    }),
    { enabled: !!selectedReport }
  );

  const handleExport = (format) => {
    // Implementation for exporting reports
    console.log(`Exporting ${selectedReport} report in ${format} format`);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedReportType = reportTypes.find(r => r.value === selectedReport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and analyze property management reports</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={!selectedReport}
          >
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={!selectedReport}
          >
            Export Excel
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!selectedReport}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <Select
                options={reportTypes}
                value={selectedReport}
                onChange={setSelectedReport}
                placeholder="Select report type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <Select
                options={dateRanges}
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select date range"
              />
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Start date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="End date"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property
              </label>
              <Select
                options={[
                  { value: '', label: 'All Properties' },
                  { value: '1', label: 'Riverside Apartments' },
                  { value: '2', label: 'Sunset Villas' },
                ]}
                value={propertyFilter}
                onChange={setPropertyFilter}
                placeholder="Filter by property"
              />
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={() => {
              // Refresh report data
            }}>
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {selectedReport && reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevenueStatsCard
              title="Total Revenue"
              value={formatCurrency(reportData.summary.totalRevenue)}
              change="+12.5%"
              changeType="increase"
            />
            <PropertyStatsCard
              title="Occupancy Rate"
              value={`${reportData.summary.occupancyRate}%`}
              change="+2.3%"
              changeType="increase"
            />
            <TenantStatsCard
              title="Active Tenants"
              value={reportData.summary.totalTenants}
              change="+5"
              changeType="increase"
            />
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <DocumentTextIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Maintenance</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{reportData.summary.pendingMaintenance}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Report Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {selectedReportType && <selectedReportType.icon className="h-5 w-5 mr-2" />}
                {selectedReportType ? selectedReportType.label : 'Report Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expenses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Income
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Occupancy
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.data.map((row, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.expenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(row.revenue - row.expenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.occupancy}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedReport && (
        <Card>
          <CardContent className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No report selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a report type and filters to generate a report
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
