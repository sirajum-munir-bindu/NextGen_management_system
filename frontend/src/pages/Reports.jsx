import React, { useState, useEffect } from 'react';
import { analyticsService, employeeService } from '../services/api';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  Award, 
  AlertTriangle, 
  UserCheck, 
  ShieldAlert 
} from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    employee_id: '',
    department: '',
    rating: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchReports();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const fetchReports = async (activeFilters = filters) => {
    setLoading(true);
    try {
      // API call with active filters
      const cleanFilters = {};
      Object.keys(activeFilters).forEach(key => {
        if (activeFilters[key]) {
          cleanFilters[key] = activeFilters[key];
        }
      });
      const data = await analyticsService.getReportsList(cleanFilters);
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleClearFilters = () => {
    const cleared = {
      start_date: '',
      end_date: '',
      employee_id: '',
      department: '',
      rating: ''
    };
    setFilters(cleared);
    fetchReports(cleared);
  };

  const getRatingBadge = (rating) => {
    switch (rating) {
      case 'Excellent':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded">
            Excellent
          </span>
        );
      case 'Good':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
            Good
          </span>
        );
      case 'Average':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded">
            Average
          </span>
        );
      case 'Needs Improvement':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs font-semibold px-2 py-0.5 rounded">
            Needs Improvement
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2 py-0.5 rounded">
            {rating}
          </span>
        );
    }
  };

  const getCleanFilterParams = () => {
    const clean = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        clean[key] = filters[key];
      }
    });
    return clean;
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Export Center & Productivity Reports</h1>
          <p className="text-slate-500 text-sm">Download high-quality CSV, Excel, or PDF reports based on custom filters.</p>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={analyticsService.getExportUrl('csv', getCleanFilterParams())}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Download size={16} />
            Export CSV
          </a>
          <a
            href={analyticsService.getExportUrl('excel', getCleanFilterParams())}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-emerald-700 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </a>
          <a
            href={analyticsService.getExportUrl('pdf', getCleanFilterParams())}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all"
          >
            <FileText size={16} />
            Export PDF
          </a>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4">Report Filters</h3>
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Employee</label>
            <select
              name="employee_id"
              value={filters.employee_id}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700 transition-colors"
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Department</label>
            <input
              type="text"
              name="department"
              placeholder="e.g. Design, Frontend"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Rating</label>
            <select
              name="rating"
              value={filters.rating}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700 transition-colors"
            >
              <option value="">All Ratings</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Needs Improvement">Needs Improvement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">End Date</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700 transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="lg:col-span-5 flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Reports Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Productivity Records</h3>
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            Total Rows: {reports.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20 text-slate-400 italic">
              No productivity records found matching the filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Employee Name</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Designation</th>
                  <th className="px-6 py-3.5 text-center">Planned</th>
                  <th className="px-6 py-3.5 text-center">Completed</th>
                  <th className="px-6 py-3.5 text-center">Pending</th>
                  <th className="px-6 py-3.5 text-center">Completion %</th>
                  <th className="px-6 py-3.5 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {reports.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-500">{row.date}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{row.employee_name}</td>
                    <td className="px-6 py-4">{row.department}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{row.designation}</td>
                    <td className="px-6 py-4 text-center font-medium">{row.planned_tasks.length}</td>
                    <td className="px-6 py-4 text-center font-medium text-emerald-600">{row.completed_tasks.length}</td>
                    <td className="px-6 py-4 text-center font-medium text-amber-600">{row.pending_tasks.length}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{row.completion_percentage}%</td>
                    <td className="px-6 py-4 text-center">{getRatingBadge(row.performance_rating)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
