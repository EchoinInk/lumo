import { useTasks } from "../hooks/useTasks";
import { TaskFormModal } from "./TaskFormModal";

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Compatibility wrapper for callers that still use the historical add-only
 * modal. The canonical form owns field validation and only closes after the
 * durable task mutation resolves.
 */
export function AddTaskModal({ visible, onClose }: AddTaskModalProps) {
  const { createTask } = useTasks();

  return (
    <TaskFormModal
      visible={visible}
      mode="create"
      onSubmit={async (input) => {
        await createTask(input);
      }}
      onClose={onClose}
    />
  );
}
