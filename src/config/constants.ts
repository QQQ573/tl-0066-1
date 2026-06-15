export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const COLORS = {
  background: 0x1a1a2e,
  conveyor: 0x4a4a6a,
  conveyorBorder: 0x6a6a8a,
  slotEmpty: 0x2a2a4e,
  slotHighlight: 0x4a9eff,
  text: 0xffffff,
  textSecondary: 0x8888aa,
  success: 0x4ade80,
  error: 0xf87171,
  warning: 0xfbbf24,
  uiPanel: 0x16213e,
  uiBorder: 0x0f3460,
  unpackZone: 0x1e3a5f,
  unpackZoneBorder: 0x3b82f6
};

export const GAME_CONFIG = {
  totalBatches: 12,
  gameDurationSeconds: 480,
  minBoxesPerEndBox: 4,
  maxBoxesPerEndBox: 6,
  displayScorePerCorrect: 100,
  displayScorePenalty: 50,
  consecutiveWrongForRework: 2,
  reworkPenaltySeconds: 30,
  boxSize: 60,
  endBoxWidth: 120,
  endBoxHeight: 80,
  slotWidth: 80,
  slotHeight: 80
};

export const SERIES_COLORS: Record<string, { color: number; borderColor: number }> = {
  LABUBU: { color: 0xff6b9d, borderColor: 0xff4081 },
  DIMOO: { color: 0x4fc3f7, borderColor: 0x0288d1 },
  MOLLY: { color: 0xffd54f, borderColor: 0xffa000 },
  SKULLPANDA: { color: 0xba68c8, borderColor: 0x7b1fa2 },
  HIDDEN: { color: 0xffd700, borderColor: 0xffa000 }
};
