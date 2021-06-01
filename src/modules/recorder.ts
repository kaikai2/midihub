import {MidiProcessModule} from './webmidiio'

import {InputEventNoteon, InputEventNoteoff} from 'webmidi'

import { Note } from './midi'

export interface MidiRecorderModule extends MidiProcessModule {
    start: () => void;
    getSequence: () => Note[];
}

export function createRecorder() : MidiRecorderModule {
    let beginTime: Date | null = null
    let notes: {
        [key: number]: InputEventNoteon
    } = {}
    let sequence: Note[] = []
    return {
        name: 'recorder',
        start: () => {
            beginTime = new Date()
            notes = {}
            sequence = []
        },
        input: {
            noteon: (e: InputEventNoteon) => {
                notes[e.note.number] = e
            },
            noteoff: (e: InputEventNoteoff) => {
                const now = new Date()
                let eOn = notes[e.note.number]
                delete notes[e.note.number]
                const dtime = now.getTime() - e.timestamp
                const noteOnTime = dtime + eOn.timestamp - (beginTime ? beginTime.getTime() : 0)
                const r = {n: e.note.number, begin: noteOnTime, duration: e.timestamp - eOn.timestamp, velocity: eOn.velocity}
                sequence.push(r)
                console.log('Recorded:', r)
            }
        },
        getSequence: () => {
            return [...sequence]
        }
    }
}
