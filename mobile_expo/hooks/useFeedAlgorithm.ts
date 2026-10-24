import { useState, useEffect, useCallback } from 'react';
import { RankedFeedItem, SwipeInteractionPayload, UserAffinityProfile } from '../../backend_fastapi/schemas/feed';

export function useFeedAlgorithm() {
  const [rankedItems, setRankedItems] = useState<RankedFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userAffinity, setUserAffinity] = useState<Record<string, number>>({});

  const fetchRankedFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/feed/ranked');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRankedItems(data);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankedFeed();
  }, [fetchRankedFeed]);

  const recordInteraction = useCallback(async (telemetry: SwipeInteractionPayload) => {
    try {
      const res = await fetch('/api/feed/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry),
      });
      const updatedProfile: UserAffinityProfile = await res.json();
      setUserAffinity(updatedProfile.affinities);
    } catch (err) {
      console.error('Failed to record telemetry:', err);
    }
  }, []);

  return {
    rankedItems,
    isLoading,
    activeIndex,
    setActiveIndex,
    recordInteraction,
    userAffinity,
    refreshFeed: fetchRankedFeed,
  };
}
