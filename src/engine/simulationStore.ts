import { create } from 'zustand';
import {
  SimulatorType,
  SimulationSpeed,
  PerformanceMode,
  AnimationIntensity,
  SimulationStoreState,
  SimulationEventLog,
  PhysicsAnimationParams,
} from './types';
import { calculatePump } from '../utils/pumpCalculations';
import { calculateRotor } from '../utils/rotorCalculations';
import { calculatePipeStress } from '../utils/pipeCalculations';
import { calculateSealPlan } from '../utils/sealCalculations';
import { PUMP_PRESETS } from '../utils/pumpPresets';
import { ROTOR_PRESETS } from '../utils/rotorPresets';
import { PIPE_PRESETS } from '../utils/pipePresets';
import { SEAL_PRESETS } from '../utils/sealPresets';
import {
  derivePumpAnimation,
  deriveRotorAnimation,
  derivePipeAnimation,
  deriveSealAnimation,
} from './animationMapping';
import { scenarioEngine } from './scenarioEngine';

const initialPumpInputs = PUMP_PRESETS[0].inputs;
const initialRotorInputs = ROTOR_PRESETS[0].inputs;
const initialPipeInputs = PIPE_PRESETS[0].inputs;
const initialSealInputs = SEAL_PRESETS[0].inputs;

const initialPumpOutputs = calculatePump(initialPumpInputs);
const initialRotorOutputs = calculateRotor(initialRotorInputs);
const initialPipeOutputs = calculatePipeStress(initialPipeInputs);
const initialSealOutputs = calculateSealPlan(initialSealInputs);

function formatTimestamp(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
}

