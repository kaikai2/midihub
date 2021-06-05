import './App.css';
import Sheet from './views/Sheet'
import { createMidiProcessor, MidiProcessor } from './modules/webmidiio'
import { createRecorder, MidiRecorderModule } from './modules/recorder'
import { createMetronome, MidiMetronomeModule } from './modules/metronome'

import React, { useEffect } from 'react'
import {isEqual, minBy, join, filter} from 'lodash'
import MidiDevices from './views/MidiDevices'
import Button from '@material-ui/core/Button'
import Chip from '@material-ui/core/Chip'
import MidiProcessModules from './views/MidiProcessModules'
import {midiNumberToAbcNoteName, slotToAbcDuration, Note} from './modules/midi'
import './modules'

type MeasureNotation = {
  measureIndex: number
  notations: string
}

type Slots =  {
  [key: number]: Note[]
}
function App() {
  
  const [midiProcessor, setMidiProcessor] = React.useState<undefined | MidiProcessor>(undefined)
  const [recorder, setRecorder] = React.useState<undefined | MidiRecorderModule>(undefined)
  const [metronome, setMetronome] = React.useState<undefined | MidiMetronomeModule>(undefined)
  useEffect(() => {
    let newProcessor = createMidiProcessor()
    let aRecorder = newProcessor.installModule<MidiRecorderModule>('recorder')
    let aMetronome = newProcessor.installModule<MidiMetronomeModule>('metronome', {beats: [0.25, 0.1, 0.15, 0.1], notes: ["C3", "G2", "A2", "G2"], bpm: 60})
    setMidiProcessor(newProcessor)
    setRecorder(aRecorder)
    setMetronome(aMetronome)
    return () => {
      setRecorder(undefined)
      setMetronome(undefined)
      setMidiProcessor(undefined)
      newProcessor.destroy()
    }
  }, [])
  
  const [sequence, setSequence] = React.useState<Note[]>([])
  const recordStart = () => {
    recorder?.start()
    metronome?.start()
  }
  const [sequenceBeginTime, setSequenceBeginTime] = React.useState(0)
  useEffect(()=>{
    const handle = setInterval(() => {
      const newSequence = recorder ? recorder.getSequence() : []
      setSequence(prevSequence => {
        if (isEqual(newSequence, prevSequence)) {
          return prevSequence
        } else {
          const beginTime = minBy(newSequence, 'begin')
          if (beginTime !== undefined) {
            setSequenceBeginTime(beginTime.begin)
          }
          return newSequence
        }
      })
    }, 1000)
    return () => {
      clearInterval(handle)
    }
  }, [recorder])
  const [abcNotation, setAbcNotation] = React.useState(`X: 1
T: Test
M: 4/4
L: 1/8
R: reel
K: D
|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
|:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|
`)
  useEffect(() => {
    const header = `X: 1
T: Cooley's
M: 4/4
L: 1/8
R: reel
K: D`
    const bpm = 60
    const msPerMinute = 60 * 1000
    const beatsPerMeasure = 4
    const measureDuration = msPerMinute * beatsPerMeasure / bpm | 0 // in ms
    const beatDuration = msPerMinute / bpm | 0 // in ms
    const defaultBeat = 4 // 1/4 notes as the default
    const resolution = 8 // minimal using 1/8 notes
    const slotDuration = beatDuration * defaultBeat / resolution | 0
    const slotsPerMeasure = beatsPerMeasure * resolution / defaultBeat | 0
    const defaultBeatInSlots = resolution / defaultBeat | 0
    let voices = []
    function processVoice(maxSlot: number, slots: Slots) : MeasureNotation[] {
      let newAbcNotation = ''
      let numMeasures = 0
      let measures: MeasureNotation[] = []
      let lastSlotReaches = 0
      for (let i = 0; i <= maxSlot; i++){
        if (i > 0 && i % slotsPerMeasure === 0) {
          // newAbcNotation += '|'
          if (i > lastSlotReaches) {
            newAbcNotation += `z${slotToAbcDuration(i - lastSlotReaches, beatsPerMeasure, defaultBeatInSlots)}`
          }
          measures.push({
            measureIndex: numMeasures,
            notations: newAbcNotation
          })
          newAbcNotation = ''
          numMeasures++
          lastSlotReaches = i
        }
        if (i in slots && slots[i].length > 0) {
          if (i > lastSlotReaches) {
            newAbcNotation += `z${slotToAbcDuration(i - lastSlotReaches, beatsPerMeasure, defaultBeatInSlots)}`
          }
          let maxDurationsInSlots = 0
          const notes = slots[i].map((n: Note) => {
            const durationInSlots = (n.duration + slotDuration - 1) / slotDuration | 0
            const note = `${midiNumberToAbcNoteName(n.n)}${slotToAbcDuration(durationInSlots, beatsPerMeasure, defaultBeatInSlots)}`
            maxDurationsInSlots = Math.max(maxDurationsInSlots, durationInSlots)
            return note
          })
          if (notes.length > 1){
            newAbcNotation += `[${join(notes, '')}]`
          } else {
            newAbcNotation += notes[0]
          }
          lastSlotReaches = i + maxDurationsInSlots
        } else {
          // newAbcNotation += `z${slotToAbcDuration(1, beatsPerMeasure, defaultBeatInSlots)}`
        }
      }
      if (newAbcNotation.length > 0){
        measures.push({
          measureIndex: numMeasures,
          notations: newAbcNotation
        })
        numMeasures++
      }
      return measures
    }
    function processAll(sequence: Note[]): string {
      let maxSlot = 0
      let slots: Slots = {}
      let notes = sequence.forEach((n: Note, index: number) => {
        const timeSinceBegin = n.begin - sequenceBeginTime
        const measureN = (timeSinceBegin + slotDuration / 2) / measureDuration | 0
        const slotInMeasureN = Math.max(0, timeSinceBegin - measureN * measureDuration) / slotDuration | 0
        const slotN = measureN * slotsPerMeasure + slotInMeasureN

        maxSlot = Math.max(slotN, maxSlot)
        if (slotN in slots) {
          slots[slotN].push(n)
        } else {
          slots[slotN] = [n]
        }
      })
      const measurePerLine = 3

      let treble8: Slots = {}
      let bass: Slots = {}
      const octaveMiddle = 60 // Middle C
      for (let i = 0; i <= maxSlot; i++){
        if (i in slots) {
          treble8[i] = filter(slots[i], (n)=> n.n >= octaveMiddle)
          bass[i] = filter(slots[i], (n)=> n.n < octaveMiddle)
        }
      }
      const treble8Measures = processVoice(maxSlot, treble8)
      const bassMeasures = processVoice(maxSlot, bass)

      const trebleHeader = 'V:T1  clef=treble-8  name="Tenore I"   snm="T.I"'
      const bassHeader = 'V:B1  clef=bass      name="Basso I"    snm="B.I"  octave=-2'

      let abcNotation = `${header}
%%score (T1) (B1)
${trebleHeader}
${bassHeader}
`
      const numMeasures = Math.max(treble8Measures.length, bassMeasures.length)
      for (let i = 0; i < numMeasures; i += measurePerLine){
        abcNotation += `% ${i + 1}\n`
        abcNotation += `[V:T1]${treble8Measures.slice(i, i + measurePerLine).map(m => m.notations).join(' | ')} |\n`
        abcNotation += `[V:B1]${bassMeasures.slice(i, i + measurePerLine).map(m => m.notations).join(' | ')} |\n`
      }

      return abcNotation
    }
    setAbcNotation(processAll(sequence))
  }, [sequence, sequenceBeginTime])
  return (
    <div className="App">
      <header className="App-header">
        Connect to your MIDI device and play.
      </header>
      <MidiDevices processor={midiProcessor}/>
      <MidiProcessModules processor={midiProcessor}/>
      <Button color="primary" variant="contained" onClick={recordStart}>Record</Button>
      <Sheet abcNotation={abcNotation} setAbcNotation={setAbcNotation}/>
      {sequence.map((n: Note, index: number) => (
        <Chip key={index} label={`${midiNumberToAbcNoteName(n.n)} ${((n.begin - sequenceBeginTime) / 1000).toFixed(2)} - ${(n.duration / 1000).toFixed(2)}`}/>
      ))}
    </div>
  );
}

export default App;
