import React from 'react';
import { View, StyleSheet } from 'react-native';
import { QuickActionCard } from '@/components/cards/QuickActionCard';
import { Plus, Clock, CheckCircle, FileText, Cloud } from 'lucide-react-native';
import { createThemedValue } from "@/theme/usePalette";
import { Spacing } from '@/theme/tokens';
import { router } from 'expo-router';

interface QuickAction {
  title: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

interface QuickActionsProps {
  actions?: QuickAction[];
}

const useDefaultActions = createThemedValue((palette): QuickAction[] => [
  { 
    title: 'Add Task', 
    icon: <Plus size={24} color={palette.textPrimary} />,
    onPress: () => router.push({ pathname: '/(tabs)/tasks' as const } as any),
  },
  { 
    title: 'Start Focus', 
    icon: <Clock size={24} color={palette.textPrimary} />,
    onPress: () => router.push({ pathname: '/(tabs)/more/focus' as const } as any),
  },
  { 
    title: 'Log Habit', 
    icon: <CheckCircle size={24} color={palette.textPrimary} />,
    onPress: () => router.push({ pathname: '/(tabs)/more/habits' as const } as any),
  },
  { 
    title: 'Brain Dump', 
    icon: <Cloud size={24} color={palette.textPrimary} />,
    onPress: () => router.push({ pathname: '/brain-dump' as const } as any),
  },
]);

export function QuickActions({ actions: suppliedActions }: QuickActionsProps) {
  const defaultActions = useDefaultActions();

  const actions = suppliedActions ?? defaultActions;
  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <View key={index} style={styles.actionWrapper}>
          <QuickActionCard 
            title={action.title}
            icon={action.icon}
            onPress={action.onPress}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionWrapper: {
    flex: 1,
    minWidth: '45%',
  },
});
