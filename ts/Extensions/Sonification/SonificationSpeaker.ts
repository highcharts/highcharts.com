/* *
 *
 *  (c) 2009-2022 Øystein Moseng
 *
 *  Class representing a speech synthesis voice.
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import U from '../../Shared/Utilities.js';
const {
    pick
} = U;

namespace SonificationSpeaker {
    export interface SpeakerOptions {
        name?: string;
        language?: string;
        pitch?: number;
        rate?: number;
        volume?: number;
    }
}


/**
 * The SonificationSpeaker class. This class represents an announcer using
 * speech synthesis. It allows for scheduling speech announcements, as well
 * as speech parameter changes - including rate, volume and pitch.
 *
 * @sample highcharts/demo/sonification-navigation
 *         Demo using SonificationSpeaker directly for some announcements
 *
 * @requires modules/sonification
 *
 * @class
 * @name Highcharts.SonificationSpeaker
 *
 * @param {Highcharts.SonificationSpeakerOptionsObject} options
 *        Configuration for the speaker
 */
class SonificationSpeaker {
    private synthesis: SpeechSynthesis;
    private voice?: SpeechSynthesisVoice;
    private scheduled: number[];
    private masterVolume = 1;

    constructor(private options: SonificationSpeaker.SpeakerOptions) {
        this.synthesis = window.speechSynthesis;
        if (typeof speechSynthesis.onvoiceschanged !== 'undefined') {
            speechSynthesis.onvoiceschanged = this.setVoice.bind(this);
        }
        this.setVoice();
        this.scheduled = [];
    }


    /**
     * Say a message using the speaker voice. Interrupts other currently
     * speaking announcements from this speaker.
     * @function Highcharts.SonificationSpeaker#say
     * @param {string} message The message to speak.
     * @param {SonificationSpeakerOptionsObject} [options]
     * Optionally override spaker configuration.
     */
    say(message: string, options?: SonificationSpeaker.SpeakerOptions): void {
        if (this.synthesis) {
            this.synthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(message);
            if (this.voice) {
                utterance.voice = this.voice;
            }

            utterance.rate = options && options.rate || this.options.rate || 1;
            utterance.pitch = options && options.pitch ||
                this.options.pitch || 1;
            utterance.volume = pick(options && options.volume,
                this.options.volume, 1) * this.masterVolume;

            this.synthesis.speak(utterance);
        }
    }


    /**
     * Schedule a message using the speaker voice.
     * @function Highcharts.SonificationSpeaker#sayAtTime
     * @param {number} time
     * The time offset to speak at, in milliseconds from now.
     * @param {string} message
     * The message to speak.
     * @param {SonificationSpeakerOptionsObject} [options]
     * Optionally override spaker configuration.
     */
    sayAtTime(
        time: number,
        message: string,
        options?: SonificationSpeaker.SpeakerOptions
    ): void {
        this.scheduled.push(
            setTimeout(this.say.bind(this, message, options), time)
        );
    }


    /**
     * Clear scheduled announcements, and stop current speech.
     * @function Highcharts.SonificationSpeaker#cancel
     */
    cancel(): void {
        this.scheduled.forEach(clearTimeout);
        this.scheduled = [];
        this.synthesis.cancel();
    }


    /**
     * Stop speech and release any used resources
     * @private
     */
    destroy(): void {
        // Ran on TimelineChannel.destroy
        // (polymorphism with SonificationInstrument).
        // Currently all we need to do is cancel.
        this.cancel();
    }


    /**
     * Set speaker overall/master volume modifier. This affects all
     * announcements, and applies in addition to the individual announcement
     * volume.
     * @function Highcharts.SonificationSpeaker#setMasterVolume
     * @param {number} vol Volume from 0 to 1.
     */
    setMasterVolume(vol: number): void {
        this.masterVolume = vol;
    }


    /**
     * Set the active synthesis voice for the speaker.
     * @private
     */
    private setVoice(): void {
        if (this.synthesis) {
            const name = this.options.name,
                lang = this.options.language || 'en-US',
                voices = this.synthesis.getVoices(),
                len = voices.length;
            let langFallback;
            for (let i = 0; i < len; ++i) {
                if (name && voices[i].name === name) {
                    this.voice = voices[i];
                    return;
                }
                if (!langFallback && voices[i].lang === lang) {
                    langFallback = voices[i];
                    if (!name) {
                        break;
                    }
                }
            }
            this.voice = langFallback;
        }
    }
}


/* *
 *
 *  Default Export
 *
 * */

export default SonificationSpeaker;


/* *
 *
 *  API declarations
 *
 * */

/**
 * Configuration for a SonificationSpeaker.
 * @requires modules/sonification
 * @interface Highcharts.SonificationSpeakerOptionsObject
 *//**
 * Name of the voice synthesis to use. If not found, reverts to the default
 * voice for the language chosen.
 * @name Highcharts.SonificationSpeakerOptionsObject#name
 * @type {string|undefined}
 *//**
 * The language of the voice synthesis. Defaults to `"en-US"`.
 * @name Highcharts.SonificationSpeakerOptionsObject#language
 * @type {string|undefined}
 *//**
 * The pitch modifier of the voice. Defaults to `1`. Set higher for a higher
 * voice pitch.
 * @name Highcharts.SonificationSpeakerOptionsObject#pitch
 * @type {number|undefined}
 *//**
 * The speech rate modifier. Defaults to `1`.
 * @name Highcharts.SonificationSpeakerOptionsObject#rate
 * @type {number|undefined}
 *//**
 * The speech volume, from 0 to 1. Defaults to `1`.
 * @name Highcharts.SonificationSpeakerOptionsObject#volume
 * @type {number|undefined}
 */

(''); // Keep above doclets in JS file
