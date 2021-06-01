import React from 'react'

import { connect } from 'react-redux'

import { createStyles, Theme, makeStyles } from '@material-ui/core/styles'
import { RootState } from '../app/rootReducer'

import {MidiProcessor} from '../modules/webmidiio'
import Button from '@material-ui/core/Button'
import Popover from '@material-ui/core/Popover'
import Typography from '@material-ui/core/Typography'
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

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
type MidiDevicesProps = {
    processor: MidiProcessor | undefined
}

const MidiDevices : React.FC<MidiDevicesProps> = (props) => {
    const classes = useStyles()
    const [anchorEl, setAnchorEl] = React.useState<HTMLInputElement|null>(null);
    
    const handleClick = (event: any) => {
        setAnchorEl(event.currentTarget);
    };


    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;
    const [inputDeviceName, setInputDeviceName] = React.useState('');
    const [outputDeviceName, setOutputDeviceName] = React.useState('');
  
    const handleInputDeviceNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputDeviceName(event.target.value);
    };
    const handleOutputDeviceNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOutputDeviceName(event.target.value);
    };
    const handleClose = () => {
        setAnchorEl(null);
        props.processor?.switchInputOutput(inputDeviceName, outputDeviceName)
    };
    return(
        <>
        <Button onClick={handleClick}
            variant="outlined">
            Select MIDI device
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
        <Typography className={classes.typography}>Select from the available MIDI devices here:</Typography>
        <FormControl component="fieldset">
            <FormLabel component="legend">MIDI devices for input:</FormLabel>
            <RadioGroup aria-label="gender" name="gender1" value={inputDeviceName} onChange={handleInputDeviceNameChange}>
                <FormControlLabel value="" control={<Radio />} label="None" />
            {props.processor?.getInputDevices().map(element => (
                <>
                <FormControlLabel value={element.name} control={<Radio />} label={element.name} />
                </>
            ))}
            </RadioGroup>
        </FormControl><FormControl component="fieldset">
            <FormLabel component="legend">MIDI devices for output:</FormLabel>
            <RadioGroup aria-label="gender" name="gender1" value={outputDeviceName} onChange={handleOutputDeviceNameChange}>
                <FormControlLabel value="" control={<Radio />} label="None" />
            {props.processor?.getOutputDevices().map(element => (
                <>
                <FormControlLabel value={element.name} control={<Radio />} label={element.name} />
                </>
            ))}
            </RadioGroup>
        </FormControl>
      </Popover>
      </>
    )
}
const mapStateToProps = (state: RootState) => ({
    sheet: state.sheetSlice
})

export default connect(mapStateToProps, null)(MidiDevices) as unknown as React.FC<MidiDevicesProps>
