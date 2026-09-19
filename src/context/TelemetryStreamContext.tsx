import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { StreamStatus, StreamCadence, TelemetryPacket } from '../types';

interface TelemetryStreamContextType {
  status: StreamStatus | null;
  lastPacket: TelemetryPacket | null;
  secondsRemaining: number;
  isTriggering: boolean;
  isConnected: boolean;
  latestNotification: string | null;
  triggerNow: () => Promise<TelemetryPacket | null>;
  changeCadence: (cadence: StreamCadence) => Promise<void>;
  dismissNotification: () => void;
  openStreamModal: () => void;
  closeStreamModal: () => void;
  isStreamModalOpen: boolean;
}

const TelemetryStreamContext = createContext<TelemetryStreamContextType | undefined>(undefined);

export const TelemetryStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [lastPacket, setLastPacket] = useState<TelemetryPacket | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latestNotification, setLatestNotification] = useState<string | null>(null);
  const [isStreamModalOpen, setIsStreamModalOpen] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch status on startup
  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.getStreamStatus();
      setStatus(res.status);
      setSecondsRemaining(res.status.secondsRemaining);
      if (res.status.recentPackets.length > 0) {
        setLastPacket(res.status.recentPackets[res.status.recentPackets.length - 1]);
      }
    } catch (err) {
      console.warn('[SCADA Stream] Status fetch warning:', err);
    }
  }, []);

  // Connect SSE
  useEffect(() => {
    fetchStatus();

    const connectSSE = () => {
      try {
        const es = new EventSource('/api/stream/telemetry');
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
        };

        es.addEventListener('connected', (e: MessageEvent) => {
          setIsConnected(true);
          try {
            const data = JSON.parse(e.data);
            setStatus(data);
            setSecondsRemaining(data.secondsRemaining);
          } catch (err) {
            console.error('Error parsing connected event:', err);
          }
        });

        es.addEventListener('status_update', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setStatus(data);
            setSecondsRemaining(data.secondsRemaining);
          } catch (err) {
            console.error('Error parsing status_update:', err);
          }
        });

        es.addEventListener('telemetry_tick', (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            const packet: TelemetryPacket = payload.packet;
            setLastPacket(packet);
            if (payload.status) {
              setStatus(payload.status);
              setSecondsRemaining(payload.status.secondsRemaining);
            }

            const notif = `📡 New 5-Min SCADA Telemetry Ingested: ${packet.zonesCount} zones updated (${packet.timestamp}). Database & risk models refreshed.`;
            setLatestNotification(notif);

            // Dispatch global browser event so any listening view can refresh without full remount
            window.dispatchEvent(new CustomEvent('scada-telemetry-packet', { detail: packet }));

            setTimeout(() => {
              setLatestNotification((current) => (current === notif ? null : current));
            }, 8000);
          } catch (err) {
            console.error('Error parsing telemetry_tick:', err);
          }
        });

        es.onerror = () => {
          setIsConnected(false);
          es.close();
          // Retry connection after 5 seconds
          setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.error('EventSource connection error:', err);
        setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    // Local 1-second countdown ticker
    countdownTimerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [fetchStatus]);

  // Manually trigger a 5-minute packet
  const triggerNow = async (): Promise<TelemetryPacket | null> => {
    try {
      setIsTriggering(true);
      const res = await api.triggerTelemetryPacket();
      setLastPacket(res.packet);
      setStatus(res.status);
      setSecondsRemaining(res.status.secondsRemaining);

      const notif = `⚡ 5-Minute SCADA Burst Generated: Packet #${res.packet.packetId} (${res.packet.timestamp}) recorded.`;
      setLatestNotification(notif);

      window.dispatchEvent(new CustomEvent('scada-telemetry-packet', { detail: res.packet }));

      setTimeout(() => {
        setLatestNotification((current) => (current === notif ? null : current));
      }, 7000);

      return res.packet;
    } catch (err: any) {
      console.error('Failed to trigger telemetry packet:', err);
      setLatestNotification(`⚠️ Telemetry trigger failed: ${err.message}`);
      return null;
    } finally {
      setIsTriggering(false);
    }
  };

  const changeCadence = async (cadence: StreamCadence) => {
    try {
      const res = await api.setStreamCadence(cadence);
      setStatus(res.status);
      setSecondsRemaining(res.status.secondsRemaining);
    } catch (err: any) {
      console.error('Failed to update cadence:', err);
    }
  };

  const dismissNotification = () => setLatestNotification(null);
  const openStreamModal = () => setIsStreamModalOpen(true);
  const closeStreamModal = () => setIsStreamModalOpen(false);

  return (
    <TelemetryStreamContext.Provider
      value={{
        status,
        lastPacket,
        secondsRemaining,
        isTriggering,
        isConnected,
        latestNotification,
        triggerNow,
        changeCadence,
        dismissNotification,
        openStreamModal,
        closeStreamModal,
        isStreamModalOpen,
      }}
    >
      {children}
    </TelemetryStreamContext.Provider>
  );
};

export const useTelemetryStream = () => {
  const context = useContext(TelemetryStreamContext);
  if (!context) {
    throw new Error('useTelemetryStream must be used within a TelemetryStreamProvider');
  }
  return context;
};
