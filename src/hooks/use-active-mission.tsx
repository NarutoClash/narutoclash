'use client';

import { useState, useEffect } from 'react';
import type { Mission } from '@/lib/missions-data';

interface UserProfile {
    // ✅ CORRIGIDO: snake_case!
    active_mission?: {
        missionId: string;
        startTime: number;
        endTime: number;
    };
    // other properties
}

export const useActiveMission = (userProfile: UserProfile | null, missionsData: Mission[]) => {
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [progress, setProgress] = useState(0);
    const [hasCheckedTime, setHasCheckedTime] = useState(false);

    // ✅ CORRIGIDO: Usar snake_case aqui!
    const activeMission = userProfile?.active_mission;
    const missionDetails = activeMission ? missionsData.find(m => m.id === activeMission.missionId) : null;
    
    useEffect(() => {
        if (!activeMission || !missionDetails) {
            setHasCheckedTime(true); // No mission, so we are "ready"
            return;
        }
        
        setHasCheckedTime(false); // Reset when a new mission is detected

        const checkInitialTime = () => {
             const now = Date.now();
             const remaining = Math.max(0, activeMission.endTime - now);
             setTimeRemaining(remaining);

             const totalDuration = activeMission.endTime - activeMission.startTime;
             const elapsed = totalDuration - remaining;
             const currentProgress = Math.min(100, (elapsed / totalDuration) * 100);
             setProgress(currentProgress);
             setHasCheckedTime(true); // Mark as checked
        };

        checkInitialTime(); // Initial check

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, activeMission.endTime - now);
            setTimeRemaining(remaining);
            
            const totalDuration = activeMission.endTime - activeMission.startTime;
            const elapsed = totalDuration - remaining;
            const currentProgress = Math.min(100, (elapsed / totalDuration) * 100);
            setProgress(currentProgress);

            if (remaining === 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);

    }, [activeMission, missionDetails]);

    const isMissionComplete = hasCheckedTime && timeRemaining === 0 && !!activeMission;

    return { activeMission, missionDetails, timeRemaining, progress, isMissionComplete };
};