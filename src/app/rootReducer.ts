import { combineReducers } from '@reduxjs/toolkit'

import sheetSlice from './sheetSlice'

const rootReducer = combineReducers({
    sheetSlice: sheetSlice.reducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer
