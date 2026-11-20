import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSwapRequests, type ISwapRequest } from "../../helper/axios";
import { SwapRequestsTab } from "../shifts/SwapRequestsTab";

// For a team leader, the backend returns only swaps between their team's workers.
export const TeamSwapsPanel = () => {
  const [swaps, setSwaps] = useState<ISwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    getSwapRequests().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setSwaps(res.swapRequests);
      } else {
        toast.error(res.message);
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // No clientNames: team leaders can't read clients, so only locations show.
  return (
    <SwapRequestsTab
      swaps={swaps}
      isLoading={isLoading}
      onChanged={() => setReloadKey((k) => k + 1)}
    />
  );
};
