import React from 'react';

export interface GameResult {
  score: number;
  durationSeconds: number;
  metrics?: Record<string, any>;
}

export interface GameConfig {
  difficulty: number;
  patientId?: string;
  speak: (text: string) => void;
  onBack: () => void;
  onComplete: (result: GameResult) => void;
  content?: any;
  regionTag?: string;
}

export interface GameModule {
  id: string;
  name: string;
  category: 'memory' | 'matching_sorting' | 'culture_movement';
  categoryLabel: string;
  description: string;
  icon: string;
  instructions_audio_text: string;
  render: (config: GameConfig) => React.ReactElement;
}
