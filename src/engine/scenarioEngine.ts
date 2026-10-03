import { SimulatorType, ScenarioDefinition, SimulationEventLog } from './types';
import { ALL_SCENARIOS } from './scenarios';

export interface RunningScenarioTask {
  scenarioId: string;
  simulator: SimulatorType;
  timerIds: number[];
}

class ScenarioEngineManager {
  private activeTasks: Map<SimulatorType, RunningScenarioTask> = new Map();

  /**
   * Finds a scenario by simulator and scenario ID
   */
  public getScenario(simulator: SimulatorType, scenarioId: string): ScenarioDefinition | undefined {
    const list = ALL_SCENARIOS[simulator];
    if (!list) return undefined;
    return list.find((s) => s.id === scenarioId);
  }

  /**
   * Returns all scenarios available for a given simulator
   */
  public getScenariosForSimulator(simulator: SimulatorType): ScenarioDefinition[] {
    return ALL_SCENARIOS[simulator] || [];
  }

  /**
   * Cancels any ongoing timed event timers for a simulator
   */
  public cancelOngoingScenarioTimers(simulator: SimulatorType): void {
    const task = this.activeTasks.get(simulator);
    if (task) {
      task.timerIds.forEach((tId) => clearTimeout(tId));
      this.activeTasks.delete(simulator);
    }
  }

  /**
   * Schedules timed event triggers for a scenario
   */
  public scheduleScenarioTimeline(
    simulator: SimulatorType,
    scenario: ScenarioDefinition,
    onTimedEvent: (event: {
      message: string;
      type: 'info' | 'warning' | 'alert' | 'success';
      patchInputs?: Record<string, any>;
    }) => void
  ): void {
    this.cancelOngoingScenarioTimers(simulator);

    if (!scenario.timedEvents || scenario.timedEvents.length === 0) {
      return;
    }

    const timerIds: number[] = [];

    scenario.timedEvents.forEach((te) => {
      const tId = window.setTimeout(() => {
        onTimedEvent({
          message: te.event,
          type: te.type || 'info',
          patchInputs: te.applyInputs,
        });
      }, te.delayMs);

      timerIds.push(tId);
    });

    this.activeTasks.set(simulator, {
      scenarioId: scenario.id,
      simulator,
      timerIds,
    });
  }
}

export const scenarioEngine = new ScenarioEngineManager();
