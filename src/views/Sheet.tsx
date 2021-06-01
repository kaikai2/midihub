import React from 'react'

import { connect } from 'react-redux'

import { createStyles, Theme, makeStyles } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Abcjs from 'react-abcjs'
import abcjs from 'abcjs'

//import abcjs from "abcjs"
//import 'abcjs/abcjs-audio.css'
import { RootState } from '../app/rootReducer'

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
    paper: {
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.secondary,
      position: 'relative'
    },
}))
type SheetProps = {
    abcNotation: string
    setAbcNotation?: (newAbcNotation: string) => void
}

const Sheet : React.FC<SheetProps> = (props) => {
    const classes = useStyles()
    const clickListener = (abcelem: any, tuneNumber: number, classes: any[], analysis: any, drag: any) => {
        console.log(abcelem, tuneNumber, classes, analysis, drag)
    } 
    const textInput = React.useRef(null);
    React.useEffect(() => {
        if (textInput && textInput.current){
            //new abcjs.Editor((textInput.current as any).id, {})
        }
    }, [textInput])
    return (
        <Container>
        <Grid container spacing={3}>
            <Grid item xs={8}>
                <Paper className={classes.paper}>
                    <Abcjs abcNotation={props.abcNotation}
                    parserParams={{}}
                    engraverParams={{ responsive: 'resize' }}
                    renderParams={{ 
                        viewportHorizontal: true, 
                        dragging: true, 
                        clickListener: clickListener,
                        selectTypes: ["author",
                        "bar",
                        "brace",
                        "clef",
                        "composer",
                        "dynamicDecoration",
                        "ending",
                        "extraText",
                        "freeText",
                        "keySignature",
                        "note",
                        "part",
                        "partOrder",
                        "rhythm",
                        "slur",
                        "subtitle",
                        "tempo",
                        "timeSignature",
                        "title",
                        "unalignedWords",
                        "voiceName"]
                    }}
                    
                    />
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <TextField
                id="outlined-multiline-static"
                inputRef={textInput}
                label="Multiline"
                multiline
                fullWidth
                rows={30}
                variant="outlined"
                value={props.abcNotation}
                onChange={(e) => props.setAbcNotation && props.setAbcNotation(e.target.value)}
                onSelect={(e) => {
                    console.log('onSelect', e)
                }}
                onSelectCapture={(e) => {
                    console.log('onSelectCapture', e)
                }}
                />
            </Grid>
        </Grid>
        </Container>
    )
}
const mapStateToProps = (state: RootState) => ({
    sheet: state.sheetSlice
})

export default connect(mapStateToProps, null)(Sheet) as unknown as React.FC<SheetProps>
