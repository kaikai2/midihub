import React from 'react'

import { connect } from 'react-redux'

import { createStyles, Theme, makeStyles } from '@material-ui/core/styles'
import { RootState } from '../app/rootReducer'

import {MidiProcessor} from '../modules/webmidiio'
import Button from '@material-ui/core/Button'
import Popover from '@material-ui/core/Popover'
import Typography from '@material-ui/core/Typography'
import Radio from '@material-ui/core/Radio'
import FormGroup from '@material-ui/core/FormGroup'
import Checkbox from '@material-ui/core/Checkbox'

import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'

const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        width: '100%',
    },
    marginTop: {
        marginTop: 8,
    },
    barNoAnimation: {
        animation: 'none'
    },
    typography: {
      padding: theme.spacing(2),
    },
}))
type MidiProcessModulesProps = {
    processor: MidiProcessor | undefined
}

const MidiProcessModules : React.FC<MidiProcessModulesProps> = (props) => {
    const classes = useStyles()
    const [anchorEl, setAnchorEl] = React.useState<HTMLInputElement|null>(null)
    
    const handleClick = (event: any) => {
        setAnchorEl(event.currentTarget)
    }

    const open = Boolean(anchorEl)
    const id = open ? 'simple-popover' : undefined
    const [inputDeviceName, setInputDeviceName] = React.useState('')
    const [outputDeviceName, setOutputDeviceName] = React.useState('')
  
    const handleInputDeviceNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputDeviceName(event.target.value)
    }
    const handleOutputDeviceNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOutputDeviceName(event.target.value)
    }
    const handleClose = () => {
        setAnchorEl(null)
        props.processor?.switchInputOutput(inputDeviceName, outputDeviceName)
    }
    return(
        <>
        <Button onClick={handleClick}
            variant="outlined">
            Select MIDI process modules
        </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Typography className={classes.typography}>Select from the available MIDI process modules here:</Typography>
        <FormControl component="fieldset">
            <FormLabel component="legend">MIDI process modules:</FormLabel>
            <FormGroup>
            {props.processor?.availableModule().map(moduleName => {
                const moduleIsInstalled = props.processor?.installedModule().find((m) => m.name == moduleName) !== undefined
                const handleChange = (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
                    if (checked) {
                        props.processor?.installModule(moduleName)
                    } else {
                        props.processor?.uninstallModule(moduleName)
                    }
                }
                return (
                <>
                    <FormControlLabel
                        control={<Checkbox checked={moduleIsInstalled} onChange={handleChange} name={moduleName}/>}
                        label={moduleName}
                    />
                </>
            )})}
            </FormGroup>
        </FormControl>
      </Popover>
      </>
    )
}
const mapStateToProps = (state: RootState) => ({
    sheet: state.sheetSlice
})

export default connect(mapStateToProps, null)(MidiProcessModules) as unknown as React.FC<MidiProcessModulesProps>
