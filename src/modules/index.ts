
import {registerMidiProcessModule, MidiProcessModuleFactory} from './webmidiio'

import {createRecorder} from './recorder'
import {createRepeater} from './repeater'
import {createMetronome} from './metronome'

registerMidiProcessModule('recorder', createRecorder as MidiProcessModuleFactory)
registerMidiProcessModule('repeater', createRepeater as MidiProcessModuleFactory)
registerMidiProcessModule('metronome', createMetronome as MidiProcessModuleFactory)
