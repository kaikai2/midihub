import {InputHandlers, OutputHandlers, MidiProcessModule} from './webmidiio'

import WebMidi, {Input, Output, InputEventBase, InputEventNoteon, InputEventNoteoff} from 'webmidi'

export interface MidiRepeaterModule extends MidiProcessModule {
}

export function createRepeater(delay: number = 5000) : MidiRepeaterModule {
    let beginTime: Date | null = null
    let notes: {
        [key: number]: InputEventNoteon
    } = {}
    let currentInput: Input | null = null
    let currentOutput: Output | null = null

    return {
        name: 'repeater',
        init: (input?: Input, output?: Output) => {
            currentInput = input ? input : null
            currentOutput = output ? output : null
        },
        destroy: () => {
            currentInput = null
            currentOutput = null
        },
        start: () => {
            beginTime = new Date()
            notes = {}
        },
        input: {
            noteon: (e: InputEventNoteon) => {
                const noteOn = e as InputEventNoteon
                console.log(e)
                notes[noteOn.note.number] = e
                setTimeout(() => {
                    currentOutput?.playNote(e.note.number, "all", {velocity: e.velocity})
                }, delay)
            },
            noteoff: (e: InputEventNoteoff) => {
                const noteOff = e as InputEventNoteoff
                console.log(e)
                //list.push(e)
                const down = notes[noteOff.note.number]
                delete notes[noteOff.note.number]
              
                setTimeout(() => {
                    currentOutput?.stopNote(e.note.number)
                }, delay)
            }
        }
    }
}
