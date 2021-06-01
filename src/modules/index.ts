
import {registerMidiProcessModule, MidiProcessModuleFactory} from './webmidiio'

import {createRecorder} from './recorder'
import {createRepeater} from './repeater'

registerMidiProcessModule('recorder', createRecorder as MidiProcessModuleFactory)
registerMidiProcessModule('repeater', createRepeater as MidiProcessModuleFactory)
