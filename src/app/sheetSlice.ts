import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type SheetType = {
    abcNotation: string
}

const getInitialState = () : SheetType => {
    let initialState = {
        abcNotation:  `X: 1
T: Cooley's
M: 4/4
L: 1/8
R: reel
K: Emin
|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
|:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|
`
    } as SheetType

    try {
        const sheet = localStorage.getItem('sheet')
        if (sheet !== null) {
            initialState = JSON.parse(sheet)
        }
    } catch (err) {
        console.log('getInitialState: load jobQuery caught err:', err)
    }
    return initialState
}

const updateLocalStorage = (state: SheetType) => {
    try {
        const serializedState = JSON.stringify(state)
        localStorage.setItem('sheet', serializedState)
    } catch(err) {
        // ignore write errors
        console.log('updateLocalStorage: caught err:', err)
    }
}

const sheetSlice = createSlice({
    name: "sheet",
    initialState: getInitialState(),
    reducers: {
        setAbcNotation(state: SheetType, action: PayloadAction<string>) {
            state.abcNotation = action.payload
            updateLocalStorage(state)
        }
    },
})

export type SettingsState = ReturnType<typeof sheetSlice.reducer>
export default sheetSlice

