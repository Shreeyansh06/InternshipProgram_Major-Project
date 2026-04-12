import { Task, State } from './types';

export const TASKS: Task[] = [
  {
    id: 'task_easy_1',
    name: 'Survival Basics',
    description: 'Maintain a single crop cell for 10 steps. Water is plentiful.',
    difficulty: 'easy',
    max_steps: 10,
    config: {
      grid_size: 1,
      initial_water: 100,
      evaporation_multiplier: 1.0,
      weather_volatility: 0.2,
    },
  },
  {
    id: 'task_medium_1',
    name: 'Field Management',
    description: 'Manage a 3x3 grid for 20 steps with moderate weather volatility.',
    difficulty: 'medium',
    max_steps: 20,
    config: {
      grid_size: 3,
      initial_water: 200,
      evaporation_multiplier: 1.2,
      weather_volatility: 0.5,
    },
  },
  {
    id: 'task_hard_1',
    name: 'Drought Crisis',
    description: 'A 5x5 grid, extreme heat, and very limited water. Survive for 50 steps.',
    difficulty: 'hard',
    max_steps: 50,
    config: {
      grid_size: 5,
      initial_water: 150,
      evaporation_multiplier: 1.5,
      weather_volatility: 0.8,
    },
  },
];

export function gradeTask(state: State, task: Task): number {
  if (state.step === 0) return 0;

  const aliveCrops = state.field.filter(c => !c.is_dead).length;
  const totalCrops = state.field.length;
  const survivalRate = aliveCrops / totalCrops;
  
  const avgHealth = state.field.reduce((acc, c) => acc + c.crop_health, 0) / totalCrops;
  
  // Efficiency: water remaining vs initial
  const waterEfficiency = state.water_tank / task.config.initial_water;
  
  // Score components
  const survivalScore = survivalRate * 0.6;
  const healthScore = avgHealth * 0.3;
  const efficiencyScore = waterEfficiency * 0.1;

  const finalScore = survivalScore + healthScore + efficiencyScore;
  
  return Math.max(0, Math.min(1, finalScore));
}
