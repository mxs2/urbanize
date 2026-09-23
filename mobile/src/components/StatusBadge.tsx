import { DemandStatus } from "@/types/demand";
import { statusColor, statusLabel } from "@/utils/statusLabel";
import { Badge } from "./Badge";

export function StatusBadge({ status, testID }: { status: DemandStatus; testID?: string }) {
  return <Badge testID={testID} label={statusLabel[status]} color={statusColor[status]} />;
}
