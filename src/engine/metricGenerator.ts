// Re-export deterministic data generator implementations for backward compatibility
export {
  generateDeterministicValue as generateRandomValue,
  generateInitialHistory,
  getStepSize,
  generateNextDatapoint,
  PRESET_CHAOS_SCENARIOS,
  getScenarioForIncident
} from './dataGenerator';
