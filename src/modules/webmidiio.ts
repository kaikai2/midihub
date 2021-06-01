import {keys} from 'lodash'

import WebMidi, {
    Input,
    Output,
    InputEventBase,
    InputEventNoteon,
    InputEventNoteoff,
    WebMidiEventConnected,
    WebMidiEventDisconnected
} from 'webmidi'

WebMidi.enable(function (err) {

  if (err) {
    console.log("WebMidi could not be enabled.", err);
  } else {
    console.log("WebMidi enabled!");
    console.log(WebMidi.inputs);
    console.log(WebMidi.outputs);
  }
  if (WebMidi.inputs.length === 0){
      return
  }
  console.log(WebMidi.inputs[0].id)
  let output: Output = WebMidi.outputs[0];
/*
  // Playing a note (note number 60, all channels, half velocity) 
  output.playNote(60, "all", {velocity: 0.5});
  output.playNote(60, "all", {velocity: 0.5, duration: 1000});    // duration 1 sec.

  // Use note name and octave (3rd octave C, on all channels)
  output.playNote("C3");

  // Specifying a channel (3)
  output.playNote(60, 3);

  // Stopping a playing note 
  output.stopNote(60);

  // Send control change value 127 to controller 1 (modulation) on all 
  // channels.
  output.sendControlChange(1, 127, "all");

  // Send channel aftertouch (half pressure) to the 3rd output device, on 
  // channel 8
  output.sendChannelAftertouch(0.5, 8, {pressure: 0.5});

  // Send pitch bend (between -1 and 1) 
  output.sendPitchBend(-0.5); 
 */
  let keyStatus: {
    [key: number]: InputEventBase<any>
   } = {}

  function playLater(e: InputEventBase<any>){

  }
  let list: InputEventBase<any>[] = []
  function play() {
    console.log('play')
    if (list.length === 0){
      return
    }
    let beginTime = list[0].timestamp
    list.forEach(e => {
      if(e.type === 'noteon') {
        const noteOn = e as InputEventNoteon
        setTimeout(() => {
          output.playNote(noteOn.note.number, "all", {velocity: noteOn.velocity, duration: 1000})
        }, e.timestamp - beginTime)
      }
    })
    list = []
  }
  let delay: number = 5000
  let input: Input = WebMidi.inputs[0];
  // Listening for a 'note on' message (on all channels) 

  input.addListener('pitchbend', "all", e => {
    console.log(e)
  });
});

export interface InputHandlers {
    noteon?: (e: InputEventNoteon) => void;
    noteoff?: (e: InputEventNoteoff) => void;
}

export interface OutputHandlers {
    good?: () => boolean;
}

export interface MidiProcessModule {
    name: string;
    input?: InputHandlers;
    output?: OutputHandlers;
    init?: (input?: Input, output?: Output) => void;
    destroy?: () => void;
    start?: () => void;
    stop?: () => void;
}

function defultMidiProcessModule(){
    return {} as MidiProcessModule
}

export interface MidiProcessor {
    switchInputOutput: (inputDeviceName: string, outputDeviceName: string) => void;
    installModule: <M extends MidiProcessModule>(name: string, options?: any) => M | undefined;
    uninstallModule: (name: string) => void;
    destroy: () => void;
    getInputDevices: () => Input[];
    getOutputDevices: () => Output[];

    installedModule: () => MidiProcessModule[];
    availableModule: () => string[];
}

export type MidiProcessModuleFactory = (options: any) => MidiProcessModule

let gMidiProcessFactory: {
    [name: string]: MidiProcessModuleFactory
} = {}

export function registerMidiProcessModule(name: string, factory: MidiProcessModuleFactory) : void {
    gMidiProcessFactory[name] = factory
}

export function createMidiProcessor() : MidiProcessor {
    let modules: MidiProcessModule[] = []
    let currentInput: Input | undefined = undefined
    let currentOutput: Output | undefined = undefined

    function _installModule(midiModule: MidiProcessModule, input?: Input, output?: Output) {
        if (typeof midiModule.init === "function"){
            midiModule.init(input, output)
        }
        if (typeof midiModule.input === "object") {
            const inputHandler = midiModule.input
            if (typeof inputHandler.noteon === "function") {
                input?.addListener('noteon', 'all', inputHandler.noteon)
            }
            if (typeof inputHandler.noteoff === "function") {
                input?.addListener('noteoff', 'all', inputHandler.noteoff)
            }
        }
    }
    function _uninstallModule(midiModule: MidiProcessModule, input?: Input, output?: Output) {
        if (typeof midiModule.input === "object"){
            const inputHandler = midiModule.input
            if (typeof inputHandler.noteon === "function") {
                input?.removeListener('noteon', 'all', inputHandler.noteon)
            }
            if (typeof inputHandler.noteoff === "function") {
                input?.removeListener('noteoff', 'all', inputHandler.noteoff)
            }
        }
        if (typeof midiModule.destroy === "function"){
            midiModule.destroy()
        }
    }
    function onMidiDeviceConnected(e: WebMidiEventConnected) {
        console.log('connected', e)
    }
    function onMidiDeviceDosconnected(e: WebMidiEventDisconnected) {
        console.log('disconnected', e)
        if (currentInput?.id === e.port.id || currentOutput?.id === e.port.id) {
            _uninstallAllModules()
        }
    }
    function _register() {
        WebMidi.addListener('connected', onMidiDeviceConnected)
        WebMidi.addListener('disconnected', onMidiDeviceDosconnected)
    }
    function _unregister() {
        WebMidi.removeListener('connected', onMidiDeviceConnected)
        WebMidi.removeListener('disconnected', onMidiDeviceDosconnected)
    }
    if (!WebMidi.enabled){
        WebMidi.enable(function(){
            _register()
        })
    } else {
        _register()
    }
    function _installAllModules() {
        modules.forEach(m => {
            _installModule(m, currentInput, currentOutput)
        })
    }
    function _uninstallAllModules() {
        modules.forEach(m => {
            _uninstallModule(m, currentInput, currentOutput)
        })
    }
    return {
        switchInputOutput: (inputDeviceName: string, outputDeviceName: string) => {
            let newInput = currentInput
            let newOutput = currentOutput
            WebMidi.inputs.forEach(element => {
                if (element.name === inputDeviceName){
                    newInput = element
                }
            })
            WebMidi.outputs.forEach(element => {
                if (element.name === outputDeviceName){
                    newOutput = element
                }
            })
            if (newInput !== currentInput || newOutput !== currentOutput){
                _uninstallAllModules()
                currentInput = newInput
                currentOutput = newOutput
                _installAllModules()
            }
        },
        installModule: <M extends MidiProcessModule>(name: string, options: any) : M | undefined => {
            const factory = gMidiProcessFactory[name]
            if (factory) {
                const midiModule = factory(options);
                _installModule(midiModule, currentInput, currentOutput)
                modules.push(midiModule)
                return midiModule as M
            }
            return undefined
        },
        uninstallModule: (name: string) => {
            const midiModule = modules.find((m) => m.name === name)
            if (midiModule !== undefined){
                modules = modules.filter((m) => m.name !== name)
                _uninstallModule(midiModule, currentInput, currentOutput)
            }
        },
        destroy: () => {
            _uninstallAllModules()
            _unregister()
        },
        getInputDevices: (): Input[] => {
            return WebMidi.inputs
        },
        getOutputDevices: (): Output[] => {
            return WebMidi.outputs
        },
        installedModule: (): MidiProcessModule[] => {
            // TODO:
            return []
        },
        availableModule: (): string[] => {
            return keys(gMidiProcessFactory)
        }
    }
}

