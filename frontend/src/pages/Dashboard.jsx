import React, { useState, useEffect } from 'react';
import { 
  analyticsService, 
} from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { 
  Users, CheckCircle2, AlertCircle, TrendingUp, Calendar, Trophy, Sparkles 
} from 'lucide-react';

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    total_employees: 0,
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    average_productivity: 0
  });
  
  const [performers, setPerformers] = useState({ daily: null, weekly: null, monthly: null });
  const [employeeProductivity, setEmployeeProductivity] = useState([]);
  const [dailyPerformance, setDailyPerformance] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        statsData, 
        performersData, 
        empProdData, 
        dailyData, 
        weeklyData, 
        monthlyData
      ] = await Promise.all([
        analyticsService.getDashboardStats(selectedDate),
        analyticsService.getPerformers(),
        analyticsService.getEmployeeProductivity(),
        analyticsService.getDailyPerformance(),
        analyticsService.getWeeklyTrend(),
        analyticsService.getMonthlyTrend()
      ]);

      setStats(statsData);
      setPerformers(performersData);
      setEmployeeProductivity(empProdData);
      setDailyPerformance(dailyData);
      setWeeklyTrend(weeklyData);
      setMonthlyTrend(monthlyData);

      // Generate AI Summary
      generateAiSummary(statsData, performersData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const generateAiSummary = (currentStats, currentPerformers) => {
    const { total_employees, total_tasks, completed_tasks, pending_tasks, average_productivity } = currentStats;
    const topEmp = currentPerformers?.daily || currentPerformers?.weekly || currentPerformers?.monthly;
    
    if (total_tasks === 0) {
      setAiSummary("No tasks uploaded for the selected date. System is waiting for morning plan entries.");
      return;
    }

    let summaryText = `Today's team productivity is averaged at ${average_productivity}%. Out of the ${total_tasks} planned tasks, the team successfully completed ${completed_tasks} tasks, leaving ${pending_tasks} pending.`;

    if (topEmp) {
      summaryText += ` ${topEmp.name} from the ${topEmp.department} department is the top performer with an average completion percentage of ${topEmp.rating}%.`;
    }

    if (average_productivity >= 85) {
      summaryText += " Outstanding performance by the team today! Keep up the momentum.";
    } else if (average_productivity >= 70) {
      summaryText += " Solid progress overall. Minor blockages noticed in pending items.";
    } else {
      summaryText += " Productivity is below target today. Team leads might want to inspect blockers on pending tasks.";
    }

    setAiSummary(summaryText);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Team Productivity Dashboard</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Real-time completion monitoring and historical performance trends.</p>
        </div>
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 sm:hidden">Select Date:</span>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="outline-none border-none text-slate-700 font-semibold text-sm bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Employees</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.total_employees}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg"><Calendar size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Tasks</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.total_tasks}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle2 size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Completed</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.completed_tasks}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><AlertCircle size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pending</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.pending_tasks}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-900/10 text-blue-900 rounded-lg"><TrendingUp size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Avg Productivity</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-0.5">{stats.average_productivity}%</h3>
          </div>
        </div>
      </div>

      {/* AI Summary Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-4 sm:p-6 shadow-lg border border-blue-900 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
          <Sparkles size={180} />
        </div>
        <div className="p-3 bg-white/10 rounded-xl shrink-0">
          <Sparkles size={24} className="text-amber-400" />
        </div>
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-blue-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            Smart AI Productivity Summary
          </h4>
          <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-100">{aiSummary}</p>
        </div>
      </div>

      {/* Top Performers Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Daily Top Performer */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 text-amber-500 opacity-20"><Trophy size={48} /></div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Daily Performer</h4>
          {performers.daily ? (
            <div>
              <p className="text-lg font-bold text-slate-800 leading-snug">{performers.daily.name}</p>
              <p className="text-xs text-slate-500">{performers.daily.department}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                Score: {performers.daily.rating}%
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic">No data yet for today.</p>
          )}
        </div>

        {/* Weekly Top Performer */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 text-slate-400 opacity-20"><Trophy size={48} /></div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Weekly Performer</h4>
          {performers.weekly ? (
            <div>
              <p className="text-lg font-bold text-slate-800 leading-snug">{performers.weekly.name}</p>
              <p className="text-xs text-slate-500">{performers.weekly.department}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">
                Score: {performers.weekly.rating}%
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic">No weekly logs.</p>
          )}
        </div>

        {/* Monthly Top Performer */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 text-yellow-600 opacity-20"><Trophy size={48} /></div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Monthly Performer</h4>
          {performers.monthly ? (
            <div>
              <p className="text-lg font-bold text-slate-800 leading-snug">{performers.monthly.name}</p>
              <p className="text-xs text-slate-500">{performers.monthly.department}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                Score: {performers.monthly.rating}%
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic">No monthly logs.</p>
          )}
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity by Employee */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold text-slate-700 mb-4">Top 10 Employees Productivity (Last 30 Days)</h4>
          <div className="h-64 sm:h-72 lg:h-80 w-full">
            {employeeProductivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeProductivity} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(val) => [`${val}%`, 'Productivity']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="productivity" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">No data available</div>
            )}
          </div>
        </div>

        {/* Daily Team Performance */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold text-slate-700 mb-4">Daily Performance Trend (Last 15 Days)</h4>
          <div className="h-64 sm:h-72 lg:h-80 w-full">
            {dailyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyPerformance} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(val) => [`${val}%`, 'Avg Productivity']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="productivity" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorProd)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold text-slate-700 mb-4">Weekly Performance Trend</h4>
          <div className="h-64 sm:h-72 lg:h-80 w-full">
            {weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(val) => [`${val}%`, 'Avg Productivity']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="productivity" stroke="#1e3a8a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">No data available</div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold text-slate-700 mb-4">Monthly Productivity Trend</h4>
          <div className="h-64 sm:h-72 lg:h-80 w-full">
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(val) => [`${val}%`, 'Avg Productivity']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="productivity" fill="#475569" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
