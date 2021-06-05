import {InputHandlers, OutputHandlers, MidiProcessModule} from './webmidiio'

import WebMidi, {Input, Output, InputEventBase, InputEventNoteon, InputEventNoteoff, INoteParam} from 'webmidi'

export interface MidiMetronomeModule extends MidiProcessModule {
    start: () => void;
    defaultOptions: () => MetronomeOptions;
}

export type MetronomeOptions = {
    beats: number[]
    notes: INoteParam[]
    bpm: number
    program: number
    channel: number
}

export function createMetronome(options: MetronomeOptions = {beats: [], notes: [], bpm: 60, program: 16, channel: 16}) : MidiMetronomeModule {
    let beginTime: Date | null = null

    let currentInput: Input | null = null
    let currentOutput: Output | null = null
    let currentBeat: number = 0
    let timer: NodeJS.Timeout | undefined = undefined
    if (options.program === undefined || options.channel < 0 || options.channel > 127) {
        options.program = 16
    }
    if (options.channel === undefined || options.channel < 0 || options.channel > 16) {
        options.channel = 16
    }
    return {
        name: 'metronome',
        defaultOptions: (): MetronomeOptions => {
            return {beats: [], notes: [], bpm: 60, program: 16, channel: 16}
        },
        init: (input?: Input, output?: Output) => {
            currentInput = input ? input : null
            currentOutput = output ? output : null
            currentOutput?.sendProgramChange(options.program, options.channel)
            timer = setInterval(() => {
                currentBeat = currentBeat + 1
                if (currentOutput) {
                    let velocity = 0.25
                    if (options.beats.length > 0) {
                        velocity = options.beats[currentBeat % options.beats.length]
                    }
                    let note: INoteParam = "C3"
                    if (options.notes.length > 0) {
                        note = options.notes[currentBeat % options.notes.length]
                    }
                    currentOutput.playNote(note, 16, {duration: 10, velocity: velocity / 2})
                }
            }, 60 * 1000 / options.bpm)
        },
        destroy: () => {
            if (timer) {
                clearInterval(timer)
            }
            timer = undefined
            currentInput = null
            currentOutput = null
        },
        start: () => {
            beginTime = new Date()
            currentBeat = 0
        },
        input: {
        }
    }
}
