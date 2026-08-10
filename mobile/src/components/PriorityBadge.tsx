import { DemandPriority } from "@/types/demand";
import { priorityColor, priorityLabel } from "@/utils/priorityLabel";
import { Badge } from "./Badge";

export function PriorityBadge({ priority }: { priority: DemandPriority }) {
  return <Badge label={priorityLabel[priority]} color={priorityColor[priority]} />;
}
