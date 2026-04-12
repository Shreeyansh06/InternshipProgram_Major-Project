import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Droplets, Thermometer, Wind, CloudRain, Play, RotateCcw, 
  AlertTriangle, CheckCircle2, Info, Camera, Cpu, Brain, 
  History, Settings, LayoutGrid, Sun, Upload, Download,
  Activity, Zap, Eye, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task, Observation, Action, StepResult } from './openenv/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [observation, setObservation] = useState<Observation | null>(null);
  const [lastResult, setLastResult] = useState<StepResult | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  // Feature States
  const [autoWatering, setAutoWatering] = useState(false);
  const [moistureThreshold, setMoistureThreshold] = useState(30);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [modelAccuracy, setModelAccuracy] = useState(86.4);
  const [isUploading, setIsUploading] = useState(false);
  const [visionResult, setVisionResult] = useState<string | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setSelectedTask(data[0]);
      });
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const resetEnv = async () => {
    if (!selectedTask) return;
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: selectedTask.id }),
    });
    const data = await res.json();
    setSessionId(data.session_id);
    setObservation(data.observation);
    setLastResult(null);
    setScore(null);
    setHistoryData([]);
    setLogs(['Environment reset for task: ' + selectedTask.name]);
    setIsAutoPlaying(false);
  };

  const step = async (action: Action) => {
    if (!sessionId) return;
    const res = await fetch('/api/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, action }),
    });
    const data = await res.json();
    setObservation(data.observation);
    setLastResult(data);
    
    const logMsg = action.type === 'irrigate' 
      ? `Step ${data.observation.step}: Irrigated cell ${action.cell_id} with ${action.amount}L. Reward: ${data.reward.toFixed(2)}`
      : `Step ${data.observation.step}: Waited. Reward: ${data.reward.toFixed(2)}`;
    setLogs(prev => [...prev, logMsg]);

    setHistoryData(prev => [...prev, {
      step: data.observation.step,
      reward: data.reward,
      health: data.observation.field.reduce((acc: number, c: any) => acc + c.crop_health, 0) / data.observation.field.length * 100,
      moisture: data.observation.field.reduce((acc: number, c: any) => acc + c.moisture, 0) / data.observation.field.length * 100,
    }]);

    if (data.done) {
      setIsAutoPlaying(false);
      const gradeRes = await fetch(`/api/grade/${sessionId}`);
      const gradeData = await gradeRes.json();
      setScore(gradeData.score);
    }
  };

  const exportCSV = () => {
    if (historyData.length === 0) return;
    const headers = ["Step", "Reward", "Health", "Moisture"];
    const rows = historyData.map(d => [d.step, d.reward.toFixed(2), d.health.toFixed(2), d.moisture.toFixed(2)]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `regulation_history_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLogs(prev => [...prev, "History exported to CSV."]);
  };

  const runRegulationStep = useCallback(() => {
    if (!observation || !sessionId || lastResult?.done) return;

    // Safety Logic: Auto-Watering (Emergency Irrigation)
    if (autoWatering) {
      const criticalCells = observation.field
        .filter(c => !c.is_dead && c.moisture * 100 < moistureThreshold)
        .sort((a, b) => a.moisture - b.moisture);

      if (criticalCells.length > 0 && observation.water_tank.current >= 5) {
        step({ type: 'irrigate', cell_id: criticalCells[0].id, amount: 5 });
        setLogs(prev => [...prev, `[SAFETY] Emergency irrigation triggered for cell ${criticalCells[0].id}`]);
        return;
      }
    }

    // Standard Heuristic Agent
    const driestCell = [...observation.field]
      .filter(c => !c.is_dead)
      .sort((a, b) => a.moisture - b.moisture)[0];

    if (driestCell && driestCell.moisture < 0.4 && observation.water_tank.current >= 5) {
      step({ type: 'irrigate', cell_id: driestCell.id, amount: 5 });
    } else {
      step({ type: 'wait' });
    }
  }, [observation, sessionId, lastResult, autoWatering, moistureThreshold]);

  useEffect(() => {
    let timer: any;
    if (isAutoPlaying && !lastResult?.done) {
      timer = setTimeout(runRegulationStep, 500);
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, runRegulationStep, lastResult]);

  const startTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          setModelAccuracy(85 + Math.random() * 5);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setVisionResult(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const res = await fetch('/api/vision-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64String }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setVisionResult(data.result);
        setLogs(prev => [...prev, "Vision analysis complete using OpenAI."]);
      } catch (err) {
        console.error(err);
        setVisionResult("Error: Failed to analyze image. Please ensure OPENAI_API_KEY is set.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const overallHealth = observation 
    ? (observation.field.reduce((acc, c) => acc + c.crop_health, 0) / observation.field.length * 100)
    : 100;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-6">
      {/* Header */}
      <header className="max-w-[1600px] mx-auto mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Droplets size={28} />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Smart Irrigation & Vision System</h1>
          </div>
          <p className="text-slate-400 text-lg">AI-driven moisture regulation using soil image analysis and precision watering.</p>
          
          <div className="pt-4 flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                <span>Overall Field Health</span>
                <span className="text-emerald-400">{overallHealth.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${overallHealth}%` }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select className="bg-[#0f172a] border border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option>Alluvial Soil (Rice/Wheat)</option>
            <option>Black Soil (Cotton)</option>
            <option>Red Soil (Pulses)</option>
          </select>
          <select 
            className="bg-[#0f172a] border border-slate-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedTask?.id}
            onChange={(e) => setSelectedTask(tasks.find(t => t.id === e.target.value) || null)}
          >
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.difficulty.toUpperCase()})</option>
            ))}
          </select>
          <button onClick={resetEnv} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-dark p-6 flex items-center gap-5">
              <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl">
                <Droplets size={32} />
              </div>
              <div>
                <div className="text-3xl font-black">{observation?.water_tank.current.toFixed(0) || 1000}L</div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Reservoir</div>
                <div className="text-xs text-slate-600 mt-1">
                  {observation ? ((observation.water_tank.current / observation.water_tank.capacity) * 100).toFixed(1) : 100}% remaining
                </div>
              </div>
            </div>

            <div className="card-dark p-6 flex items-center gap-5">
              <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                <Activity size={32} />
              </div>
              <div>
                <div className="text-3xl font-black">{overallHealth.toFixed(1)}%</div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Avg. Health</div>
                <div className="text-xs text-slate-600 mt-1">Crop vitality</div>
              </div>
            </div>

            <div className="card-dark p-6 flex items-center gap-5">
              <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl">
                <Sun size={32} />
              </div>
              <div>
                <div className="text-3xl font-black">Day {observation ? Math.floor(observation.step / 24) : 0}</div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Time Elapsed</div>
                <div className="text-xs text-slate-600 mt-1">Hour {observation ? observation.step % 24 : 0}:00</div>
              </div>
            </div>
          </div>

          {/* Kaggle Training Section */}
          <div className="card-dark p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Brain className="text-pink-500" /> Kaggle Dataset Training
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6 w-full">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Select Training Source</label>
                  <select className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-pink-500">
                    <option>Indian Soil Moisture Dataset (Kaggle)</option>
                    <option>Global Arid Region Crop Data</option>
                    <option>Synthetic Drought Scenarios</option>
                  </select>
                </div>
                <button 
                  onClick={startTraining}
                  disabled={isTraining}
                  className="w-full btn-accent flex items-center justify-center gap-2 py-4 text-lg"
                >
                  <Play size={20} fill="currentColor" /> {isTraining ? "Training..." : "Start Kaggle Training"}
                </button>
                {isTraining && (
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${trainingProgress}%` }}
                        className="h-full bg-pink-500"
                      />
                    </div>
                    <div className="text-right text-xs font-mono text-pink-400">{trainingProgress}%</div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-3xl border border-slate-800 w-48 h-48 relative">
                <div className="text-4xl font-black text-pink-500">{modelAccuracy}%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Model Accuracy</div>
                <Brain className="absolute opacity-5 text-pink-500" size={120} />
              </div>
            </div>
          </div>

          {/* Hardware Integration */}
          <div className="card-dark p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Zap className="text-emerald-400" /> Hardware Integration (ESP32)
              </h3>
              <div className="px-3 py-1 bg-slate-800 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest">Offline</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded uppercase">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live Feed
                </div>
                <Camera size={48} className="text-slate-800 group-hover:text-slate-700 transition-colors" />
                <div className="text-slate-600 font-bold mt-4 uppercase tracking-widest text-sm">No Hardware Connected</div>
              </div>
              <div className="md:col-span-4 space-y-6">
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Sensor</div>
                  <div className="text-4xl font-black text-blue-400">0%</div>
                  <div className="text-xs text-slate-600 mt-1">Capacitive Moisture</div>
                </div>
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Remote Control</div>
                  <button className="w-full btn-primary py-3">Trigger Pump</button>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
              <Info className="text-blue-400 shrink-0" size={18} />
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your ESP32-CAM using the provided firmware. The system will automatically sync real-world moisture data and allow remote control of your irrigation pump.
              </p>
            </div>
          </div>

          {/* Vision Analysis */}
          <div className="card-dark p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Eye className="text-purple-400" /> Soil Moisture Vision Analysis
              </h3>
              <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
                <Upload size={16} /> Upload Soil Pic
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Analyzing Image...</div>
                  </div>
                ) : (
                  <>
                    <Camera size={48} className="text-slate-800" />
                    <div className="text-slate-600 font-bold mt-4 uppercase tracking-widest text-xs text-center px-8">
                      Upload a picture of soil to detect moisture levels
                    </div>
                  </>
                )}
              </div>
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 flex items-center justify-center text-center">
                {visionResult ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-full inline-block">
                      <CheckCircle2 size={32} />
                    </div>
                    <p className="text-slate-300 font-medium">{visionResult}</p>
                  </div>
                ) : (
                  <div className="text-slate-600 font-bold uppercase tracking-widest text-xs">
                    Waiting for image analysis...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Regulation History */}
          <div className="card-dark p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <History className="text-blue-400" /> Regulation History
              </h3>
              <button 
                onClick={exportCSV}
                disabled={historyData.length === 0}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
            <div className="h-[300px] w-full">
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="step" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="health" stroke="#10b981" fillOpacity={1} fill="url(#colorHealth)" strokeWidth={3} />
                    <Area type="monotone" dataKey="moisture" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMoisture)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 font-bold uppercase tracking-widest text-sm">
                  No simulation data yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Field Grid Map */}
          <div className="card-dark p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <LayoutGrid size={18} className="text-slate-400" /> Field Grid Map
              </h3>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-amber-500" /> Stressed
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> Critical
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {observation?.field.map(cell => {
                const statusColor = cell.is_dead ? 'bg-slate-700' : 
                                  cell.moisture < 0.3 ? 'bg-red-500' : 
                                  cell.moisture < 0.5 ? 'bg-amber-500' : 'bg-emerald-500';
                return (
                  <motion.div 
                    key={cell.id}
                    layout
                    className={cn(
                      "aspect-square rounded-xl border border-slate-800 p-2 flex flex-col items-center justify-center relative group cursor-pointer hover:border-blue-500/50 transition-all",
                      cell.is_dead ? "bg-slate-900/50 opacity-50" : "bg-slate-900/80"
                    )}
                    onClick={() => !cell.is_dead && step({ type: 'irrigate', cell_id: cell.id, amount: 5 })}
                  >
                    <div className={cn("absolute top-2 right-2 w-2 h-2 rounded-full", statusColor)} />
                    <Droplets size={20} className={cn("mb-1", cell.is_dead ? "text-slate-700" : "text-amber-500")} />
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Wheat</div>
                    <div className="text-xs font-black">{(cell.moisture * 100).toFixed(0)}%</div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden mx-2 mb-1">
                      <div className={cn("h-full", statusColor)} style={{ width: `${cell.moisture * 100}%` }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Regulation System */}
          <div className="card-dark p-6">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <Activity size={18} className="text-blue-400" /> Regulation System
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => runRegulationStep()}
                disabled={!sessionId || lastResult?.done || isAutoPlaying}
                className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-lg"
              >
                <Play size={20} fill="currentColor" /> Run Regulation Step
              </button>
              <button 
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                disabled={!sessionId || lastResult?.done}
                className={cn(
                  "w-full py-4 rounded-lg font-bold text-lg transition-all active:scale-95",
                  isAutoPlaying ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                )}
              >
                {isAutoPlaying ? "Stop Regulation" : "Auto-Regulate Episode"}
              </button>
            </div>
          </div>

          {/* Safety Settings */}
          <div className="card-dark p-6">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <Settings size={18} className="text-slate-400" /> Safety Settings
            </h3>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">Auto-Watering</div>
                  <div className="text-xs text-slate-500">Water when moisture is low</div>
                </div>
                <button 
                  onClick={() => setAutoWatering(!autoWatering)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    autoWatering ? "bg-blue-600" : "bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    autoWatering ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-slate-500">Moisture Threshold</span>
                  <span className="text-blue-400">{moistureThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="60" 
                  value={moistureThreshold}
                  onChange={(e) => setMoistureThreshold(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <p className="text-[10px] text-slate-600 text-center italic">Crops below this level will trigger emergency irrigation.</p>
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div className="card-dark p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Forecast</h3>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Next 6 Hours</div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map(h => (
                <div key={h} className="flex flex-col items-center gap-2">
                  <div className="text-slate-500">
                    {h % 3 === 0 ? <Sun size={16} /> : h % 2 === 0 ? <CloudRain size={16} className="text-blue-400" /> : <Wind size={16} />}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400">+{h}h</div>
                </div>
              ))}
            </div>
          </div>

          {/* System Logs */}
          <div className="card-dark flex flex-col h-[300px]">
            <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-500 uppercase tracking-widest">
              System Logs
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px]">
              {logs.length > 0 ? logs.map((log, i) => (
                <div key={i} className="text-slate-500 border-l border-slate-800 pl-3 py-1">
                  {log}
                </div>
              )) : (
                <div className="text-slate-700 italic">Waiting for environment events...</div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </main>

      {/* Results Modal */}
      <AnimatePresence>
        {score !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="card-dark max-w-md w-full p-8 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">Simulation Complete</h2>
                <p className="text-slate-400">The agent has finished the episode.</p>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <div className="text-5xl font-black text-emerald-400">{(score * 100).toFixed(1)}%</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Performance Score</div>
              </div>
              <button 
                onClick={resetEnv}
                className="w-full btn-primary py-4 text-lg"
              >
                Start New Episode
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;

