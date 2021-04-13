import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Container from "@material-ui/core/Container";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import { green } from "@material-ui/core/colors";
import CircularProgress from "@material-ui/core/CircularProgress";
import MuiAlert from "@material-ui/lab/Alert";
import Snackbar from "@material-ui/core/Snackbar";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const DEFAULT_EMAIL = process.env.REACT_APP_DEFAULT_EMAIL;

const useStyles = makeStyles((theme) => ({
  container: {
    height: "100%",
    display: "flex",
    alignItems: "center",
  },
  root: {
    width: "100%",
  },
  input: {
    display: "none",
  },
  buttonProgress: {
    color: green[500],
    marginLeft: theme.spacing(1),
  },
  wrapper: {
    display: "flex",
    alignItems: "center",
    marginTop: theme.spacing(1),
  },
  email: {
    width: "100%",
  },
  selectImage: {
    display: "block",
    marginTop: theme.spacing(1),
  },
}));

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

// https://stackoverflow.com/a/46181
function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function App() {
  const classes = useStyles();

  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [emailValid, setEmailValid] = useState(validateEmail(DEFAULT_EMAIL));
  const [selectedFile, setSelectedFile] = useState();
  const [isFilePicked, setIsFilePicked] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
    setIsFilePicked(true);
  };

  const handleSubmission = async () => {
    setUploading(true);
    const url = new URL(`${API_BASE_URL}get-url`);
    const params = { email, mime: selectedFile.type };
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key])
    );
    const response = await fetch(url, { method: "GET" });
    const { url: signedUrl } = await response.json();

    await fetch(signedUrl, {
      method: "PUT",
      body: selectedFile,
      headers: {
        "Content-Type": selectedFile.type,
      },
    });
    setUploading(false);
    setSnackbarOpen(true);
  };

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="sm" className={classes.container}>
        <div className={classes.root}>
          <TextField
            label="Email"
            value={email}
            onChange={(event) => {
              const email = event.target.value;
              setEmail(email);
              setEmailValid(!!validateEmail(email));
            }}
            error={!emailValid}
            helperText={!emailValid && "Invalid email"}
            className={classes.email}
          />
          <input
            accept="image/*"
            className={classes.input}
            id="contained-button-file"
            multiple
            type="file"
            onChange={changeHandler}
          />
          {isFilePicked && (
            <div>
              <p>Filename: {selectedFile.name}</p>
            </div>
          )}
          <label
            htmlFor="contained-button-file"
            className={classes.selectImage}
          >
            <Button variant="contained" color="primary" component="span">
              Select Image
            </Button>
          </label>
          <div className={classes.wrapper}>
            <Button
              variant="contained"
              color="default"
              className={classes.button}
              startIcon={<CloudUploadIcon />}
              onClick={handleSubmission}
              disabled={!isFilePicked || !emailValid || uploading}
            >
              Upload
            </Button>
            {uploading && (
              <CircularProgress size={24} className={classes.buttonProgress} />
            )}
          </div>
          <Snackbar
            open={snackbarOpen}
            onClose={() => setSnackbarOpen(false)}
            autoHideDuration={6000}
          >
            <Alert severity="success">
              Image uploaded! Check your inbox for converted image
            </Alert>
          </Snackbar>
        </div>
      </Container>
    </React.Fragment>
  );
}

export default App;
