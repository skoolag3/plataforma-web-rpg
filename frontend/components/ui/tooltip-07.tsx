import { Button } from "@/components/ui/tooltip-07-utils/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip-07-utils/tooltip";

export function Tooltip07() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent className="dark">
        Light tooltip via dark class
      </TooltipContent>
    </Tooltip>
  );
}

export default Tooltip07;
