import { createContext, JSXElement, useContext } from "solid-js";

import { Sounds, TypeSounds, useState } from "@revolt/state";
import deafenSound from "../../public/assets/sounds/deafen.ogg";
import messageSound from "../../public/assets/sounds/message_sound.ogg";
import muteSound from "../../public/assets/sounds/mute.ogg";
import ringtoneIncomingSound from "../../public/assets/sounds/ringtone_incoming.ogg";
import ringtoneOutgoingSound from "../../public/assets/sounds/ringtone_outgoing.ogg";
import streamEndSound from "../../public/assets/sounds/stream_end.ogg";
import streamStartSound from "../../public/assets/sounds/stream_start.ogg";
import streamViewerJoinSound from "../../public/assets/sounds/stream_viewer_join.ogg";
import streamViewerLeaveSound from "../../public/assets/sounds/stream_viewer_leave.ogg";
import undeafenSound from "../../public/assets/sounds/undeafen.ogg";
import unmuteSound from "../../public/assets/sounds/unmute.ogg";
import userJoinVoiceSound from "../../public/assets/sounds/user_join_voice.ogg";
import userLeaveVoiceSound from "../../public/assets/sounds/user_leave_voice.ogg";
import userMovedSound from "../../public/assets/sounds/user_moved.ogg";

/**
 * A controller class for making sure sounds are managed in one place and to prevent undesirable sound overlaps
 */
export class SoundController {
  readonly soundState: Sounds;

  node?: HTMLAudioElement;

  lastPlayedSound?: keyof TypeSounds;

  private audioContext?: AudioContext;

  private readonly fallbackAssetSize = 3740;

  constructor(soundState: Sounds) {
    this.soundState = soundState;

    this.isPlaying = this.isPlaying.bind(this);
    this.canPlay = this.canPlay.bind(this);
    this.playSound = this.playSound.bind(this);
  }

  /**
   * Get whether a sound is currently being played by the sound controller
   *
   * @returns Whether a sound is currently playing
   */
  isPlaying(): boolean {
    return this.node ? !this.node.paused : false;
  }

  /**
   * Get whether a sound can be played right now
   *
   * @param newSound Sound to check for playability
   * @returns Whether the sound passed is playable currently
   */
  canPlay(newSound: keyof TypeSounds): boolean {
    // Never let a sound turned off play
    if (!this.soundState.enabled(newSound)) {
      return false;
    }

    // Always let the sound play if nothing is currently playing
    if (!this.isPlaying()) {
      return true;
    }

    // If there are any cases where you don't want sound collisions, put them here.
    // None for now.
    return true;
  }

  /**
   * Play a sound, following the rules of sound playability unless force is true
   *
   * @param sound The sound to play
   * @param force Bypass canPlay check
   * @returns Whether the sound played
   */
  playSound(sound: keyof TypeSounds, force?: boolean): boolean {
    if (!force && !this.canPlay(sound)) {
      return false;
    }
    let source: string;
    switch (sound) {
      case "deafen": {
        source = deafenSound;
        break;
      }
      case "message": {
        source = messageSound;
        break;
      }
      case "mute": {
        source = muteSound;
        break;
      }
      case "ringtoneIncoming": {
        source = ringtoneIncomingSound;
        break;
      }
      case "ringtoneOutgoing": {
        source = ringtoneOutgoingSound;
        break;
      }
      case "streamEnd": {
        source = streamEndSound;
        break;
      }
      case "streamStart": {
        source = streamStartSound;
        break;
      }
      case "streamViewerJoin": {
        source = streamViewerJoinSound;
        break;
      }
      case "streamViewerLeave": {
        source = streamViewerLeaveSound;
        break;
      }
      case "undeafen": {
        source = undeafenSound;
        break;
      }
      case "unmute": {
        source = unmuteSound;
        break;
      }
      case "userJoinVoice": {
        source = userJoinVoiceSound;
        break;
      }
      case "userLeaveVoice": {
        source = userLeaveVoiceSound;
        break;
      }
      case "userMoved": {
        source = userMovedSound;
        break;
      }
    }
    this.lastPlayedSound = sound;
    void this.playSource(sound, source);
    return true;
  }

  /** Play official audio when available, or a procedural tone for fallback placeholders. */
  private async playSource(sound: keyof TypeSounds, source: string) {
    try {
      const response = await fetch(source);
      const audio = await response.arrayBuffer();
      if (audio.byteLength === this.fallbackAssetSize) {
        await this.playFallbackTone(sound);
        return;
      }

      this.node = new Audio(source);
      await this.node.play();
    } catch (error) {
      console.warn(`[sounds] Failed to play ${sound}`, error);
    }
  }

  /** Generate a compact notification sound without depending on private brand assets. */
  private async playFallbackTone(sound: keyof TypeSounds) {
    this.audioContext ??= new AudioContext();
    await this.audioContext.resume();

    const context = this.audioContext;
    const rising = [
      "userJoinVoice",
      "streamStart",
      "streamViewerJoin",
      "unmute",
      "undeafen",
    ].includes(sound);
    const falling = [
      "userLeaveVoice",
      "streamEnd",
      "streamViewerLeave",
      "mute",
      "deafen",
    ].includes(sound);
    const frequencies = rising ? [440, 660] : falling ? [660, 440] : [520, 520];

    frequencies.forEach((frequency, index) => {
      const start = context.currentTime + index * 0.11;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.11);
    });
  }
}

const soundContext = createContext(null! as SoundController);

export function SoundContext(props: { children: JSXElement }) {
  const { sounds } = useState();

  const controller = new SoundController(sounds);

  return (
    <soundContext.Provider value={controller}>
      {props.children}
    </soundContext.Provider>
  );
}

export function useSound(): SoundController {
  return useContext(soundContext);
}
