import React, { useState, useEffect } from 'react';
import { employeeService, analyticsService } from '../services/api';
import { Search, ShieldAlert, Award, AlertTriangle, UserCheck, Calendar } from 'lucide-react';

const EmployeePerformance = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
      // Extract unique departments for filtering
      const deptList = [...new Set(data.map(emp => emp.department))];
      setDepartments(deptList);
      
      // Auto select first employee if available
      if (data.length > 0) {
        handleSelectEmployee(data[0]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = async (employee) => {
    setSelectedEmployee(employee);
    setDetailsLoading(true);
    try {
      // Get productivity reports filtered by this employee
      const history = await analyticsService.getReportsList({ employee_id: employee.id });
      setEmployeeHistory(history);
      // On mobile/tablet, smooth scroll to employee details section after selection
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          const el = document.getElementById('employee-details');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching employee history:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === '' || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const getRatingBadge = (rating) => {
    switch (rating) {
      case 'Excellent':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-md">
            <Award size={14} /> Excellent
          </span>
        );
      case 'Good':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-md">
            <UserCheck size={14} /> Good
          </span>
        );
      case 'Average':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-md">
            <AlertTriangle size={14} /> Average
          </span>
        );
      case 'Needs Improvement':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-1 rounded-md">
            <ShieldAlert size={14} /> Needs Improvement
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md">
            {rating}
          </span>
        );
    }
  };

  // Calculate overall performance summary
  const calculateOverallStats = () => {
    if (employeeHistory.length === 0) return { avg: 0, rating: 'No Data', total: 0 };
    const sum = employeeHistory.reduce((acc, curr) => acc + curr.completion_percentage, 0);
    const avg = Math.round(sum / employeeHistory.length);
    
    let rating = 'Needs Improvement';
    if (avg >= 90) rating = 'Excellent';
    else if (avg >= 75) rating = 'Good';
    else if (avg >= 50) rating = 'Average';

    return { avg, rating, total: employeeHistory.length };
  };

  const overallStats = calculateOverallStats();

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Employee Performance Tracker</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Review detailed task completions, performance history, and average rankings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Directory and Filters */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-80 sm:max-h-96 lg:max-h-none lg:h-[75vh]">
          <h3 className="font-semibold text-slate-700 mb-3 sm:mb-4 text-sm sm:text-base">Team Directory</h3>
          
          {/* Search and Filters */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2 text-sm outline-none transition-colors"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Directory List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="flex justify-center py-10"><span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></span></div>
            ) : filteredEmployees.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10 italic">No employees found.</p>
            ) : (
              filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                    selectedEmployee?.id === emp.id
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{emp.name}</h4>
                    <p className="text-xs text-slate-500">{emp.designation}</p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    {emp.department}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Performance Breakdown */}
        <div id="employee-details" className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm min-h-[50vh] lg:min-h-[75vh] flex flex-col scroll-mt-20">
          {selectedEmployee ? (
            <div className="flex-1 flex flex-col">
              {/* Employee Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">{selectedEmployee.name}</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{selectedEmployee.designation} &bull; {selectedEmployee.department}</p>
                  <p className="text-xs text-slate-400 mt-1">{selectedEmployee.email}</p>
                </div>

                {/* Overall performance indicators */}
                <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">
                  <div className="bg-blue-900/5 p-3 sm:p-4 rounded-xl text-center min-w-[80px] sm:min-w-[90px] border border-blue-900/5">
                    <span className="block text-xl sm:text-2xl font-black text-blue-950">{overallStats.avg}%</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Avg Score</span>
                  </div>
                  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl text-center min-w-[110px] sm:min-w-[130px] border border-slate-100">
                    <span className="block font-bold mt-1 sm:mt-1.5">{getRatingBadge(overallStats.rating)}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1 block">Rating</span>
                  </div>
                </div>
              </div>

              {/* Tasks History Table */}
              <div className="flex-1 flex flex-col mt-6">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
                  <Calendar size={18} className="text-slate-400" />
                  Task Tracking & Productivity Logs
                </h3>

                <div className="flex-1 overflow-x-auto">
                  {detailsLoading ? (
                    <div className="flex justify-center py-20"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span></div>
                  ) : employeeHistory.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 italic">
                      No plans or evening reports uploaded for this employee yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employeeHistory.map((day) => (
                        <div key={day.date} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                          {/* Date and Performance Score Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                            <span className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
                              <Calendar size={16} className="text-blue-600" />
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="text-xs text-slate-500">
                                Completion: <span className="font-bold text-slate-800">{day.completion_percentage}%</span>
                              </div>
                              {getRatingBadge(day.performance_rating)}
                            </div>
                          </div>

                          {/* Task List Compare Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                            {/* Planned Tasks */}
                            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 break-words">
                              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 text-indigo-900">Planned Tasks</h4>
                              {day.planned_tasks.length > 0 ? (
                                <ul className="space-y-1.5 list-disc list-inside text-slate-600 text-xs">
                                  {day.planned_tasks.map((task, idx) => (
                                    <li key={idx} className="break-words">{task}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-slate-400 text-xs italic">No planning logged.</p>
                              )}
                            </div>

                            {/* Completed & Pending */}
                            <div className="bg-emerald-50/20 p-3.5 rounded-lg border border-emerald-100/50 break-words">
                              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 text-emerald-900">Completed & Pending</h4>
                              
                              <div className="space-y-3">
                                {/* Completed */}
                                {day.completed_tasks.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Completed</p>
                                    <ul className="space-y-1 text-slate-600 text-xs list-disc list-inside">
                                      {day.completed_tasks.map((task, idx) => (
                                        <li key={idx} className="line-through text-slate-400 break-words">{task}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Pending */}
                                {day.pending_tasks.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Pending</p>
                                    <ul className="space-y-1 text-slate-600 text-xs list-disc list-inside">
                                      {day.pending_tasks.map((task, idx) => (
                                        <li key={idx} className="text-slate-700 font-medium break-words">{task}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {day.completed_tasks.length === 0 && day.pending_tasks.length === 0 && (
                                  <p className="text-slate-400 text-xs italic">No report submitted.</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Remarks */}
                          {day.remarks && (
                            <div className="mt-3 text-xs bg-slate-100/50 border border-slate-100 p-2.5 rounded text-slate-600">
                              <strong className="text-slate-700">Remarks: </strong> {day.remarks}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic py-20">
              Select an employee from the directory to view performance analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeePerformance;
