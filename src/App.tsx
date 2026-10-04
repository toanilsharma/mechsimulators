import React, { useState, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SEO } from './components/SEO';
import { Navigation } from './components/Navigation';
import { InfoModal } from './components/InfoModal';
import { CalculationAuditModal } from './components/CalculationAuditModal';
import { ReportModal } from './components/ReportModal';
import { HomePage } from './components/HomePage';

// Simulators
import { PumpSimulator } from './simulators/PumpCavitation/PumpSimulator';
import { RotorSimulator } from './simulators/RotorUnbalance/RotorSimulator';
import { PipeStressSimulator } from './simulators/PipeStress/PipeStressSimulator';
import { SealPlanSimulator } from './simulators/SealFlushPlan/SealPlanSimulator';
import { AlignmentSimulator } from './simulators/Alignment/AlignmentSimulator';
import { CompressorSimulator } from './simulators/CompressorSurge/CompressorSimulator';
import { BearingSimulator } from './simulators/BearingFault/BearingSimulator';
import { JournalSimulator } from './simulators/JournalBearing/JournalSimulator';
import { RecipSimulator } from './simulators/RecipCompressor/RecipSimulator';
import { GearboxSimulator } from './simulators/Gearbox/GearboxSimulator';
import { SteamTurbineSimulator } from './simulators/SteamTurbine/SteamTurbineSimulator';

// Calculators for Report & Audit Trail synchronization
import { calculatePump } from './utils/pumpCalculations';
import { calculateRotor } from './utils/rotorCalculations';
import { calculatePipeStress } from './utils/pipeCalculations';
import { calculateSealPlan } from './utils/sealCalculations';
import { calculateAlignment } from './utils/alignmentCalculations';
import { calculateCompressorSurge } from './utils/compressorCalculations';
import { calculateBearingFaults } from './utils/bearingCalculations';
import { calculateJournalBearing } from './utils/journalBearingCalculations';
import { calculateRecipCompressor } from './utils/recipCompressorCalculations';
import { calculateGearbox } from './utils/gearboxCalculations';
import { calculateSteamTurbine } from './utils/steamTurbineCalculations';
import { PUMP_PRESETS } from './utils/pumpPresets';
import { ROTOR_PRESETS } from './utils/rotorPresets';
import { PIPE_PRESETS } from './utils/pipePresets';
import { SEAL_PRESETS } from './utils/sealPresets';
import { ALIGNMENT_PRESETS } from './utils/alignmentPresets';
import { COMPRESSOR_SCENARIOS } from './utils/compressorPresets';
import { BEARING_SCENARIOS } from './utils/bearingPresets';
import { JOURNAL_BEARING_SCENARIOS } from './utils/journalBearingPresets';
import { RECIP_COMPRESSOR_SCENARIOS } from './utils/recipCompressorPresets';
import { GEARBOX_SCENARIOS } from './utils/gearboxPresets';
import { STEAM_TURBINE_SCENARIOS } from './utils/steamTurbinePresets';
import { DiagnosticWizardModal } from './components/DiagnosticWizardModal';
import { CaseStudiesModal } from './components/CaseStudiesModal';
import { ReliabilityStudioModal } from './components/ReliabilityStudio/ReliabilityStudioModal';
import { MachineryTrainStudio } from './components/MachineryTrain/MachineryTrainStudio';
import { SpectralLabModal } from './components/SpectralLab/SpectralLabModal';
import { CommandPalette } from './components/CommandPalette';
import { CrossAssetComparatorModal } from './components/CrossAssetComparator/CrossAssetComparatorModal';
import { KnowledgeBaseHub } from './components/KnowledgeBase/KnowledgeBaseHub';
import { TransientRunUpModal } from './components/TransientDynamics/TransientRunUpModal';
import { KineticCutawayModal } from './components/KineticCutaway/KineticCutawayModal';
import { FleetHealthMatrixModal } from './components/FleetHealth/FleetHealthMatrixModal';
import { RcaStudioModal } from './components/RcaStudio/RcaStudioModal';
import { TribologyLabModal } from './components/TribologyLab/TribologyLabModal';
import { MonteCarloModal } from './components/MonteCarlo/MonteCarloModal';
import { ExergyCarbonModal } from './components/ExergyCarbon/ExergyCarbonModal';
import { MechanicalPortalPage } from './components/Portal/MechanicalPortalPage';
import { MissionControlWorkbench } from './components/Workbench/MissionControlWorkbench';
import { MechanicalContextBar, GlobalCmdkSearch, MECHANICAL_SIMS } from './components/Layout';
import { LiveSimulatorsFooter } from './components/Footer/LiveSimulatorsFooter';

