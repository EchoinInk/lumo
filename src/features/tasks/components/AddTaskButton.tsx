import React from 'react';
import { StyleSheet } from 'react-native';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { Plus } from 'lucide-react-native';
import { usePalette } from "@/theme/usePalette";

interface AddTaskButtonProps {
  onPress?: () => void;
}

export function AddTaskButton({ onPress }: AddTaskButtonProps) {
  const palette = usePalette();

  return (
    <FloatingActionButton 
      position="bottom-right"
      onPress={onPress}
    >
      <Plus size={24} color={palette.textPrimary} />
    </FloatingActionButton>
  );
}
