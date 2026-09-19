import { GoogleGenAI, Type } from '@google/genai';
import { LeakResult } from '../database/db';

export interface AiInvestigationReport {
  title: string;
  anomaly_summary: string;
  why_suspicious: string;
  estimated_impact: string;
  priority_explanation: string;
  recommended_inspection_action: string;
  suggested_pipeline_segment: string;
  worker_instructions: string;
  disclaimer: string;
}

export async function generateInvestigationReport(
  leak: LeakResult & {
    readings?: any[];
  }
): Promise<AiInvestigationReport> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const hasValidApiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_') && apiKey.length > 5);

  if (hasValidApiKey && apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are Nexora AI, an advanced municipal water network intelligence assistant.
Analyze this suspected municipal water anomaly and generate an AI-Assisted Investigation Recommendation.
Do NOT claim to have physically confirmed a leak; use terms like "potential leak", "suspected leak", and "estimated water loss".

Network Anomaly Data:
- Zone: ${leak.zone}
- Priority Rank: #${leak.rank || 1} (${leak.status})
- Prototype Leak Risk Score: ${leak.priority_score}/100
- Leak Confidence: ${leak.confidence}%
- Estimated Water Loss: ${leak.estimated_loss.toLocaleString()} L/day
- Pressure Anomaly: ${leak.pressure_anomaly}% drop below expected baseline
- Flow Anomaly: +${leak.flow_anomaly}% increase above expected baseline
- Coordinates: ${leak.latitude || '30.3501'}, ${leak.longitude || '76.8302'}
- Latest Actual Pressure: ${leak.actual_pressure || '34.0'} bar (Expected: ${leak.expected_pressure || '50.0'} bar)
- Latest Actual Flow: ${leak.actual_flow || '131.0'} m³/h (Expected: ${leak.expected_flow || '100.0'} m³/h)

Provide a thorough, professional municipal engineering assessment matching the required JSON schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              anomaly_summary: {
                type: Type.STRING,
                description: 'Concise summary of the pressure and flow anomaly',
              },
              why_suspicious: {
                type: Type.STRING,
                description: 'Detailed mechanical and hydraulic reasons why this indicates a suspected leak',
              },
              estimated_impact: {
                type: Type.STRING,
                description: 'Estimated daily water loss impact and localized pressure deficit',
              },
              priority_explanation: {
                type: Type.STRING,
                description: 'Justification for the priority assignment and risk score',
              },
              recommended_inspection_action: {
                type: Type.STRING,
                description: 'Actionable acoustic correlator / ground sensor deployment recommendation',
              },
              suggested_pipeline_segment: {
                type: Type.STRING,
                description: 'Specific sub-corridor or pipeline junction to inspect first (e.g. Zone B12-B13 trunk line)',
              },
              worker_instructions: {
                type: Type.STRING,
                description: 'Concise field instructions for the maintenance and dispatch team',
              },
            },
            required: [
              'anomaly_summary',
              'why_suspicious',
              'estimated_impact',
              'priority_explanation',
              'recommended_inspection_action',
              'suggested_pipeline_segment',
              'worker_instructions',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      if (parsed.anomaly_summary) {
        return {
          title: 'AI-Assisted Investigation Recommendation',
          anomaly_summary: parsed.anomaly_summary,
          why_suspicious: parsed.why_suspicious,
          estimated_impact: parsed.estimated_impact,
          priority_explanation: parsed.priority_explanation,
          recommended_inspection_action: parsed.recommended_inspection_action,
          suggested_pipeline_segment: parsed.suggested_pipeline_segment,
          worker_instructions: parsed.worker_instructions,
          disclaimer:
            'AI-Assisted Investigation Recommendation. Physical confirmation by a qualified field engineer is required. Measurements reflect prototype estimated water loss.',
        };
      }
    } catch (error) {
      console.warn('Gemini API call failed, using intelligent domain fallback:', error);
    }
  }

  // Fallback / Mock AI generation tailored specifically to the leak data
  return getIntelligentFallbackReport(leak);
}

function getIntelligentFallbackReport(leak: LeakResult): AiInvestigationReport {
  const isHighOrCritical = leak.status === 'CRITICAL' || leak.status === 'HIGH';
  const pipeline = `Pipeline corridor ${leak.zone}-${leak.zone.charAt(0)}${Number(leak.zone.slice(1)) + 1 || 'Trunk'}`;

  return {
    title: 'AI-Assisted Investigation Recommendation',
    anomaly_summary: `Zone ${leak.zone} exhibits a sustained pressure reduction of ${leak.pressure_anomaly}% combined with an abnormal flow surge of +${leak.flow_anomaly}% against expected municipal operating baselines.`,
    why_suspicious: `The simultaneous divergence of downward hydraulic head pressure and sustained positive flow anomaly over consecutive observation cycles is a signature indicator of an unmetered discharge or subterranean main rupture rather than diurnal consumption peaks.`,
    estimated_impact: `Potential water loss is estimated at approximately ${leak.estimated_loss.toLocaleString()} L/day. Continued unmitigated discharge threatens localized structural soil subsidence and downstream service pressure degradation.`,
    priority_explanation: `Designated as #${leak.rank || 1} ${leak.status} priority with a Prototype Leak Risk Score of ${leak.priority_score}/100 and ${leak.confidence}% confidence due to high loss volume and acute hydraulic gradient drop.`,
    recommended_inspection_action: `Deploy mobile acoustic listening sticks and correlate ultrasonic leak loggers along ${pipeline}. Verify PRV (pressure reducing valve) telemetry and isolate feeder gate valves if audible cavitation or surfacing is detected.`,
    suggested_pipeline_segment: `Inspect the ${pipeline} primary distribution segment, specifically check joint junctions within 250 meters of telemetry sensor node ${leak.zone}.`,
    worker_instructions: `Safety briefing: Beware of softened asphalt or road sub-base erosion. Equip acoustic correlation sensors, verify isolation valve accessibility, and report ground moisture observations immediately to dispatch.`,
    disclaimer:
      'AI-Assisted Investigation Recommendation. Physical confirmation by a qualified field engineer is required. Measurements reflect prototype estimated water loss.',
  };
}
