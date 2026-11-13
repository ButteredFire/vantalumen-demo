import { Howl } from 'howler';
import { useCosmosStore } from '../../store/useCosmosStore';

class SurfaceAudioController {
    private static instance: SurfaceAudioController;
    private ambience: Howl | null = null;
    private ambienceId: number | null = null;
    private isPlayingAmbience = false;

    private sounds: {
        popup?: Howl;
        popupImportant?: Howl;
        collapse?: Howl;
        error?: Howl;
        select?: Howl;
        mouseHover: Howl[];
    } = {
        mouseHover: [],
    };

    private constructor() {
        this.initSounds();
    }

    public static getInstance(): SurfaceAudioController {
        if (!SurfaceAudioController.instance) {
            SurfaceAudioController.instance = new SurfaceAudioController();
        }
        return SurfaceAudioController.instance;
    }

    private initSounds() {
        try {
            this.ambience = new Howl({
                src: ['/mars_ambience.mp3'],
                loop: true,
                volume: 0,
                html5: false,
            });

            this.sounds.popup = new Howl({ src: ['/ui_popup.mp3'], volume: 0.08 });
            this.sounds.popupImportant = new Howl({ src: ['/ui_popup_important.mp3'], volume: 0.1 });
            this.sounds.collapse = new Howl({ src: ['/ui_collapse.mp3'], volume: 0.08 });
            this.sounds.error = new Howl({ src: ['/ui_error.mp3'], volume: 0.12 });
            this.sounds.select = new Howl({ src: ['/ui_select.mp3'], volume: 0.08 });

            this.sounds.mouseHover = [
                new Howl({ src: ['/ui_mouse_1.mp3'], volume: 0.04 }),
                new Howl({ src: ['/ui_mouse_2.mp3'], volume: 0.04 }),
                new Howl({ src: ['/ui_mouse_3.mp3'], volume: 0.04 }),
                new Howl({ src: ['/ui_mouse_4.mp3'], volume: 0.04 }),
            ];
        } catch (e) {
            console.warn('SurfaceAudioController initialization error:', e);
        }
    }

    public startAmbience(targetVolume = 0.22, fadeMs = 2500) {
        if (useCosmosStore.getState().audioMuted) return;
        if (!this.ambience) return;

        this.isPlayingAmbience = true;
        if (!this.ambience.playing()) {
            this.ambienceId = this.ambience.play();
            this.ambience.fade(0, targetVolume, fadeMs, this.ambienceId);
        }
    }

    public stopAmbience(fadeMs = 1500) {
        if (!this.ambience || !this.isPlayingAmbience) return;
        this.isPlayingAmbience = false;

        if (this.ambienceId !== null && this.ambience.playing(this.ambienceId)) {
            const currentVol = this.ambience.volume(this.ambienceId) as number;
            this.ambience.fade(currentVol, 0, fadeMs, this.ambienceId);
            setTimeout(() => {
                if (!this.isPlayingAmbience && this.ambienceId !== null) {
                    this.ambience?.stop(this.ambienceId);
                }
            }, fadeMs);
        }
    }

    public updateMuteState(isMuted: boolean) {
        if (isMuted) {
            this.stopAmbience(500);
        } else if (this.isPlayingAmbience) {
            this.startAmbience(0.22, 1000);
        }
    }

    public playHover() {
        if (useCosmosStore.getState().audioMuted) return;
        if (this.sounds.mouseHover.length === 0) return;
        const idx = Math.floor(Math.random() * this.sounds.mouseHover.length);
        this.sounds.mouseHover[idx]?.play();
    }

    public playPopup(important = false) {
        if (useCosmosStore.getState().audioMuted) return;
        if (important) {
            this.sounds.popupImportant?.play();
        } else {
            this.sounds.popup?.play();
        }
    }

    public playCollapse() {
        if (useCosmosStore.getState().audioMuted) return;
        this.sounds.collapse?.play();
    }

    public playSelect() {
        if (useCosmosStore.getState().audioMuted) return;
        this.sounds.select?.play();
    }

    public playError() {
        if (useCosmosStore.getState().audioMuted) return;
        this.sounds.error?.play();
    }
}

export const surfaceAudio = SurfaceAudioController.getInstance();
