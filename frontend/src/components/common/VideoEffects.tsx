import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Track, LocalVideoTrack } from 'livekit-client';
import { useLocalParticipant } from '@livekit/components-react';
import { Sparkles, CircleSlash, Loader2 } from 'lucide-react';

/**
 * Camera effects for a live interview — background blur, and a replacement
 * background.
 *
 * Requested 2026-08-31 during a real interview (fb_1788181374): "There is no
 * filter to blur the background for both parties." A candidate sitting at home
 * should not have to show the room they are in to attend a job interview.
 *
 * WHY THE ASSETS ARE OURS
 *
 * The segmentation runs on MediaPipe, and the library's DEFAULT is to fetch its
 * WebAssembly from cdn.jsdelivr.net and its model from storage.googleapis.com —
 * at the moment a person switches the effect on, from their own browser.
 *
 * For this platform that is wrong twice over. It would mean every interview
 * participant's browser making a call to two third parties, and it would simply
 * not work: this network already blocks outbound STUN, so betting an interview
 * feature on a CDN reachable from a government desk is a bet that loses. Both
 * files are therefore served from the platform itself, and ASSET_PATHS below is
 * what makes that so. If those files are ever missing, the effect fails to
 * start and the toggle says so — it does not silently reach for the internet.
 *
 * WHY IT IS OFF BY DEFAULT
 *
 * Segmentation runs on every frame. On a modest laptop — which is what a
 * candidate is likely to have — that competes with the call itself. The person
 * chooses to pay that cost; nobody pays it for them.
 *
 * WHAT THIS DOES NOT DO
 *
 * It changes the video the OTHER side receives, because it is applied to the
 * published track. That is the point: a CSS filter would only change what you
 * see of yourself and would leave the room on show to the interviewer.
 */

/** Served by the platform. See public/mediapipe/. */
const ASSET_PATHS = {
    tasksVisionFileSet: '/mediapipe/wasm',
    modelAssetPath: '/mediapipe/selfie_segmenter.tflite',
};

export type EffectMode = 'none' | 'blur-light' | 'blur-strong' | 'image';

const BLUR_RADIUS: Record<string, number> = { 'blur-light': 8, 'blur-strong': 20 };

interface Props {
    /** Optional replacement background served by the platform. */
    backgroundImage?: string;
    compact?: boolean;
}

const VideoEffects: React.FC<Props> = ({ backgroundImage, compact = false }) => {
    const { localParticipant } = useLocalParticipant();
    const [mode, setMode] = useState<EffectMode>('none');
    const [busy, setBusy] = useState(false);
    const [supported, setSupported] = useState<boolean | null>(null);
    const [failed, setFailed] = useState<string | null>(null);
    const processorRef = useRef<any>(null);

    // Capability probe. Loaded lazily so a browser that cannot do this never
    // downloads the library, and neither does anyone who does not open a call.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const mod = await import('@livekit/track-processors');
                if (!cancelled) setSupported(mod.supportsBackgroundProcessors());
            } catch {
                if (!cancelled) setSupported(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const cameraTrack = useCallback((): LocalVideoTrack | null => {
        const pub = localParticipant?.getTrackPublication(Track.Source.Camera);
        const track = pub?.track;
        return track && track instanceof LocalVideoTrack ? track : null;
    }, [localParticipant]);

    const apply = useCallback(async (next: EffectMode) => {
        const track = cameraTrack();
        if (!track) {
            setFailed('Turn your camera on first.');
            return;
        }
        setBusy(true);
        setFailed(null);
        try {
            const mod = await import('@livekit/track-processors');

            if (next === 'none') {
                await track.stopProcessor();
                processorRef.current = null;
                setMode('none');
                return;
            }

            const options = next === 'image'
                ? { mode: 'virtual-background' as const, imagePath: backgroundImage! }
                : { mode: 'background-blur' as const, blurRadius: BLUR_RADIUS[next] };

            if (processorRef.current?.switchTo) {
                // Switching in place avoids the flicker of tearing the processor
                // down and building a new one mid-conversation.
                await processorRef.current.switchTo(options);
            } else {
                const processor = mod.BackgroundProcessor({ ...options, assetPaths: ASSET_PATHS });
                await track.setProcessor(processor);
                processorRef.current = processor;
            }
            setMode(next);
        } catch (err) {
            console.error('Video effect failed to start', err);
            // Say what actually happened. "Something went wrong" would send
            // somebody to IT for a missing file on our own server.
            setFailed('This effect could not start on this device.');
            try { await cameraTrack()?.stopProcessor(); } catch { /* already gone */ }
            processorRef.current = null;
            setMode('none');
        } finally {
            setBusy(false);
        }
    }, [backgroundImage, cameraTrack]);

    // Never leave a processor running on a track after this control unmounts.
    useEffect(() => () => {
        const track = cameraTrack();
        if (processorRef.current && track) {
            track.stopProcessor().catch(() => { /* the call is already over */ });
        }
    }, [cameraTrack]);

    if (supported === false) {
        return (
            <span style={{ fontSize: 12, color: '#94A3B8' }}>
                Background effects are not available in this browser
            </span>
        );
    }
    if (supported === null) return null;

    const options: { key: EffectMode; label: string }[] = [
        { key: 'none', label: 'No effect' },
        { key: 'blur-light', label: 'Blur' },
        { key: 'blur-strong', label: 'Strong blur' },
        ...(backgroundImage ? [{ key: 'image' as EffectMode, label: 'Background' }] : []),
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {!compact && (
                <Sparkles size={14} style={{ color: '#5EEAD4' }} aria-hidden="true" />
            )}
            <div role="radiogroup" aria-label="Camera background effect"
                 style={{ display: 'flex', gap: 4 }}>
                {options.map(opt => {
                    const active = mode === opt.key;
                    return (
                        <button
                            key={opt.key}
                            role="radio"
                            aria-checked={active}
                            disabled={busy}
                            onClick={() => apply(opt.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                fontSize: 12.5, fontWeight: 600, padding: '5px 10px',
                                borderRadius: 8, cursor: busy ? 'wait' : 'pointer',
                                border: `1px solid ${active ? '#14B8A6' : 'rgba(148,163,184,0.35)'}`,
                                background: active ? 'rgba(20,184,166,0.16)' : 'transparent',
                                color: active ? '#5EEAD4' : '#CBD5E1',
                            }}
                        >
                            {busy && active
                                ? <Loader2 size={12} className="animate-spin" />
                                : opt.key === 'none' ? <CircleSlash size={12} /> : null}
                            {opt.label}
                        </button>
                    );
                })}
            </div>
            {failed && (
                <span role="alert" style={{ fontSize: 12, color: '#FCA5A5' }}>{failed}</span>
            )}
        </div>
    );
};

export default VideoEffects;
