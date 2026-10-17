import '@testing-library/jest-dom/vitest';
import { MotionGlobalConfig } from 'motion/react';

// Instantly resolve animations in test environment so AnimatePresence transitions synchronously
MotionGlobalConfig.skipAnimations = true;