function MainAppShell() {
  const {
    activeRoute,
    setActiveRoute,
    unitSystem,
    isDisclaimerModalOpen,
    acceptDisclaimer,
    isAuditModalOpen,
    setIsAuditModalOpen,
    isReportModalOpen,
    setIsReportModalOpen,
    isDiagnosticModalOpen,
    setIsDiagnosticModalOpen,
    isCaseStudiesModalOpen,
    setIsCaseStudiesModalOpen,
    isReliabilityStudioOpen,
    setIsReliabilityStudioOpen,
    isMachineryTrainStudioOpen,
    setIsMachineryTrainStudioOpen,
    isSpectralLabOpen,
    setIsSpectralLabOpen,
    isTransientModalOpen,
    setIsTransientModalOpen,
    isKineticCutawayOpen,
    setIsKineticCutawayOpen,
    isFleetMatrixOpen,
    setIsFleetMatrixOpen,
    isRcaStudioOpen,
    setIsRcaStudioOpen,
    rcaPreloadCase,
    isTribologyLabOpen,
    setIsTribologyLabOpen,
    isMonteCarloOpen,
    setIsMonteCarloOpen,
    isExergyCarbonOpen,
    setIsExergyCarbonOpen,
    getLiveSimulationReport,
  } = useApp();

  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Global Keyboard Fast-Navigation Listener (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute active calculation for audit formulas and printable report (prefer live simulation data)
  const activeReportData = useMemo(() => {
    const live = getLiveSimulationReport();
    if (live && live.route === activeRoute) {
      return live;
    }

    if (activeRoute === 'pump') {
      const res = calculatePump(PUMP_PRESETS[0].inputs);
      return {
        title: 'Centrifugal Pump Cavitation & NPSH Assessment',
        subtitle: 'API 610 / Hydraulic Institute 9.6.1 Cavitation Severity & Suction Specific Speed',
        standards: ['API 610 12th Ed §6.1.8', 'HI 9.6.1 NPSH Margin Standard', 'ISO 5199'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Process Fluid', value: 'Water (20°C)' },
          { label: 'Operating Flow Rate', value: `${PUMP_PRESETS[0].inputs.flowRateM3h} m³/h` },
          { label: 'Shaft Speed', value: `${PUMP_PRESETS[0].inputs.pumpSpeedRpm} RPM` },
          { label: 'Static Suction Head', value: `${PUMP_PRESETS[0].inputs.staticHeadM} m` },
          { label: 'Suction Line Diameter', value: `${PUMP_PRESETS[0].inputs.pipeDiameterMm} mm` },
          { label: 'Fluid Temperature', value: `${PUMP_PRESETS[0].inputs.fluidTempC}°C` },
        ],
        keyResults: [
          { label: 'NPSH Available (NPSHa)', value: `${(res.npshaM ?? 0).toFixed(2)} m`, status: 'safe' as const },
          { label: 'NPSH Required (NPSHr)', value: `${(res.npshrM ?? 0).toFixed(2)} m` },
          { label: 'NPSH Margin Ratio', value: `${(res.npshMarginRatio ?? 1).toFixed(2)}x (Rec: ≥ ${(res.recommendedMarginRatio ?? 1.35).toFixed(2)}x)`, status: 'safe' as const },
          { label: 'Suction Specific Speed Nss', value: `${(res.suctionSpecificSpeedUS ?? 8500).toFixed(0)} US`, status: 'safe' as const },
          { label: 'Suction Line Velocity', value: `${(res.fluidVelocityMs ?? 0).toFixed(2)} m/s` },
        ],
      };
    } else if (activeRoute === 'rotor') {
      const res = calculateRotor(ROTOR_PRESETS[0].inputs);
      return {
        title: 'Rotor Dynamic Balance & ISO 281 Bearing Rating Life',
        subtitle: 'ISO 1940-1 Balancing Grade & ISO 10816-3 Vibration Severity Assessment',
        standards: ['ISO 1940-1:2003 Grade G2.5', 'ISO 281:2007 Modified Rating Life', 'ISO 10816-3'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Rotor Assembly Mass', value: `${ROTOR_PRESETS[0].inputs.rotorMassKg} kg` },
          { label: 'Operating Speed', value: `${ROTOR_PRESETS[0].inputs.operatingRpm} RPM` },
          { label: 'ISO Balance Quality', value: `Grade ${ROTOR_PRESETS[0].inputs.balanceGrade}` },
          { label: 'Bearing Type', value: `${ROTOR_PRESETS[0].inputs.bearingModelId}` },
          { label: 'Static Radial Load', value: `${ROTOR_PRESETS[0].inputs.staticRadialLoadN} N` },
        ],
        keyResults: [
          { label: 'Permissible Unbalance U_per', value: `${(res.iso1940PermissibleUnbalanceGmm ?? 0).toFixed(0)} g·mm`, status: 'safe' as const },
          { label: 'Actual Residual Unbalance', value: `${(res.actualUnbalanceGmm ?? 0).toFixed(0)} g·mm`, status: 'safe' as const },
          { label: '1X Centrifugal Unbalance Force', value: `${(res.dynamicUnbalanceForceN ?? 0).toFixed(0)} N` },
          { label: 'ISO 10816 Vibration Severity', value: `Zone ${res.iso10816Zone ?? 'A'} (${(res.vibrationVelocityRmsMmS ?? 0).toFixed(2)} mm/s RMS)`, status: 'safe' as const },
          { label: 'ISO 281 Modified Life L10mh', value: `${Math.round(res.modifiedLifeL10mhHours ?? 0).toLocaleString()} hrs (~${((res.modifiedLifeL10mhHours ?? 0) / 8760).toFixed(0)} yrs)`, status: 'safe' as const },
        ],
      };
    } else if (activeRoute === 'pipe') {
      const res = calculatePipeStress(PIPE_PRESETS[0].inputs);
      return {
        title: 'ASME B31.3 Piping Flexibility & Thermal Expansion Stress',
        subtitle: 'Thermal Growth, Combined von Mises Stress, and Anchor Thrust Reactions',
        standards: ['ASME B31.3:2022 §319', 'ASME B36.10M', 'Kellogg Flexibility'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Pipe Material', value: 'Carbon Steel' },
          { label: 'Pipe Geometry', value: `${PIPE_PRESETS[0].inputs.pipeLengthM} m | 6" Sch 40` },
          { label: 'Operating / Install Temp', value: `${PIPE_PRESETS[0].inputs.operatingTempC}°C / ${PIPE_PRESETS[0].inputs.installationTempC}°C` },
          { label: 'Operating Pressure', value: `${PIPE_PRESETS[0].inputs.operatingPressureBar} bar` },
          { label: 'Anchor Condition', value: 'Anchored Both Ends' },
        ],
        keyResults: [
          { label: 'Thermal Growth ΔL', value: `${(res.thermalExpansionMm ?? 0).toFixed(1)} mm` },
          { label: 'Direct Axial Stress σ_axial', value: `${(res.axialStressMPa ?? 0).toFixed(1)} MPa`, status: 'critical' as const },
          { label: 'ASME Stress Ratio', value: `${(res.stressRatioPercent ?? 0).toFixed(0)}%`, status: 'critical' as const },
          { label: 'Anchor Thrust F_axial', value: `${(res.axialForceKN ?? 0).toFixed(1)} kN` },
        ],
      };
    } else if (activeRoute === 'alignment') {
      const res = calculateAlignment(ALIGNMENT_PRESETS[0].inputs);
      return {
        title: 'Shaft Alignment, Thermal Offset & API 686 Compliance',
        subtitle: 'Hot-Running Dynamic Offset, Shim Corrections & ISO 20816 2X Harmonics',
        standards: ['API 686 2nd Ed Chapter 7', 'ISO 20816-3:2022', 'AGMA 9000-D11'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Operating Speed', value: `${ALIGNMENT_PRESETS[0].inputs.motorRpm} RPM` },
          { label: 'Coupling Spacer DBSE', value: `${ALIGNMENT_PRESETS[0].inputs.couplingSpacerLengthMm} mm` },
          { label: 'Ambient / Fluid Temp', value: `${ALIGNMENT_PRESETS[0].inputs.ambientInstallationTempC}°C / ${ALIGNMENT_PRESETS[0].inputs.pumpFluidTempC}°C` },
          { label: 'Motor Foot Distance B / C', value: `${ALIGNMENT_PRESETS[0].inputs.distCouplingToMotorFrontFootMm} mm / ${ALIGNMENT_PRESETS[0].inputs.distMotorFrontToRearFootMm} mm` },
          { label: 'Coupling Type', value: 'Metallic Disc Pack (API 671)' },
        ],
        keyResults: [
          { label: 'Hot Resultant Parallel Offset', value: `${res.hotResultantOffsetMm.toFixed(3)} mm (Max: ${res.allowableParallelOffsetMm} mm)`, status: 'safe' as const },
          { label: 'Hot Resultant Angular Tilt', value: `${res.hotResultantAngleMrad.toFixed(2)} mrad (Max: ${res.allowableAngularOffsetMrad} mrad)`, status: 'safe' as const },
          { label: 'API 686 Tolerance Utilization', value: `${res.toleranceUtilizationPercent.toFixed(0)}% (${res.alignmentClassification})`, status: 'safe' as const },
          { label: 'Front / Rear Foot Shims', value: `F: ${res.frontFootShimAdjustmentMm >= 0 ? '+' : ''}${res.frontFootShimAdjustmentMm.toFixed(2)} mm | R: ${res.rearFootShimAdjustmentMm >= 0 ? '+' : ''}${res.rearFootShimAdjustmentMm.toFixed(2)} mm` },
          { label: 'Transmitted Shear Reaction', value: `${res.transmittedRadialShearN.toFixed(0)} N (DE Bearing +${res.motorBearingAdditionalRadialLoadN.toFixed(0)} N)` },
          { label: 'ISO 10816-3 Vibration', value: `Zone ${res.iso10816Zone} (${res.totalVibrationRmsMmS.toFixed(2)} mm/s RMS, 2X: ${res.vibration2XRmsMmS.toFixed(2)} mm/s)`, status: 'safe' as const },
        ],
      };
    } else if (activeRoute === 'seal') {
      const res = calculateSealPlan(SEAL_PRESETS[0].inputs);
      return {
        title: 'API 682 Mechanical Seal Flush Plan & Thermal Hydraulics',
        subtitle: 'Frictional Face Heat Generation, Flush Orifice Flow, and Vapor Suppression Margin',
        standards: ['API 682 4th Edition Annex C', 'API 682 Plan 11 Standard'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Flush Piping Arrangement', value: 'Plan 11 (Discharge to Box)' },
          { label: 'Seal Size', value: `${SEAL_PRESETS[0].inputs.sealSizeMm} mm` },
          { label: 'Shaft Speed', value: `${SEAL_PRESETS[0].inputs.shaftSpeedRpm} RPM` },
          { label: 'Seal Chamber Pressure', value: `${SEAL_PRESETS[0].inputs.sealChamberPressureKPag} kPag` },
          { label: 'Discharge Pressure', value: `${SEAL_PRESETS[0].inputs.pumpDischargePressureKPag} kPag` },
        ],
        keyResults: [
          { label: 'Seal Face Heat Power Q_face', value: `${(res.sealFaceHeatGenKW ?? 0).toFixed(2)} kW` },
          { label: 'Required Flush Flow Rate', value: `${(res.requiredFlushFlowLpm ?? 0).toFixed(1)} L/min`, status: 'safe' as const },
          { label: 'Actual Orifice Flush Flow', value: `${(res.actualOrificeFlowLpm ?? 0).toFixed(1)} L/min`, status: 'safe' as const },
          { label: 'Vapor Suppression Margin', value: `${(res.vaporPressureMarginKPa ?? 0).toFixed(0)} kPa`, status: 'safe' as const },
          { label: 'Seal Chamber Operating Temp', value: `${(res.sealChamberOperatingTempC ?? 0).toFixed(1)}°C` },
        ],
      };
    } else if (activeRoute === 'compressor') {
      const res = calculateCompressorSurge(COMPRESSOR_SCENARIOS[0].inputs);
      return {
        title: 'Centrifugal Compressor Surge & Anti-Surge Control Assessment',
        subtitle: 'Performance Map & Dynamic SCL Operating Envelope',
        standards: ['API 617 8th Ed (Compressors)', 'API 670 5th Ed (Machinery Protection)', 'ASME PTC 10'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Process Gas', value: res.gasProperties.name },
          { label: 'Suction Pressure P1', value: `${COMPRESSOR_SCENARIOS[0].inputs.suctionPressureBar} bar(a)` },
          { label: 'Process Feed Flow', value: `${COMPRESSOR_SCENARIOS[0].inputs.massFlowKgS} kg/s` },
          { label: 'Shaft Speed', value: `${COMPRESSOR_SCENARIOS[0].inputs.speedRpm} RPM` },
          { label: 'Anti-Surge Valve (ASV)', value: `${COMPRESSOR_SCENARIOS[0].inputs.asvOpeningPercent}%` },
        ],
        keyResults: [
          { label: 'Surge Margin SM', value: `${res.currentSurgeMarginPercent.toFixed(1)}% (Target: ≥ ${COMPRESSOR_SCENARIOS[0].inputs.surgeMarginTargetPercent}%)`, status: 'safe' as const },
          { label: 'Pressure Ratio Rc', value: `${res.pressureRatioRc.toFixed(2)}x (${res.dischargePressureBar.toFixed(2)} bar)` },
          { label: 'Thrust Bearing Load', value: `${res.thrustBearingLoadPercent.toFixed(0)}%`, status: 'safe' as const },
          { label: 'Operating State', value: res.operatingState.toUpperCase(), status: 'safe' as const },
          { label: 'Gas Shaft Power', value: `${Math.round(res.shaftPowerKw).toLocaleString()} kW` },
        ],
      };
    } else if (activeRoute === 'journal') {
      const defaultJournalInputs = JOURNAL_BEARING_SCENARIOS[0].inputs;
      const res = calculateJournalBearing(defaultJournalInputs);
      return {
        simulatorId: 'journal',
        title: 'Hydrodynamic Fluid Film Bearing & Rotor Dynamics Audit',
        subtitle: 'Reynolds Lubrication, Sommerfeld Number, Cross-Coupled Stiffness, and Dynamic Stability Analysis',
        standards: ['API 684 2nd Ed (Rotor Dynamics Tutorial)', 'API 670 5th Ed (Machinery Protection Systems)', 'ISO 7919-2'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Bearing Type', value: defaultJournalInputs.bearingType.replace(/_/g, ' ').toUpperCase() },
          { label: 'Journal Diameter', value: `${defaultJournalInputs.journalDiameterMm} mm (Length: ${defaultJournalInputs.bearingLengthMm} mm)` },
          { label: 'Radial Clearance', value: `${defaultJournalInputs.radialClearanceUm} µm` },
          { label: 'Shaft Speed', value: `${defaultJournalInputs.shaftSpeedRpm} RPM` },
          { label: 'Static Radial Load', value: `${defaultJournalInputs.staticRadialLoadKn} kN` },
          { label: 'Lube Oil Grade', value: `${defaultJournalInputs.oilGrade} @ ${defaultJournalInputs.oilSupplyTempC}°C` },
        ],
        keyResults: [
          { label: 'Dynamic State', value: res.instabilityMode.replace(/_/g, ' ').toUpperCase(), status: res.status.level as 'safe' | 'warning' | 'critical' },
          { label: 'Sommerfeld Number', value: `${res.sommerfeldNumber}` },
          { label: 'Min Film Thickness', value: `${res.minimumFilmThicknessUm} µm`, status: 'safe' as const },
          { label: 'Total Shaft Vib', value: `${res.totalShaftDisplacementUmPkPk} µm pk-pk (Alarm: ${res.api670AlarmLimitUmPkPk} µm)`, status: 'safe' as const },
          { label: 'Rotordynamic Stability Margin', value: `${res.stabilityMarginRatio}x (Log Dec δ = ${res.logarithmicDecrement})`, status: 'safe' as const },
        ],
      };
    } else if (activeRoute === 'recip') {
      const defaultRecipInputs = RECIP_COMPRESSOR_SCENARIOS[0].inputs;
      const res = calculateRecipCompressor(defaultRecipInputs);
      return {
        simulatorId: 'recip',
        title: 'Reciprocating Compressor PV Indicator Card & Dynamics Audit',
        subtitle: 'Thermodynamic Indicator Card, Rod Load Reversal, Valve Degradation, and Acoustic Line Pulsations',
        standards: ['API 618 5th Ed (Reciprocating Compressors)', 'API 688 1st Ed (Acoustic Pulsation & Vibration Control)', 'ASME PTC 10'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Cylinder Action', value: defaultRecipInputs.cylinderAction.replace(/_/g, ' ').toUpperCase() },
          { label: 'Bore & Stroke', value: `${defaultRecipInputs.cylinderBoreMm} mm × ${defaultRecipInputs.strokeMm} mm` },
          { label: 'Crank Speed', value: `${defaultRecipInputs.crankSpeedRpm} RPM` },
          { label: 'Working Gas', value: defaultRecipInputs.gasType.replace(/_/g, ' ').toUpperCase() },
          { label: 'Operating Pressures', value: `${defaultRecipInputs.suctionPressureBarA} bar(a) → ${defaultRecipInputs.dischargePressureBarA} bar(a)` },
        ],
        keyResults: [
          { label: 'Rod Load Reversal Span', value: `${res.rodLoadReversalDegrees}° crank angle (Req: ≥15°)`, status: res.hasAdequateRodLoadReversal ? 'safe' : 'critical' },
          { label: 'Peak Rod Loads', value: `+${res.maxTensionRodLoadKn} kN Tens / ${res.maxCompressionRodLoadKn} kN Comp`, status: 'safe' as const },
          { label: 'Volumetric Efficiency', value: `${res.effectiveVolumetricEfficiencyPercent}% (Flow: ${Math.round(res.massFlowRateKgHr)} kg/h)`, status: 'safe' as const },
          { label: 'Discharge Gas Temp', value: `${res.actualDischargeTempC} °C (Max: 150 °C)`, status: (res.actualDischargeTempC > 150 ? 'critical' : 'safe') as 'safe' | 'warning' | 'critical' },
          { label: 'Acoustic Line Pulsation', value: `${res.maxPulsationPercentOfLine}% (Benchmark Limit: ${res.api618AllowablePulsationPercent}%)`, status: res.isAcousticPulsationCompliant ? 'safe' : 'critical' },
        ],
      };
    } else if (activeRoute === 'gearbox') {
      const defaultGearboxInputs = GEARBOX_SCENARIOS[0].inputs;
      const res = calculateGearbox(defaultGearboxInputs);
      return {
        simulatorId: 'gearbox',
        title: 'Industrial Gearbox Reliability & Mesh Dynamics Audit',
        subtitle: 'Gear Mesh Frequencies, Hunting Tooth Dynamics, Contact & Bending Safety Factors, EHL Film, and Vibration Severity',
        standards: ['AGMA 2001-D04', 'ISO 6336', 'ISO 10816-3', 'AGMA 9005-F16', 'API 613 5th Ed'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Gear Type', value: defaultGearboxInputs.gearType.replace(/_/g, ' ').toUpperCase() },
          { label: 'Power & Speed', value: `${defaultGearboxInputs.ratedPowerKw} kW | ${defaultGearboxInputs.inputSpeedRpm} RPM Pinion` },
          { label: 'Teeth & Ratio', value: `Z_p=${defaultGearboxInputs.pinionTeeth}, Z_g=${defaultGearboxInputs.gearTeeth} (Ratio ${res.gearRatio}:1)` },
          { label: 'Module & Face', value: `m_n=${defaultGearboxInputs.normalModuleMm} mm | Face=${defaultGearboxInputs.faceWidthMm} mm` },
          { label: 'Material Grade', value: defaultGearboxInputs.materialGrade.replace(/_/g, ' ').toUpperCase() },
        ],
        keyResults: [
          { label: 'Bending Margin (S_F)', value: `S_F = ${res.bendingSafetyFactorSF} (Min: 1.40)`, status: (res.bendingSafetyFactorSF >= 1.4 ? 'safe' : res.bendingSafetyFactorSF >= 1.15 ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical' },
          { label: 'Pitting Margin (S_H)', value: `S_H = ${res.contactSafetyFactorSH} (Min: 1.25)`, status: (res.contactSafetyFactorSH >= 1.25 ? 'safe' : res.contactSafetyFactorSH >= 1.05 ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical' },
          { label: 'Gear Mesh Freq (GMF)', value: `${res.gearMeshFrequencyHz} Hz (${defaultGearboxInputs.pinionTeeth}X)`, status: 'safe' as const },
          { label: 'Hunting Tooth (f_HT)', value: `${res.huntingToothFrequencyHz} Hz ${res.commonFactorsGcd === 1 ? '(Prime)' : `(GCD=${res.commonFactorsGcd})`}`, status: res.commonFactorsGcd === 1 ? 'safe' : 'warning' },
          { label: 'EHL Specific Film λ', value: `λ = ${res.specificFilmThicknessLambda} (${res.lubricationRegime})`, status: (res.specificFilmThicknessLambda >= 2.0 ? 'safe' : res.specificFilmThicknessLambda >= 1.0 ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical' },
        ],
      };
    } else if (activeRoute === 'turbine') {
      const defaultTurbineInputs = STEAM_TURBINE_SCENARIOS[0].inputs;
      const res = calculateSteamTurbine(defaultTurbineInputs);
      return {
        simulatorId: 'turbine',
        title: 'Industrial Steam Turbine Reliability & Thermodynamics Audit',
        subtitle: 'Mollier Enthalpy Drop, Willans Steam Consumption, Wilson Line Droplet Erosion, Campbell Blade Resonance, and Governing',
        standards: ['API 612 8th Ed (Special-Purpose Turbines)', 'API 611 5th Ed', 'ASME PTC 6', 'ISO 20816-2:2017', 'NEMA SM 23'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Turbine Type', value: defaultTurbineInputs.turbineType.replace(/_/g, ' ').toUpperCase() },
          { label: 'Shaft Power & Speed', value: `${defaultTurbineInputs.ratedPowerKw} kW at ${defaultTurbineInputs.operatingSpeedRpm} RPM` },
          { label: 'Inlet Conditions', value: `${defaultTurbineInputs.inletPressureBar} bar(a), ${defaultTurbineInputs.inletTemperatureC}°C` },
          { label: 'Exhaust Pressure', value: `${defaultTurbineInputs.exhaustPressureBar} bar(a)` },
          { label: 'Stages & Diameter', value: `${defaultTurbineInputs.numberOfStages} Stages, D = ${defaultTurbineInputs.meanBladeDiameterMm} mm` },
          { label: 'Governing Mode', value: defaultTurbineInputs.governingMode.replace(/_/g, ' ').toUpperCase() },
        ],
        keyResults: [
          { label: 'Isentropic Efficiency (η_s)', value: `${res.isentropicEfficiencyPercent}% (ASR: ${res.actualSteamRateAsrKgKwh} kg/kWh)`, status: (res.isentropicEfficiencyPercent >= 75 ? 'safe' : res.isentropicEfficiencyPercent >= 65 ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical' },
          { label: 'Exhaust Moisture (y)', value: `${res.exhaustMoisturePercent}% (Limit: ${res.maxAllowableMoisturePercent}%)`, status: (res.moistureErosionRiskLevel === 'safe' ? 'safe' : res.moistureErosionRiskLevel === 'warning' ? 'warning' : 'critical') as 'safe' | 'warning' | 'critical' },
          { label: 'Steam Mass Flow', value: `${res.steamMassFlowTonnesHr} t/h (${res.steamMassFlowKgS} kg/s)` },
          { label: 'Critical Speed Margin', value: `${res.criticalSpeedSeparationMarginPercent}% (Separation min ≥ 15%)`, status: (res.isNearCriticalSpeed ? 'critical' : 'safe') as 'safe' | 'warning' | 'critical' },
          { label: 'Campbell Resonance Margin', value: `${res.bladeResonanceMarginPercent}% (NPF: ${res.nozzlePassFrequencyHz} Hz vs f_b: ${defaultTurbineInputs.bladeNaturalFrequencyHz} Hz)`, status: (res.isBladeResonant ? 'critical' : 'safe') as 'safe' | 'warning' | 'critical' },
          { label: 'ISO 20816 Vibration', value: `Zone ${res.iso20816VibrationZone} (${res.shaftRelativeVibrationUmPkPk} µm pk-pk)`, status: (res.iso20816VibrationZone === 'A' || res.iso20816VibrationZone === 'B' ? 'safe' : 'warning') as 'safe' | 'warning' | 'critical' },
        ],
      };
    } else {
      // Default to Bearing fallback if activeRoute is bearing, otherwise alignment
      const defaultBearingInputs = BEARING_SCENARIOS[0].inputs;
      const res = calculateBearingFaults(defaultBearingInputs);
      return {
        simulatorId: 'bearing',
        title: 'Rolling Element Bearing Fault Frequency & Degradation Audit',
        subtitle: 'ISO 281 / Harris Kinematics / High Frequency Demodulated Enveloping',
        standards: ['ISO 281:2007 (Bearing Life)', 'ISO 15243:2017 (Damage Classification)', 'ISO 10816-3'],
        status: res.status,
        auditTrail: res.auditTrail,
        inputSummary: [
          { label: 'Bearing Type', value: defaultBearingInputs.bearingId.toUpperCase() },
          { label: 'Shaft Speed', value: `${defaultBearingInputs.shaftSpeedRpm} RPM` },
          { label: 'Radial Load', value: `${defaultBearingInputs.radialLoadKn} kN` },
          { label: 'Fault Severity', value: `${defaultBearingInputs.faultSeverityPercent}%` },
        ],
        keyResults: [
          { label: 'BPFO Frequency', value: `${res.frequencies.bpfoHz.toFixed(1)} Hz (${res.frequencies.bpfoOrder.toFixed(2)}X)` },
          { label: 'BPFI Frequency', value: `${res.frequencies.bpfiHz.toFixed(1)} Hz (${res.frequencies.bpfiOrder.toFixed(2)}X)` },
          { label: 'Degradation Stage', value: `${res.stage}: ${res.stageDescription}`, status: 'safe' as const },
          { label: 'Overall Vibration', value: `${res.overallVelocityRmsMmS.toFixed(2)} mm/s RMS`, status: 'safe' as const },
          { label: 'ISO 281 L10h Life', value: `${Math.round(res.l10hFatigueHoursRemaining).toLocaleString()} hrs` },
        ],
      };
    }
  }, [activeRoute, isAuditModalOpen, isReportModalOpen, getLiveSimulationReport]);

  const currentSimulatorId = ['pump', 'compressor', 'recip', 'gearbox', 'turbine', 'bearing', 'journal', 'rotor', 'pipe', 'seal', 'alignment'].includes(activeRoute) ? activeRoute : 'pump';

  return (
    <div className="min-h-screen w-full bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/25 selection:text-cyan-200">
      {/* 1. SEO Head Meta Management & JSON-LD Structured Data */}
      <SEO activeRoute={activeRoute} />

      {/* 2. Top Industrial SCADA Header */}
      <Navigation
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* 2b. Secondary Ultra-Thin Context Bar: LiveSimulators Hub › Mechanical Workbench › Turbomachinery › API 610 Pump */}
      <MechanicalContextBar
        simulatorLabel={
          activeRoute === 'pump'
            ? 'API 610 Pump'
            : activeRoute === 'compressor'
            ? 'API 617 Compressor'
            : activeRoute === 'recip'
            ? 'API 618 Recip'
            : activeRoute === 'turbine'
            ? 'API 612 Turbine'
            : activeRoute === 'gearbox'
            ? 'AGMA 2001 Gearbox'
            : activeRoute === 'journal'
            ? 'API 684 Journal Bearing'
            : activeRoute === 'rotor'
            ? 'ISO 1940 Rotor'
            : activeRoute === 'bearing'
            ? 'ISO 281 Bearing'
            : activeRoute === 'pipe'
            ? 'ASME B31.3 Piping'
            : activeRoute === 'seal'
            ? 'API 682 Seal Flush'
            : activeRoute === 'alignment'
            ? 'API 686 Alignment'
            : 'API 610 Pump'
        }
        categoryLabel={
          ['pump', 'compressor', 'turbine', 'gearbox'].includes(activeRoute)
            ? 'Turbomachinery'
            : activeRoute === 'recip'
            ? 'Pumps & Compressors'
            : ['journal', 'rotor', 'bearing'].includes(activeRoute)
            ? 'Vibration & Bearings'
            : 'Piping & Reliability'
        }
        workbenchHref="/mechanical"
        onNavigate={(path) => {
          if (path === '/mechanical' || path.startsWith('/mechanical#')) {
            setActiveRoute('home');
          }
        }}
      />


      {/* 3. Main Workspace with Smooth Scrolling */}
      <main
        id="main-content"
        className="flex-1 w-full min-h-[calc(100dvh-54px)] overflow-x-hidden"
        role="main"
      >
        {activeRoute === 'pump' && (
          <PumpSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'compressor' && (
          <CompressorSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'recip' && (
          <RecipSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'gearbox' && (
          <GearboxSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'turbine' && (
          <SteamTurbineSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'bearing' && (
          <BearingSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'journal' && (
          <JournalSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'rotor' && (
          <RotorSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'pipe' && (
          <PipeStressSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'seal' && (
          <SealPlanSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'alignment' && (
          <AlignmentSimulator
            unitSystem={unitSystem}
            onAuditRequested={() => setIsAuditModalOpen(true)}
            onReportRequested={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
          />
        )}

        {activeRoute === 'workbench' && (
          <MissionControlWorkbench onLaunchSimulator={(id) => setActiveRoute(id)} />
        )}

        {activeRoute === 'portal' && (
          <MechanicalPortalPage />
        )}

        {activeRoute === 'home' && (
          <HomePage
            unitSystem={unitSystem}
            onOpenAudit={() => setIsAuditModalOpen(true)}
            onOpenReport={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenDiagnostics={() => setIsDiagnosticModalOpen(true)}
            onOpenCaseStudies={() => setIsCaseStudiesModalOpen(true)}
            onOpenReliabilityStudio={() => setIsReliabilityStudioOpen(true)}
            onOpenMachineryTrainStudio={() => setIsMachineryTrainStudioOpen(true)}
            onOpenSpectralLab={() => setIsSpectralLabOpen(true)}
            onOpenTransientLab={() => setIsTransientModalOpen(true)}
            onOpenKineticCutaway={() => setIsKineticCutawayOpen(true)}
            onOpenFleetMatrix={() => setIsFleetMatrixOpen(true)}
            onOpenRcaStudio={() => setIsRcaStudioOpen(true)}
            onOpenTribologyLab={() => setIsTribologyLabOpen(true)}
            onOpenMonteCarlo={() => setIsMonteCarloOpen(true)}
            onOpenExergyCarbon={() => setIsExergyCarbonOpen(true)}
          />
        )}

        {['standards', 'methodology', 'faq', 'about'].includes(activeRoute) && (
          <KnowledgeBaseHub />
        )}

        {/* Fallback for other paths to render the home directory */}
        {!['home', 'workbench', 'portal', 'pump', 'compressor', 'recip', 'gearbox', 'turbine', 'bearing', 'journal', 'rotor', 'pipe', 'seal', 'alignment', 'standards', 'methodology', 'faq', 'about'].includes(activeRoute) && (
          <HomePage
            unitSystem={unitSystem}
            onOpenAudit={() => setIsAuditModalOpen(true)}
            onOpenReport={() => setIsReportModalOpen(true)}
            onOpenInfo={() => setIsInfoModalOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenDiagnostics={() => setIsDiagnosticModalOpen(true)}
            onOpenCaseStudies={() => setIsCaseStudiesModalOpen(true)}
            onOpenReliabilityStudio={() => setIsReliabilityStudioOpen(true)}
            onOpenMachineryTrainStudio={() => setIsMachineryTrainStudioOpen(true)}
            onOpenSpectralLab={() => setIsSpectralLabOpen(true)}
            onOpenTransientLab={() => setIsTransientModalOpen(true)}
            onOpenKineticCutaway={() => setIsKineticCutawayOpen(true)}
            onOpenFleetMatrix={() => setIsFleetMatrixOpen(true)}
            onOpenRcaStudio={() => setIsRcaStudioOpen(true)}
            onOpenTribologyLab={() => setIsTribologyLabOpen(true)}
            onOpenMonteCarlo={() => setIsMonteCarloOpen(true)}
            onOpenExergyCarbon={() => setIsExergyCarbonOpen(true)}
          />
        )}
      </main>

      {/* 4. Compact Info & Governing Standards Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        activeSimulator={currentSimulatorId}
      />

      {/* 5. Step-by-Step Mathematical Calculation Audit Modal */}
      <CalculationAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        simulatorTitle={activeReportData.title}
        auditTrail={activeReportData.auditTrail}
      />

      {/* 7. Printable Assessment Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        simulatorTitle={activeReportData.title}
        simulatorSubtitle={activeReportData.subtitle}
        standardsCited={activeReportData.standards}
        status={activeReportData.status}
        auditTrail={activeReportData.auditTrail}
        unitSystem={unitSystem}
        inputSummary={activeReportData.inputSummary}
        keyResults={activeReportData.keyResults}
      />

      {/* 8. Step-Wise Failure Diagnostic Troubleshooter Modal */}
      <DiagnosticWizardModal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        activeSimulator={currentSimulatorId as any}
      />

      {/* 9. Real-World Forensic Incident Case Studies Modal */}
      <CaseStudiesModal
        isOpen={isCaseStudiesModalOpen}
        onClose={() => setIsCaseStudiesModalOpen(false)}
        activeSimulator={currentSimulatorId as any}
      />

      {/* 10. Pillar 3: Predictive Reliability & Lifecycle Analytics Studio Modal */}
      <ReliabilityStudioModal
        isOpen={isReliabilityStudioOpen}
        onClose={() => setIsReliabilityStudioOpen(false)}
        activeSimulator={currentSimulatorId as any}
      />

      {/* 11. Pillar 4: Coupled Machinery Train & Plant Failure Cascade Simulator Modal */}
      <MachineryTrainStudio
        isOpen={isMachineryTrainStudioOpen}
        onClose={() => setIsMachineryTrainStudioOpen(false)}
      />

      {/* 12. Pillar 5: Vibration Spectral Diagnostics & Machinery Condition Monitoring Lab Modal */}
      <SpectralLabModal
        isOpen={isSpectralLabOpen}
        onClose={() => setIsSpectralLabOpen(false)}
      />

      {/* 13. Pillar 6: Cross-Asset Digital Twin Side-by-Side Comparator Modal */}
      <CrossAssetComparatorModal />

      {/* 14. Pillar 7: Transient Machinery Run-Up / Coastdown Dynamic Simulator Modal */}
      <TransientRunUpModal
        isOpen={isTransientModalOpen}
        onClose={() => setIsTransientModalOpen(false)}
      />

      {/* 15. Pillar 8: 3D / Kinetic Machinery Internal Cutaway Inspector Modal */}
      <KineticCutawayModal
        isOpen={isKineticCutawayOpen}
        onClose={() => setIsKineticCutawayOpen(false)}
        initialEquipment={
          activeRoute === 'compressor' || activeRoute === 'gearbox' || activeRoute === 'seal' || activeRoute === 'journal'
            ? activeRoute
            : 'pump'
        }
      />

      {/* 16. Pillar 9: Plant Fleet Health & FMEA / RPN Predictive Maintenance Matrix Modal */}
      <FleetHealthMatrixModal
        isOpen={isFleetMatrixOpen}
        onClose={() => setIsFleetMatrixOpen(false)}
      />

      {/* 17. Pillar 10: Forensic Root Cause Analysis (RCA) & 5-Whys / Fishbone Failure Studio Modal */}
      <RcaStudioModal
        isOpen={isRcaStudioOpen}
        onClose={() => setIsRcaStudioOpen(false)}
        preloadedInvestigation={rcaPreloadCase}
      />

      {/* 18. Pillar 11: Lubrication Tribology, ISO 4406 Cleanliness & Oil Degradation Lab Modal */}
      <TribologyLabModal
        isOpen={isTribologyLabOpen}
        onClose={() => setIsTribologyLabOpen(false)}
      />

      {/* 19. Pillar 12: Monte Carlo Probabilistic Tolerance & Uncertainty Simulator Modal */}
      <MonteCarloModal
        isOpen={isMonteCarloOpen}
        onClose={() => setIsMonteCarloOpen(false)}
      />

      {/* 20. Pillar 13: Machinery Exergy Destruction & Carbon Footprint Simulator Modal */}
      <ExergyCarbonModal
        isOpen={isExergyCarbonOpen}
        onClose={() => setIsExergyCarbonOpen(false)}
      />

      {/* 21. Global CmdK Search with mechanicalSims (Ctrl+K) */}
      <GlobalCmdkSearch
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        mechanicalSims={MECHANICAL_SIMS}
        currentRoute={`/${activeRoute}`}
        onNavigate={(route) => {
          const match = route.match(/(?:\/mechanical\/lab\/|\/)([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            setActiveRoute(match[1] as any);
          } else if (route === '/' || route === '/mechanical' || route.startsWith('/mechanical#')) {
            setActiveRoute('home');
          } else {
            window.location.href = route;
          }
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppShell />
    </AppProvider>
  );
}
