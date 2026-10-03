import { AlignmentInputs, AlignmentOutputs } from '../types/alignment';
import { calculateShaftAlignment } from '../physics/alignmentMath';
import { BASELINE_ALIGNMENT_INPUTS } from './alignmentPresets';

export function calculateAlignment(inputs?: Partial<AlignmentInputs>): AlignmentOutputs {
  const mergedInputs: AlignmentInputs = {
    ...BASELINE_ALIGNMENT_INPUTS,
    ...inputs,
  };
  return calculateShaftAlignment(mergedInputs);
}
