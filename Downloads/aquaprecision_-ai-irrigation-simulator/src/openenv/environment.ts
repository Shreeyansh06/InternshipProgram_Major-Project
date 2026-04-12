import seedrandom from 'seedrandom';
import { Action, Observation, StepResult, State, FieldCell, Weather, Task } from './types';

export class IrrigationEnv {
  private state!: State;
  private task!: Task;
  private rng!: seedrandom.PRNG;

  constructor() {}

  public reset(task: Task, seed?: string): Observation {
    this.task = task;
    this.rng = seedrandom(seed || Math.random().toString());
    const gridSize = task.config.grid_size;
    
    const field: FieldCell[] = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      field.push({
        id: i,
        moisture: 0.5 + this.rng() * 0.2,
        crop_health: 1.0,
        crop_type: 'Wheat',
        is_dead: false,
      });
    }

    this.state = {
      task_id: task.id,
      step: 0,
      field,
      water_tank: task.config.initial_water,
      weather: this.generateWeather(),
      history: [],
    };

    return this.getObservation();
  }

  public step(action: Action): StepResult {
    if (this.state.step >= this.task.max_steps) {
      return {
        observation: this.getObservation(),
        reward: 0,
        done: true,
        info: { message: 'Max steps reached' },
      };
    }

    this.state.step++;

    // 1. Process Action
    let waterUsed = 0;
    if (action.type === 'irrigate') {
      const cell = this.state.field.find(c => c.id === action.cell_id);
      if (cell && !cell.is_dead && this.state.water_tank >= action.amount) {
        cell.moisture = Math.min(1.0, cell.moisture + action.amount * 0.1);
        this.state.water_tank -= action.amount;
        waterUsed = action.amount;
      }
    }

    // 2. Update Environment (Weather & Moisture)
    this.state.weather = this.updateWeather();
    
    let totalHealth = 0;
    let deathsThisStep = 0;

    for (const cell of this.state.field) {
      if (cell.is_dead) continue;

      // Moisture depletion
      const depletion = (this.state.weather.evaporation_rate * this.task.config.evaporation_multiplier);
      cell.moisture = Math.max(0, cell.moisture - depletion);

      // Rain bonus
      if (this.state.weather.is_raining) {
        cell.moisture = Math.min(1.0, cell.moisture + 0.05);
      }

      // Health update
      // Ideal moisture is between 0.4 and 0.8
      if (cell.moisture < 0.2 || cell.moisture > 0.9) {
        cell.crop_health -= 0.1;
      } else if (cell.moisture >= 0.4 && cell.moisture <= 0.7) {
        cell.crop_health = Math.min(1.0, cell.crop_health + 0.02);
      }

      if (cell.crop_health <= 0) {
        cell.crop_health = 0;
        cell.is_dead = true;
        deathsThisStep++;
      }

      totalHealth += cell.crop_health;
    }

    // 3. Calculate Reward
    const avgHealth = totalHealth / this.state.field.length;
    const healthBonus = avgHealth * 10;
    const waterPenalty = waterUsed * 0.5;
    const deathPenalty = deathsThisStep * 50;
    
    const rewardValue = healthBonus - waterPenalty - deathPenalty;

    this.state.history.push({ action, reward: rewardValue });

    const done = this.state.field.every(c => c.is_dead) || this.state.step >= this.task.max_steps;

    return {
      observation: this.getObservation(),
      reward: rewardValue,
      done,
      info: {
        avg_health: avgHealth,
        water_remaining: this.state.water_tank,
      },
    };
  }

  public getState(): State {
    return JSON.parse(JSON.stringify(this.state));
  }

  private getObservation(): Observation {
    return {
      step: this.state.step,
      weather: { ...this.state.weather },
      field: this.state.field.map(c => ({ ...c })),
      water_tank: {
        current: this.state.water_tank,
        capacity: this.task.config.initial_water,
      },
    };
  }

  private generateWeather(): Weather {
    return {
      temperature: 25 + this.rng() * 10,
      humidity: 40 + this.rng() * 20,
      is_raining: false,
      evaporation_rate: 0.02 + this.rng() * 0.03,
    };
  }

  private updateWeather(): Weather {
    const volatility = this.task.config.weather_volatility;
    const newTemp = Math.max(15, Math.min(45, this.state.weather.temperature + (this.rng() - 0.5) * 5 * volatility));
    const newHumidity = Math.max(10, Math.min(90, this.state.weather.humidity + (this.rng() - 0.5) * 10 * volatility));
    const isRaining = this.rng() < (newHumidity / 200); // Higher humidity, more rain chance
    
    return {
      temperature: newTemp,
      humidity: newHumidity,
      is_raining: isRaining,
      evaporation_rate: (newTemp / 1000) + (this.rng() * 0.01),
    };
  }
}
