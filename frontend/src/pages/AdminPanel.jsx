import React, { useState, useEffect } from 'react';
import { employeeService, planService, reportService } from '../services/api';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Upload, 
  CheckSquare, 
  AlertCircle, 
  Check, 
  Sparkles,
  ClipboardList
} from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('employees'); // 'employees', 'plans', 'reports'
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Employee form state
  const [empForm, setEmpForm] = useState({ id: null, name: '', email: '', department: '', designation: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Morning Plan state
  const [planForm, setPlanForm] = useState({ employee_id: '', date: new Date().toISOString().split('T')[0], raw_tasks: '' });
  const [parsedTasks, setParsedTasks] = useState([]);
  const [planSuccess, setPlanSuccess] = useState('');
  const [planError, setPlanError] = useState('');

  // Evening Report state
  const [reportForm, setReportForm] = useState({ employee_id: '', date: new Date().toISOString().split('T')[0], raw_completed: '', raw_pending: '', remarks: '' });
  const [morningPlanFound, setMorningPlanFound] = useState(false);
  const [morningPlanTasks, setMorningPlanTasks] = useState([]);
  const [checkedCompletedTasks, setCheckedCompletedTasks] = useState({});
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- EMPLOYEE MANAGEMENT ---
  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!empForm.name || !empForm.email || !empForm.department || !empForm.designation) {
      setFormError('All fields are required.');
      return;
    }

    try {
      if (isEditing) {
        await employeeService.update(empForm.id, empForm);
        setFormSuccess('Employee details updated successfully!');
      } else {
        await employeeService.create(empForm);
        setFormSuccess('New employee added successfully!');
      }
      setEmpForm({ id: null, name: '', email: '', department: '', designation: '' });
      setIsEditing(false);
      fetchEmployees();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'An error occurred. Check your inputs.');
    }
  };

  const handleEditEmp = (emp) => {
    setEmpForm(emp);
    setIsEditing(true);
    setFormError('');
    setFormSuccess('');
  };

  const handleDeleteEmp = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee? All their historical reports and productivity records will be permanently removed.')) {
      return;
    }
    try {
      await employeeService.delete(id);
      fetchEmployees();
    } catch (err) {
      alert('Failed to delete employee.');
    }
  };

  // --- MORNING PLAN UPLOADER ---
  // Simple smart parser for WhatsApp/Telegram lists
  const handleRawTasksChange = (e) => {
    const text = e.target.value;
    setPlanForm(prev => ({ ...prev, raw_tasks: text }));
    
    // Parse tasks: split by newlines, trim, remove bullet symbols
    const lines = text.split('\n');
    const tasks = lines
      .map(line => {
        // Remove common bullet symbols: *, -, •, numbers like 1., 1)
        return line
          .replace(/^[\s*\-•\d\.\)\u2022]+/g, '')
          .trim();
      })
      .filter(line => line.length > 0);
      
    setParsedTasks(tasks);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setPlanError('');
    setPlanSuccess('');

    if (!planForm.employee_id || parsedTasks.length === 0) {
      setPlanError('Please select an employee and input today\'s tasks.');
      return;
    }

    try {
      await planService.upload(planForm.employee_id, planForm.date, parsedTasks);
      setPlanSuccess('Morning plan uploaded and productivity statistics initialized!');
      setPlanForm(prev => ({ ...prev, raw_tasks: '' }));
      setParsedTasks([]);
    } catch (err) {
      setPlanError(err.response?.data?.detail || 'Failed to upload plan.');
    }
  };

  // --- EVENING REPORT UPLOADER ---
  // Fetch morning plan if exists for selected employee and date
  const checkMorningPlan = async (employeeId, dateStr) => {
    if (!employeeId || !dateStr) return;
    try {
      const plan = await planService.get(employeeId, dateStr);
      if (plan && plan.planned_tasks.length > 0) {
        setMorningPlanFound(true);
        setMorningPlanTasks(plan.planned_tasks);
        // Default checklist: all unchecked
        const initialChecks = {};
        plan.planned_tasks.forEach(task => {
          initialChecks[task] = false;
        });
        setCheckedCompletedTasks(initialChecks);
      } else {
        setMorningPlanFound(false);
        setMorningPlanTasks([]);
      }
    } catch (err) {
      setMorningPlanFound(false);
    }
  };

  useEffect(() => {
    checkMorningPlan(reportForm.employee_id, reportForm.date);
  }, [reportForm.employee_id, reportForm.date]);

  const handleCheckboxChange = (task) => {
    setCheckedCompletedTasks(prev => ({
      ...prev,
      [task]: !prev[task]
    }));
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportError('');
    setReportSuccess('');

    if (!reportForm.employee_id) {
      setReportError('Please select an employee.');
      return;
    }

    let completed = [];
    let pending = [];

    if (morningPlanFound) {
      // Collect based on checkboxes
      morningPlanTasks.forEach(task => {
        if (checkedCompletedTasks[task]) {
          completed.push(task);
        } else {
          pending.push(task);
        }
      });
    } else {
      // Manual parse of completed and pending textareas
      completed = reportForm.raw_completed.split('\n')
        .map(t => t.replace(/^[\s*\-•\d\.\)\u2022]+/g, '').trim())
        .filter(t => t.length > 0);
      pending = reportForm.raw_pending.split('\n')
        .map(t => t.replace(/^[\s*\-•\d\.\)\u2022]+/g, '').trim())
        .filter(t => t.length > 0);
    }

    if (completed.length === 0 && pending.length === 0) {
      setReportError('Please log at least one completed or pending task.');
      return;
    }

    try {
      await reportService.upload(
        reportForm.employee_id, 
        reportForm.date, 
        completed, 
        pending, 
        reportForm.remarks
      );
      setReportSuccess('Evening report logged. Productivity calculations generated successfully!');
      
      // Reset form fields
      setReportForm(prev => ({ ...prev, raw_completed: '', raw_pending: '', remarks: '' }));
      setMorningPlanFound(false);
      setMorningPlanTasks([]);
    } catch (err) {
      setReportError(err.response?.data?.detail || 'Failed to submit evening report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Control Panel</h1>
        <p className="text-slate-500 text-sm">Configure core employee directories, seed task plans, and finalize work reports.</p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'employees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={16} /> Employee Directory
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'plans' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload size={16} /> Upload Morning Plan
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckSquare size={16} /> Upload Evening Report
        </button>
      </div>

      {/* TAB 1: EMPLOYEE MANAGEMENT */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
              <Plus size={18} className="text-blue-600" />
              {isEditing ? 'Edit Employee Details' : 'Add New Employee'}
            </h3>
            
            {formError && (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded text-xs mb-4">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 p-2.5 rounded text-xs mb-4">
                <Check size={14} className="shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEmpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={empForm.name}
                  onChange={(e) => setEmpForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={empForm.email}
                  onChange={(e) => setEmpForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. john@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department</label>
                <input
                  type="text"
                  value={empForm.department}
                  onChange={(e) => setEmpForm(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. Engineering, Marketing"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Designation</label>
                <input
                  type="text"
                  value={empForm.designation}
                  onChange={(e) => setEmpForm(prev => ({ ...prev, designation: e.target.value }))}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEmpForm({ id: null, name: '', email: '', department: '', designation: '' });
                    }}
                    className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  {isEditing ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>

          {/* Directory Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100"><h3 className="font-semibold text-slate-700">Employees List</h3></div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span></div>
              ) : employees.length === 0 ? (
                <div className="text-center py-20 text-slate-400 italic">No employees seeded yet.</div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase text-xs">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Designation</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 leading-tight">{emp.name}</p>
                          <span className="text-xs text-slate-400">{emp.email}</span>
                        </td>
                        <td className="px-6 py-4">{emp.department}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">{emp.designation}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleEditEmp(emp)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Employee"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmp(emp.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Employee"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MORNING PLAN UPLOADER */}
      {activeTab === 'plans' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ClipboardList size={18} className="text-blue-600" />
              Upload Today's Morning Tasks
            </h3>
            <p className="text-xs text-slate-400 mt-1">Paste WhatsApp/Telegram list messages directly. Our parser will split them into separate records automatically.</p>
          </div>

          {planError && (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded text-xs">
              <AlertCircle size={14} className="shrink-0" />
              <span>{planError}</span>
            </div>
          )}
          {planSuccess && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 p-2.5 rounded text-xs">
              <Check size={14} className="shrink-0" />
              <span>{planSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePlanSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Employee</label>
                <select
                  value={planForm.employee_id}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, employee_id: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700 transition-colors"
                  required
                >
                  <option value="">Choose Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Plan Date</label>
                <input
                  type="date"
                  value={planForm.date}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Paste Planned Tasks
              </label>
              <textarea
                value={planForm.raw_tasks}
                onChange={handleRawTasksChange}
                placeholder="Example:&#10;* Design Homepage&#10;- Fix Login Bug&#10;1. Update Database Schema"
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 font-mono transition-colors"
                required
              />
            </div>

            {/* Smart Live Preview Box */}
            {parsedTasks.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Sparkles size={14} className="text-amber-500" />
                  Smart Parsed Preview ({parsedTasks.length} tasks)
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-600 font-medium">
                  {parsedTasks.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={16} /> Save Morning Plan
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: EVENING REPORT UPLOADER */}
      {activeTab === 'reports' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-semibold text-slate-700 flex items-center gap-1.5">
              <CheckSquare size={18} className="text-blue-600" />
              Upload End-of-Day Work Report
            </h3>
            <p className="text-xs text-slate-400 mt-1">If a morning plan is found, the tasks will load as a checklist. Checking a task marks it Completed; unchecked tasks automatically become Pending.</p>
          </div>

          {reportError && (
            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded text-xs">
              <AlertCircle size={14} className="shrink-0" />
              <span>{reportError}</span>
            </div>
          )}
          {reportSuccess && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 p-2.5 rounded text-xs">
              <Check size={14} className="shrink-0" />
              <span>{reportSuccess}</span>
            </div>
          )}

          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Employee</label>
                <select
                  value={reportForm.employee_id}
                  onChange={(e) => setReportForm(prev => ({ ...prev, employee_id: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700 transition-colors"
                  required
                >
                  <option value="">Choose Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Report Date</label>
                <input
                  type="date"
                  value={reportForm.date}
                  onChange={(e) => setReportForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-700 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Checklist or text area input */}
            {morningPlanFound ? (
              <div className="bg-blue-50/55 border border-blue-100 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500 animate-pulse" />
                  Morning Plan Loaded Checklist
                </h4>
                <p className="text-xs text-slate-500 mb-2">Check the tasks the employee completed today:</p>
                <div className="space-y-2">
                  {morningPlanTasks.map((task) => (
                    <label key={task} className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200/80 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={!!checkedCompletedTasks[task]}
                        onChange={() => handleCheckboxChange(task)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4.5 h-4.5"
                      />
                      <span className={`text-xs font-medium text-slate-700 ${checkedCompletedTasks[task] ? 'line-through text-slate-400' : ''}`}>
                        {task}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-lg text-xs flex gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">No morning plan found for this date. </span>
                    Please fill out the Completed and Pending tasks manually below.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Completed Tasks (one per line)</label>
                  <textarea
                    value={reportForm.raw_completed}
                    onChange={(e) => setReportForm(prev => ({ ...prev, raw_completed: e.target.value }))}
                    placeholder="e.g.&#10;Design Homepage&#10;Fix Login Bug"
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Pending Tasks (one per line)</label>
                  <textarea
                    value={reportForm.raw_pending}
                    onChange={(e) => setReportForm(prev => ({ ...prev, raw_pending: e.target.value }))}
                    placeholder="e.g.&#10;Update Database Schema"
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Remarks / Review comments</label>
              <textarea
                value={reportForm.remarks}
                onChange={(e) => setReportForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Optional remarks about blockers, achievements, or review notes..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <CheckSquare size={16} /> Submit Evening Report
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
