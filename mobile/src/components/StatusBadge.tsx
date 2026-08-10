import { DemandStatus } from "@/types/demand";
import { statusColor, statusLabel } from "@/utils/statusLabel";
import { Badge } from "./Badge";

export function StatusBadge({ status }: { status: DemandStatus }) {
  return <Badge label={statusLabel[status]} color={statusColor[status]} />;
}
