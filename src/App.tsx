import './App.css';
import Sheet from './views/Sheet'
import { createMidiProcessor, MidiProcessor } from './modules/webmidiio'
import { createRecorder, MidiRecorderModule } from './modules/recorder'
import { createMetronome, MidiMetronomeModule } from './modules/metronome'

import React, { useEffect } from 'react'
import {isEqual, minBy, join} from 'lodash'
import MidiDevices from './views/MidiDevices'
import Button from '@material-ui/core/Button'
import Chip from '@material-ui/core/Chip'
import MidiProcessModules from './views/MidiProcessModules'
import {midiNumberToAbcNoteName, slotToAbcDuration, Note} from './modules/midi'
import './modules'

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
K: Emin
`
    let slots: {
      [key: number]: string[]
    } = {}
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
    let maxSlot = 0
    let notes = sequence.forEach((n: Note, index: number) => {
      const timeSinceBegin = n.begin - sequenceBeginTime
      const measureN = timeSinceBegin / measureDuration | 0
      const slotInMeasureN = (timeSinceBegin - measureN * measureDuration) / slotDuration | 0
      const slotN = measureN * slotsPerMeasure + slotInMeasureN
      maxSlot = Math.max(slotN, maxSlot)
      const durationInSlots = n.duration / slotDuration | 0
      const note = `${midiNumberToAbcNoteName(n.n)}${slotToAbcDuration(durationInSlots, beatsPerMeasure, defaultBeatInSlots)}`
      if (slotN in slots) {
        slots[slotN].push(note)
      } else {
        slots[slotN] = [note]
      }
    })
    let newAbcNotation = header
    let measurePerLine = 3
    let numMeasures = 0
    for (let i = 0; i <= maxSlot; i++){
      if (i in slots) {
        newAbcNotation += `[${join(slots[i], '')}]`
      } else {
        newAbcNotation += `z${slotToAbcDuration(1, beatsPerMeasure, defaultBeatInSlots)}`
      }
      if (i % slotsPerMeasure === 0) {
        newAbcNotation += '|'
        numMeasures++
        if (numMeasures % measurePerLine === 0){
          newAbcNotation += '\n'
        }
      }
    }
    setAbcNotation(newAbcNotation)
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
