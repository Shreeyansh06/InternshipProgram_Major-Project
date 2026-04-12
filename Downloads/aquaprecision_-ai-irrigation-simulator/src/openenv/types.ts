import { z } from 'zod';

// --- OpenEnv Specification Models ---

export const ActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('irrigate'),
    cell_id: z.number().int().min(0),
    amount: z.number().min(0).max(10), // Liters
  }),
  z.object({
    type: z.literal('wait'),
  }),
]);

export type Action = z.infer<typeof ActionSchema>;

export const ObservationSchema = z.object({
  step: z.number(),
  weather: z.object({
    temperature: z.number(),
    humidity: z.number(),
    is_raining: z.boolean(),
    evaporation_rate: z.number(),
  }),
  field: z.array(z.object({
    id: z.number(),
    moisture: z.number(), // 0.0 to 1.0
    crop_health: z.number(), // 0.0 to 1.0
    crop_type: z.string(),
    is_dead: z.boolean(),
  })),
  water_tank: z.object({
    current: z.number(),
    capacity: z.number(),
  }),
});

export type Observation = z.infer<typeof ObservationSchema>;

export const RewardSchema = z.object({
  value: z.number(),
  components: z.object({
    health_bonus: z.number(),
    water_penalty: z.number(),
    death_penalty: z.number(),
  }),
});

export type Reward = z.infer<typeof RewardSchema>;

export interface StepResult {
  observation: Observation;
  reward: number;
  done: boolean;
  info: any;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  max_steps: number;
  config: {
    grid_size: number;
    initial_water: number;
    evaporation_multiplier: number;
    weather_volatility: number;
  };
}

export interface State {
  task_id: string;
  step: number;
  field: FieldCell[];
  water_tank: number;
  weather: Weather;
  history: { action: Action; reward: number }[];
}

export interface FieldCell {
  id: number;
  moisture: number;
  crop_health: number;
  crop_type: string;
  is_dead: boolean;
}

export interface Weather {
  temperature: number;
  humidity: number;
  is_raining: boolean;
  evaporation_rate: number;
}
