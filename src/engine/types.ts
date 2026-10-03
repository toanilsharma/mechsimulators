import { UnitSystem, StatusLevel } from '../types/common';
import { PumpInputs, PumpOutputs } from '../types/pump';
import { RotorInputs, RotorOutputs } from '../types/rotor';
import { PipeInputs, PipeOutputs } from '../types/pipe';
import { SealInputs, SealOutputs } from '../types/seal';

export type SimulatorType = 'pump' | 'rotor' | 'pipe' | 'seal';

export type SimulationSpeed = 0.25 | 0.5 | 1.0 | 2.0 | 5.0;

export type PerformanceMode = 'high' | 'balanced' | 'low-power';

export type AnimationIntensity = 'high' | 'medium' | 'low';

export interface PhysicsAnimationMappingItem {
  simulator: SimulatorType;
  effectName: string;
  visualProperty: string;
  governingVariable: string;
  formulaOrRule: string;
  faultThreshold?: string;
  unitOrScale: string;
}

export interface SimulationEventLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  source?: SimulatorType;
}

/**
 * Visual Animation Parameters strictly derived from physics calculations.
 * Rule: Do not animate anything that is not connected to a calculation or scenario state.
 */
export interface PhysicsAnimationParams {
  flowSpeed: number; // 0.0 to 5.0 normalized flow animation velocity
  bubbleIntensity: number; // 0.0 to 1.0 vapor bubble count / cavitation collapse
  vibrationIntensity: number; // 0.0 to 1.0 mechanical structural vibration oscillation
  orbitRadius: number; // Physical shaft whirling orbit offset in pixels/units
  temperatureGlow: string; // Color & glow intensity derived from thermodynamics
  stressColor: string; // Color mapped to stress ratio % (ASME/ISO compliance)
  pressurePulse: {
    frequencyHz: number;
    amplitude: number; // 0.0 to 1.0
  };
  leakIntensity: number; // 0.0 to 1.0 leakage / spray rate
  vaporizationIntensity: number; // 0.0 to 1.0 phase flashing intensity
  damageLevel: number; // 0 to 100% mechanical fatigue / erosion damage
  bearingHealth: number; // 0 to 100% residual operational health
  sealChamberTempColor: string; // Color reflecting chamber thermal rise
}

/**
 * Scenario definition conforming to requirement:
 * - sets multiple inputs automatically
 * - starts time-based events if needed
 * - triggers warnings
 * - updates visual state
 * - adds event log entries
 * - shows short one-line insight
 */
export interface ScenarioDefinition<TInputs = any> {
  id: string;
  label: string;
  simulator: SimulatorType;
  category?: 'normal' | 'abnormal';
  event?: string;
  consequence?: string;
  recommendedAction: string;
  description?: string;
  inputs: Partial<TInputs>;
  events?: string[];
  insight?: string;
  timedEvents?: Array<{
    delayMs: number;
    event: string;
    type?: 'info' | 'warning' | 'alert' | 'success';
    applyInputs?: Partial<TInputs>;
  }>;
}

export interface SimulatorDataMap {
  pump: { inputs: PumpInputs; outputs: PumpOutputs };
  rotor: { inputs: RotorInputs; outputs: RotorOutputs };
  pipe: { inputs: PipeInputs; outputs: PipeOutputs };
  seal: { inputs: SealInputs; outputs: SealOutputs };
}

export interface SimulationStoreState {
  // 1. Core Simulator State
  activeSimulator: SimulatorType;
  selectedScenario: Record<SimulatorType, string | null>;
  inputs: {
    pump: PumpInputs;
    rotor: RotorInputs;
    pipe: PipeInputs;
    seal: SealInputs;
  };
  calculatedOutputs: {
    pump: PumpOutputs;
    rotor: RotorOutputs;
    pipe: PipeOutputs;
    seal: SealOutputs;
  };
  animationParameters: {
    pump: PhysicsAnimationParams;
    rotor: PhysicsAnimationParams;
    pipe: PhysicsAnimationParams;
    seal: PhysicsAnimationParams;
  };

  // 2. Telemetry, Status & Logs
  statusLevel: Record<SimulatorType, StatusLevel>;
  warnings: Record<SimulatorType, string[]>;
  liveInsight: Record<SimulatorType, string>;
  recommendedAction: Record<SimulatorType, string>;
  eventLog: Record<SimulatorType, SimulationEventLog[]>;

  // 3. Engine Controls
  unitSystem: UnitSystem;
  isPlaying: boolean;
  simulationSpeed: SimulationSpeed;
  performanceMode: PerformanceMode;
  animationIntensity: AnimationIntensity;
  simulationClockMs: number;

  // 4. Actions
  setActiveSimulator: (sim: SimulatorType) => void;
  setUnitSystem: (units: UnitSystem) => void;
  setPlayPause: (playing: boolean) => void;
  togglePlayPause: () => void;
  setSimulationSpeed: (speed: SimulationSpeed) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  setAnimationIntensity: (intensity: AnimationIntensity) => void;

  setInput: <K extends SimulatorType>(sim: K, key: keyof SimulatorDataMap[K]['inputs'], value: any) => void;
  setInputs: <K extends SimulatorType>(sim: K, inputs: SimulatorDataMap[K]['inputs']) => void;
  patchInputs: <K extends SimulatorType>(sim: K, patch: Partial<SimulatorDataMap[K]['inputs']>) => void;
  
  selectScenario: (sim: SimulatorType, scenarioId: string) => void;
  addEventLog: (sim: SimulatorType, message: string, type?: 'info' | 'warning' | 'alert' | 'success') => void;
  clearEventLogs: (sim: SimulatorType) => void;
  resetSimulatorToDefaults: (sim: SimulatorType) => void;
  advanceSimulationClock: (deltaMs: number) => void;
}
