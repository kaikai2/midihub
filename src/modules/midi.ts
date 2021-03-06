
const noteNameIndex: string[] = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B']
const octaves: string[] = ['C,,,,', 'C,,,', 'C,,', 'C,', 'C', 'c', "c'", "c''", "c'''"]
const octaveMiddle: number = 60 // Middle C 
const firstNote: number = 21 // A0
const lastNote : number = 108 // C8

// TODO: keySignature determines abcnotenames. e.g. in D, 
// type keySignature = 'C' | 'D' | 'Dmin' 

// const noteNameIndex: string[] = []

export function midiNumberToAbcNoteName(n: number/*, keySig: number*/): string {
    if (n < firstNote || n > lastNote) {
        return 'C,,,,' // still return something, but obviously outside the keyboard
    }
    let noteName = noteNameIndex[(n - octaveMiddle + 120) % 12]
    let octave = octaves[(n - 12) / 12 | 0]
    if (octave[0] === 'c') {
        noteName = noteName.toLowerCase()
    }
    octave = octave.slice(1)
    return `${noteName}${octave}`
}

export function slotToAbcDuration(slots: number, beatsPerMeasure: number, defaultBeatDurationInSlots: number): string {
    if (slots === defaultBeatDurationInSlots) {
        return ''
    }
    if (slots % defaultBeatDurationInSlots === 0) {
        return `${slots / defaultBeatDurationInSlots}`
    }
    return `${slots}/${defaultBeatDurationInSlots}`
}

export type Note = {
    n: number, // note number
    begin: number, // noteon timestamp relative to record start
    duration: number, // 
    velocity: number, // velocity 
}
