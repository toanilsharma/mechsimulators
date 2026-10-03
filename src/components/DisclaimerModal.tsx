import React from 'react';

export const DISCLAIMER_TEXT =
  "Engineering educational and screening simulation tool only. Numerical outputs are theoretical approximations computed via generalized physical equations (64-bit ODEs, 2D Reynolds lubrication); real-world machinery accuracy varies with manufacturing tolerances, thermal distortions, sensor drift, and operational wear. Not affiliated with, endorsed by, or sponsored by API, ISO, ASME, AGMA, HI, or any standards organization. Standards codes are cited under nominative fair use. Always verify calculations against certified OEM datasheets and validate with a licensed Professional Engineer before making operational, design, or safety-critical decisions.";

interface DisclaimerModalProps {
  isOpen?: boolean;
  onAccept?: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = () => {
  return null;
};