export const useSimulationStore = create<SimulationStoreState>((set, get) => ({
  // 1. Core Simulator State
  activeSimulator: 'pump',
  selectedScenario: {
    pump: null,
    rotor: null,
    pipe: null,
    seal: null,
  },
  inputs: {
    pump: initialPumpInputs,
    rotor: initialRotorInputs,
    pipe: initialPipeInputs,
    seal: initialSealInputs,
  },
  calculatedOutputs: {
    pump: initialPumpOutputs,
    rotor: initialRotorOutputs,
    pipe: initialPipeOutputs,
    seal: initialSealOutputs,
  },
  animationParameters: {
    pump: derivePumpAnimation(initialPumpInputs, initialPumpOutputs, 'high'),
    rotor: deriveRotorAnimation(initialRotorInputs, initialRotorOutputs, 'high'),
    pipe: derivePipeAnimation(initialPipeInputs, initialPipeOutputs, 'high'),
    seal: deriveSealAnimation(initialSealInputs, initialSealOutputs, 'high'),
  },

  // 2. Telemetry, Status & Logs
  statusLevel: {
    pump: initialPumpOutputs.status.level,
    rotor: initialRotorOutputs.status.level,
    pipe: initialPipeOutputs.status.level,
    seal: initialSealOutputs.status.level,
  },
  warnings: {
    pump: initialPumpOutputs.specificWarnings || [],
    rotor: initialRotorOutputs.specificWarnings || [],
    pipe: initialPipeOutputs.status.recommendations || [],
    seal: initialSealOutputs.planSpecificWarnings || [],
  },
  liveInsight: {
    pump: 'Steady state hydrodynamic operation - NPSHa exceeds NPSHr with adequate margin.',
    rotor: 'Rotor dynamically balanced - ISO 10816-3 Zone A vibration severity.',
    pipe: 'Baseline operating temperature - Thermal expansion within allowable limits.',
    seal: 'Plan 11 flush circulation active - Hydrodynamic seal face lubrication maintained.',
  },
  recommendedAction: {
    pump: initialPumpOutputs.recommendedActions?.[0] || 'Maintain continuous operating flow rate.',
    rotor: initialRotorOutputs.recommendedActions?.[0] || 'Maintain standard preventive maintenance schedule.',
    pipe: initialPipeOutputs.recommendedActions?.[0] || 'Inspect thermal guides and anchor supports.',
    seal: initialSealOutputs.status.recommendations?.[0] || 'Verify flush cooling line temperature.',
  },
  eventLog: {
    pump: [
      {
        id: 'p-init-1',
        timestamp: formatTimestamp(),
        message: 'Engine initialized: Centrifugal Pump Cavitation & NPSH Model ready.',
        type: 'info',
        source: 'pump',
      },
    ],
    rotor: [
      {
        id: 'r-init-1',
        timestamp: formatTimestamp(),
        message: 'Engine initialized: Rotor Dynamics & ISO 281 Bearing Life Model ready.',
        type: 'info',
        source: 'rotor',
      },
    ],
    pipe: [
      {
        id: 'pi-init-1',
        timestamp: formatTimestamp(),
        message: 'Engine initialized: ASME B31.3 Piping Thermal Expansion Model ready.',
        type: 'info',
        source: 'pipe',
      },
    ],
    seal: [
      {
        id: 's-init-1',
        timestamp: formatTimestamp(),
        message: 'Engine initialized: API 682 Mechanical Seal Flush Model ready.',
        type: 'info',
        source: 'seal',
      },
    ],
  },

  // 3. Engine Controls
  unitSystem: 'metric',
  isPlaying: true,
  simulationSpeed: 1.0,
  performanceMode: 'high',
  animationIntensity: 'high',
  simulationClockMs: 0,

  // 4. Actions
  setActiveSimulator: (sim: SimulatorType) => {
    set({ activeSimulator: sim });
  },

  setUnitSystem: (units) => {
    set({ unitSystem: units });
  },

  setPlayPause: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  togglePlayPause: () => {
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  setSimulationSpeed: (speed: SimulationSpeed) => {
    set({ simulationSpeed: speed });
  },

  setPerformanceMode: (mode: PerformanceMode) => {
    set({ performanceMode: mode });
  },

  setAnimationIntensity: (intensity: AnimationIntensity) => {
    const { inputs, calculatedOutputs } = get();
    set({
      animationIntensity: intensity,
      animationParameters: {
        pump: derivePumpAnimation(inputs.pump, calculatedOutputs.pump, intensity),
        rotor: deriveRotorAnimation(inputs.rotor, calculatedOutputs.rotor, intensity),
        pipe: derivePipeAnimation(inputs.pipe, calculatedOutputs.pipe, intensity),
        seal: deriveSealAnimation(inputs.seal, calculatedOutputs.seal, intensity),
      },
    });
  },

  setInput: (sim, key, value) => {
    const currentInputs = get().inputs[sim];
    const newInputs = { ...currentInputs, [key]: value };
    get().setInputs(sim, newInputs as any);
  },

  patchInputs: (sim, patch) => {
    const currentInputs = get().inputs[sim];
    const newInputs = { ...currentInputs, ...patch };
    get().setInputs(sim, newInputs as any);
  },

  setInputs: (sim, newInputs) => {
    const intensity = get().animationIntensity;
    let newOutputs: any;
    let newAnimParams: PhysicsAnimationParams;
    let newWarnings: string[] = [];
    let newRec: string = '';

    if (sim === 'pump') {
      newOutputs = calculatePump(newInputs as any);
      newAnimParams = derivePumpAnimation(newInputs as any, newOutputs, intensity);
      newWarnings = newOutputs.specificWarnings || [];
      newRec = newOutputs.recommendedActions?.[0] || 'Maintain continuous operating flow rate.';
    } else if (sim === 'rotor') {
      newOutputs = calculateRotor(newInputs as any);
      newAnimParams = deriveRotorAnimation(newInputs as any, newOutputs, intensity);
      newWarnings = newOutputs.specificWarnings || [];
      newRec = newOutputs.recommendedActions?.[0] || 'Maintain standard preventive maintenance schedule.';
    } else if (sim === 'pipe') {
      newOutputs = calculatePipeStress(newInputs as any);
      newAnimParams = derivePipeAnimation(newInputs as any, newOutputs, intensity);
      newWarnings = newOutputs.status.recommendations || [];
      newRec = newOutputs.recommendedActions?.[0] || 'Inspect thermal guides and anchor supports.';
    } else {
      newOutputs = calculateSealPlan(newInputs as any);
      newAnimParams = deriveSealAnimation(newInputs as any, newOutputs, intensity);
      newWarnings = newOutputs.planSpecificWarnings || [];
      newRec = newOutputs.status.recommendations?.[0] || 'Verify flush cooling line temperature.';
    }

    set((state) => ({
      inputs: {
        ...state.inputs,
        [sim]: newInputs,
      },
      calculatedOutputs: {
        ...state.calculatedOutputs,
        [sim]: newOutputs,
      },
      animationParameters: {
        ...state.animationParameters,
        [sim]: newAnimParams,
      },
      statusLevel: {
        ...state.statusLevel,
        [sim]: newOutputs.status.level,
      },
      warnings: {
        ...state.warnings,
        [sim]: newWarnings,
      },
      recommendedAction: {
        ...state.recommendedAction,
        [sim]: newRec,
      },
    }));
  },

  selectScenario: (sim: SimulatorType, scenarioId: string) => {
    const scenario = scenarioEngine.getScenario(sim, scenarioId);
    if (!scenario) return;

    // Apply multiple inputs automatically
    const currentInputs = get().inputs[sim];
    const mergedInputs = { ...currentInputs, ...scenario.inputs };

    // Apply inputs & calculate outputs
    get().setInputs(sim, mergedInputs as any);

    // Update scenario & live insight
    set((state) => ({
      selectedScenario: {
        ...state.selectedScenario,
        [sim]: scenarioId,
      },
      liveInsight: {
        ...state.liveInsight,
        [sim]: scenario.insight,
      },
      recommendedAction: {
        ...state.recommendedAction,
        [sim]: scenario.recommendedAction,
      },
    }));

    // Add immediate event log entries
    scenario.events.forEach((msg, idx) => {
      const logType = idx === 0 ? 'info' : idx === scenario.events.length - 1 ? 'warning' : 'alert';
      get().addEventLog(sim, `[Scenario: ${scenario.label}] ${msg}`, logType);
    });

    // Schedule timed events if any
    scenarioEngine.scheduleScenarioTimeline(sim, scenario, ({ message, type, patchInputs }) => {
      get().addEventLog(sim, `[Timeline Event] ${message}`, type);
      if (patchInputs) {
        get().patchInputs(sim, patchInputs as any);
      }
    });
  },

  addEventLog: (sim: SimulatorType, message: string, type = 'info') => {
    const newLog: SimulationEventLog = {
      id: `${sim}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: formatTimestamp(),
      message,
      type,
      source: sim,
    };

    set((state) => {
      const currentLogs = state.eventLog[sim] || [];
      const updatedLogs = [newLog, ...currentLogs].slice(0, 50); // keep 50 latest logs
      return {
        eventLog: {
          ...state.eventLog,
          [sim]: updatedLogs,
        },
      };
    });
  },

  clearEventLogs: (sim: SimulatorType) => {
    set((state) => ({
      eventLog: {
        ...state.eventLog,
        [sim]: [],
      },
    }));
  },

  resetSimulatorToDefaults: (sim: SimulatorType) => {
    scenarioEngine.cancelOngoingScenarioTimers(sim);
    if (sim === 'pump') {
      get().setInputs('pump', initialPumpInputs);
    } else if (sim === 'rotor') {
      get().setInputs('rotor', initialRotorInputs);
    } else if (sim === 'pipe') {
      get().setInputs('pipe', initialPipeInputs);
    } else if (sim === 'seal') {
      get().setInputs('seal', initialSealInputs);
    }

    set((state) => ({
      selectedScenario: {
        ...state.selectedScenario,
        [sim]: null,
      },
    }));

    get().addEventLog(sim, 'Simulation reset to default baseline configuration.', 'info');
  },

  advanceSimulationClock: (deltaMs: number) => {
    if (!get().isPlaying) return;
    set((state) => ({
      simulationClockMs: state.simulationClockMs + deltaMs * state.simulationSpeed,
    }));
  },
}));
