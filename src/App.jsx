import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { AcctHtml } from "./components/AcctHtml";
import profileImg from './assets/avatars/default.0.webp'; // relative path to image
import profileImg1 from './assets/avatars/default.1.webp'; // relative path to image
import profileImg2 from './assets/avatars/default.2.webp'; // relative path to image
import profileImg3 from './assets/avatars/default.3.webp'; // relative path to image
import profileImg4 from './assets/avatars/default.4.webp'; // relative path to image
import profileImg5 from './assets/avatars/default.5.webp'; // relative path to image
import profileImg6 from './assets/avatars/default.6.webp'; // relative path to image
import profileImg7 from './assets/avatars/default.7.webp'; // relative path to image
import profileImg8 from './assets/avatars/default.8.webp'; // relative path to image
//import { RegisterStatus, CONNECT_STATUS, useSIPProvider } from "react-sipjs";
//import "./App.css";
import moment from "moment";
//import * as SIP from "sip.js";

import { Strophe, $pres, $iq, $msg } from "strophe.js";

import { useState, useEffect } from "react";

import data from "./lang/en";
import { UserAgent } from "sip.js";

// Global Settings
// ===============
const appversion = "0.3.26";
const sipjsversion = "0.20.0";
const navUserAgent = window.navigator.userAgent; // TODO: change to Navigator.userAgentData
const instanceID = String(Date.now());
const localDB = window.localStorage;

function getDbItem(itemIndex, defaultValue) {
  if (localDB.getItem(itemIndex) != null) return localDB.getItem(itemIndex);
  return defaultValue;
}

let userAgent = null;
let jid = null;

//let lang = {}
let lang = data;

let profileUserID = getDbItem("profileUserID", null); // Internal reference ID. (DON'T CHANGE THIS!)
//let profileName = getDbItem("profileName", null); // eg: Keyla James
//let wssServer = getDbItem("wssServer", "127.0.0.1"); // eg: raspberrypi.local
//let WebSocketPort = getDbItem("WebSocketPort", 8088); // eg: 444 | 4443
//let ServerPath = getDbItem("ServerPath", ""); // eg: /ws
//let SipDomain = getDbItem("SipDomain", "127.0.0.1"); // eg: raspberrypi.local
//let SipUsername = getDbItem("SipUsername", "1000"); // eg: webrtc
//let SipPassword = getDbItem("SipPassword", "1000"); // eg: webrtc

let wssServer = getDbItem("wssServer", null);
let WebSocketPort = getDbItem("WebSocketPort", null);
let ServerPath = getDbItem("ServerPath", "");
let SipUsername = getDbItem("SipUsername", null);
let SipPassword = getDbItem("SipPassword", null);
let SipDomain = getDbItem("SipDomain", null);

let profileName = getDbItem("profileName", null);
let VoicemailDid = getDbItem("VoicemailDid", null);
let XmppServer = getDbItem("XmppServer", "");
let XmppWebsocketPort = getDbItem("XmppWebsocketPort", null);
let XmppWebsocketPath = getDbItem("XmppWebsocketPath", null);
let XmppDomain = getDbItem("XmppDomain", null);

let profileUser = getDbItem("profileUser", null);

let xmpp_username = profileUser + "@" + XmppDomain; // Xmpp Doesnt like Uppercase
xmpp_username = xmpp_username.toLowerCase();

let SingleInstance = getDbItem("SingleInstance", "1") == "1"; // Un-registers this account if the phone is opened in another tab/window

let TransportConnectionTimeout = parseInt(
  getDbItem("TransportConnectionTimeout", 15)
); // The timeout in seconds for the initial connection to make on the web socket port
let TransportReconnectionAttempts = parseInt(
  getDbItem("TransportReconnectionAttempts", 999)
); // The number of times to attempt to reconnect to a WebSocket when the connection drops.
let TransportReconnectionTimeout = parseInt(
  getDbItem("TransportReconnectionTimeout", 3)
); // The time in seconds to wait between WebSocket reconnection attempts.

let SubscribeToYourself = getDbItem("SubscribeToYourself", "0") == "1"; // Enable Subscribe to your own uri. (Useful to understand how other buddies see you.)
let VoiceMailSubscribe = getDbItem("VoiceMailSubscribe", "1") == "1"; // Enable Subscribe to voicemail
//let VoicemailDid = getDbItem("VoicemailDid", ""); // Number to dial for VoicemialMain()
let SubscribeVoicemailExpires = parseInt(
  getDbItem("SubscribeVoicemailExpires", 300)
); // Voceimail Subscription expiry time (in seconds)
let ContactUserName = getDbItem("ContactUserName", ""); // Optional name for contact header uri
let userAgentStr = getDbItem(
  "UserAgentStr",
  "Browser Phone " +
    appversion +
    " (SIPJS - " +
    sipjsversion +
    ") " +
    navUserAgent
);

// Presence / Subscribe
// ====================
function SubscribeAll() {
  if (!userAgent.isRegistered()) return;

  // if(VoiceMailSubscribe){
  //     SubscribeVoicemail();
  // }
  // if(SubscribeToYourself){
  //     SelfSubscribe();
  // }

  // // Start subscribe all
  // if(userAgent.BlfSubs && userAgent.BlfSubs.length > 0){
  //     UnsubscribeAll();
  // }
  // userAgent.BlfSubs = [];
  // if(Buddies.length >= 1){
  //     console.log("Starting Subscribe of all ("+ Buddies.length +") Extension Buddies...");
  //     for(var b=0; b<Buddies.length; b++) {
  //         SubscribeBuddy(Buddies[b]);
  //     }
  // }
}

// Set this to whatever you want.
let hostingPrefix = getDbItem("HostingPrefix", ""); // Use if hosting off root directory. eg: "/phone/" or "/static/"
let RegisterExpires = parseInt(getDbItem("RegisterExpires", 300)); // Registration expiry time (in seconds)
let RegisterExtraHeaders = getDbItem("RegisterExtraHeaders", "{}"); // Parsable Json string of headers to include in register process. eg: '{"foo":"bar"}'
let RegisterExtraContactParams = getDbItem("RegisterExtraContactParams", "{}"); // Parsable Json string of extra parameters add to the end (after >) of contact header during register. eg: '{"foo":"bar"}'
let RegisterContactParams = getDbItem("RegisterContactParams", "{}"); // Parsable Json string of extra parameters added to contact URI during register. eg: '{"foo":"bar"}'
let WssInTransport = getDbItem("WssInTransport", "1") == "1"; // Set the transport parameter to wss when used in SIP URIs. (Required for Asterisk as it doesn't support Path)
let IpInContact = getDbItem("IpInContact", "1") == "1"; // Set a random IP address as the host value in the Contact header field and Via sent-by parameter. (Suggested for Asterisk)
let BundlePolicy = getDbItem("BundlePolicy", "balanced"); // SDP Media Bundle: max-bundle | max-compat | balanced https://webrtcstandards.info/sdp-bundle/
let IceStunServerJson = getDbItem("IceStunServerJson", ""); // Sets the JSON string for ice Server. Default: [{ "urls": "stun:stun.l.google.com:19302" }] Must be https://developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration/iceServers
let IceStunCheckTimeout = parseInt(getDbItem("IceStunCheckTimeout", 500)); // Set amount of time in milliseconds to wait for the ICE/STUN server
let SubscribeBuddyAccept = getDbItem(
  "SubscribeBuddyAccept",
  "application/pidf+xml"
); // Normally only application/dialog-info+xml and application/pidf+xml
let SubscribeBuddyEvent = getDbItem("SubscribeBuddyEvent", "presence"); // For application/pidf+xml use presence. For application/dialog-info+xml use dialog
let SubscribeBuddyExpires = parseInt(getDbItem("SubscribeBuddyExpires", 300)); // Buddy Subscription expiry time (in seconds)
let ProfileDisplayPrefix = getDbItem("ProfileDisplayPrefix", ""); // Can display an item from your vCard before your name. Options: Number1 | Number2
let ProfileDisplayPrefixSeparator = getDbItem(
  "ProfileDisplayPrefixSeparator",
  ""
); // Used with profileDisplayPrefix, adds a separating character (string). eg: - ~ * or even 💥
let InviteExtraHeaders = getDbItem("InviteExtraHeaders", "{}"); // Extra SIP headers to be included in the initial INVITE message for each call. (Added to the extra headers in the DialByLine() parameters. e.g {"foo":"bar"})

let NoAnswerTimeout = parseInt(getDbItem("NoAnswerTimeout", 120)); // Time in seconds before automatic Busy Here sent
let AutoAnswerEnabled = getDbItem("AutoAnswerEnabled", "0") == "1"; // Automatically answers the phone when the call comes in, if you are not on a call already
let DoNotDisturbEnabled = getDbItem("DoNotDisturbEnabled", "0") == "1"; // Rejects any inbound call, while allowing outbound calls
let CallWaitingEnabled = getDbItem("CallWaitingEnabled", "1") == "1"; // Rejects any inbound call if you are on a call already.
let RecordAllCalls = getDbItem("RecordAllCalls", "0") == "1"; // Starts Call Recording when a call is established.
let StartVideoFullScreen = getDbItem("StartVideoFullScreen", "1") == "1"; // Starts a video call in the full screen (browser screen, not desktop)
let SelectRingingLine = getDbItem("SelectRingingLine", "1") == "1"; // Selects the ringing line if you are not on another call ()

let UiMaxWidth = parseInt(getDbItem("UiMaxWidth", 1240)); // Sets the max-width for the UI elements (don't set this less than 920. Set to very high number for full screen eg: 999999)
let UiThemeStyle = getDbItem("UiThemeStyle", "system"); // Sets the color theme for the UI dark | light | system (set by your systems dark/light settings)
let UiMessageLayout = getDbItem("UiMessageLayout", "middle"); // Put the message Stream at the top or middle can be either: top | middle
let UiCustomConfigMenu = getDbItem("UiCustomConfigMenu", "0") == "1"; // If set to true, will only call web_hook_on_config_menu
let UiCustomDialButton = getDbItem("UiCustomDialButton", "0") == "1"; // If set to true, will only call web_hook_dial_out
let UiCustomSortAndFilterButton =
  getDbItem("UiCustomSortAndFilterButton", "0") == "1"; // If set to true, will only call web_hook_sort_and_filter
let UiCustomAddBuddy = getDbItem("UiCustomAddBuddy", "0") == "1"; // If set to true, will only call web_hook_on_add_buddy
let UiCustomEditBuddy = getDbItem("UiCustomEditBuddy", "0") == "1"; // If set to true, will only call web_hook_on_edit_buddy({})
let UiCustomMediaSettings = getDbItem("UiCustomMediaSettings", "0") == "1"; // If set to true, will only call web_hook_on_edit_media
let UiCustomMessageAction = getDbItem("UiCustomMessageAction", "0") == "1"; // If set to true, will only call web_hook_on_message_action

let AutoGainControl = getDbItem("AutoGainControl", "1") == "1"; // Attempts to adjust the microphone volume to a good audio level. (OS may be better at this)
let EchoCancellation = getDbItem("EchoCancellation", "1") == "1"; // Attempts to remove echo over the line.
let NoiseSuppression = getDbItem("NoiseSuppression", "1") == "1"; // Attempts to clear the call quality of noise.
let MirrorVideo = getDbItem("VideoOrientation", "rotateY(180deg)"); // Displays the self-preview in normal or mirror view, to better present the preview.
let maxFrameRate = getDbItem("FrameRate", ""); // Suggests a frame rate to your webcam if possible.
let videoHeight = getDbItem("VideoHeight", ""); // Suggests a video height (and therefor picture quality) to your webcam.
let MaxVideoBandwidth = parseInt(getDbItem("MaxVideoBandwidth", "2048")); // Specifies the maximum bandwidth (in Kb/s) for your outgoing video stream. e.g: 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | -1 to disable
let videoAspectRatio = getDbItem("AspectRatio", "1.33"); // Suggests an aspect ratio (1:1 = 1 | 4:3 = 0.75 | 16:9 = 0.5625) to your webcam.
let NotificationsActive = getDbItem("Notifications", "0") == "1";

let StreamBuffer = parseInt(getDbItem("StreamBuffer", 50)); // The amount of rows to buffer in the Buddy Stream
let MaxDataStoreDays = parseInt(getDbItem("MaxDataStoreDays", 0)); // Defines the maximum amount of days worth of data (calls, recordings, messages, etc) to store locally. 0=Stores all data always. >0 Trims n days back worth of data at various events where.
let PosterJpegQuality = parseFloat(getDbItem("PosterJpegQuality", 0.6)); // The image quality of the Video Poster images
let VideoResampleSize = getDbItem("VideoResampleSize", "HD"); // The resample size (height) to re-render video that gets presented (sent). (SD = ???x360 | HD = ???x720 | FHD = ???x1080)
let RecordingVideoSize = getDbItem("RecordingVideoSize", "HD"); // The size/quality of the video track in the recordings (SD = 640x360 | HD = 1280x720 | FHD = 1920x1080)
let RecordingVideoFps = parseInt(getDbItem("RecordingVideoFps", 12)); // The Frame Per Second of the Video Track recording
let RecordingLayout = getDbItem("RecordingLayout", "them-pnp"); // The Layout of the Recording Video Track (side-by-side | them-pnp | us-only | them-only)

let DidLength = parseInt(getDbItem("DidLength", 6)); // DID length from which to decide if an incoming caller is a "contact" or an "extension".
let MaxDidLength = parseInt(getDbItem("MaxDidLength", 16)); // Maximum length of any DID number including international dialled numbers.
let DisplayDateFormat = getDbItem("DateFormat", "YYYY-MM-DD"); // The display format for all dates. https://momentjs.com/docs/#/displaying/
let DisplayTimeFormat = getDbItem("TimeFormat", "h:mm:ss A"); // The display format for all times. https://momentjs.com/docs/#/displaying/
let Language = getDbItem("Language", "auto"); // Overrides the language selector or "automatic". Must be one of availableLang[]. If not defaults to en.

// Buddy Sort and Filter
let BuddySortBy = getDbItem("BuddySortBy", "activity"); // Sorting for Buddy List display (type|extension|alphabetical|activity)
let SortByTypeOrder = getDbItem("SortByTypeOrder", "e|x|c"); // If the Sorting is set to type then describe the order of the types.
let BuddyAutoDeleteAtEnd = getDbItem("BuddyAutoDeleteAtEnd", "0") == "1"; // Always put the Auto Delete buddies at the bottom
let HideAutoDeleteBuddies = getDbItem("HideAutoDeleteBuddies", "0") == "1"; // Option to not display Auto Delete Buddies (May be confusing if newly created buddies are set to auto delete.)
let BuddyShowExtenNum = getDbItem("BuddyShowExtenNum", "0") == "1"; // Controls the Extension Number display

// Permission Settings
let EnableTextMessaging = getDbItem("EnableTextMessaging", "1") == "1"; // Enables the Text Messaging
let DisableFreeDial = getDbItem("DisableFreeDial", "0") == "1"; // Removes the Dial icon in the profile area, users will need to add buddies in order to dial.
let DisableBuddies = getDbItem("DisableBuddies", "0") == "1"; // Removes the Add Someone menu item and icon from the profile area. Buddies will still be created automatically. Please also use MaxBuddies or MaxBuddyAge
let EnableTransfer = getDbItem("EnableTransfer", "1") == "1"; // Controls Transferring during a call
let EnableConference = getDbItem("EnableConference", "1") == "1"; // Controls Conference during a call
let AutoAnswerPolicy = getDbItem("AutoAnswerPolicy", "allow"); // allow = user can choose | disabled = feature is disabled | enabled = feature is always on
let DoNotDisturbPolicy = getDbItem("DoNotDisturbPolicy", "allow"); // allow = user can choose | disabled = feature is disabled | enabled = feature is always on
let CallWaitingPolicy = getDbItem("CallWaitingPolicy", "allow"); // allow = user can choose | disabled = feature is disabled | enabled = feature is always on
let CallRecordingPolicy = getDbItem("CallRecordingPolicy", "allow"); // allow = user can choose | disabled = feature is disabled | enabled = feature is always on
let IntercomPolicy = getDbItem("IntercomPolicy", "enabled"); // disabled = feature is disabled | enabled = feature is always on
let EnableAccountSettings = getDbItem("EnableAccountSettings", "1") == "1"; // Controls the Account tab in Settings
let EnableAppearanceSettings =
  getDbItem("EnableAppearanceSettings", "1") == "1"; // Controls the Appearance tab in Settings
let EnableNotificationSettings =
  getDbItem("EnableNotificationSettings", "1") == "1"; // Controls the Notifications tab in Settings
let EnableAlphanumericDial = getDbItem("EnableAlphanumericDial", "0") == "1"; // Allows calling /[^\da-zA-Z\*\#\+\-\_\.\!\~\'\(\)]/g default is /[^\d\*\#\+]/g
let EnableVideoCalling = getDbItem("EnableVideoCalling", "1") == "1"; // Enables Video during a call
let EnableTextExpressions = getDbItem("EnableTextExpressions", "1") == "1"; // Enables Expressions (Emoji) glyphs when texting
let EnableTextDictate = getDbItem("EnableTextDictate", "1") == "1"; // Enables Dictate (speech-to-text) when texting
let EnableRingtone = getDbItem("EnableRingtone", "1") == "1"; // Enables a ring tone when an inbound call comes in.  (media/Ringtone_1.mp3)
let MaxBuddies = parseInt(getDbItem("MaxBuddies", 999)); // Sets the Maximum number of buddies the system will accept. Older ones get deleted. (Considered when(after) adding buddies)
let MaxBuddyAge = parseInt(getDbItem("MaxBuddyAge", 365)); // Sets the Maximum age in days (by latest activity). Older ones get deleted. (Considered when(after) adding buddies)
let AutoDeleteDefault = getDbItem("AutoDeleteDefault", "1") == "1"; // For automatically created buddies (inbound and outbound), should the buddy be set to AutoDelete.

let ChatEngine = getDbItem("ChatEngine", "SIMPLE"); // Select the chat engine XMPP | SIMPLE

// XMPP Settings
//let XmppServer = getDbItem("XmppServer", ""); // FQDN of XMPP server HTTP service";
//let XmppWebsocketPort = getDbItem("XmppWebsocketPort", ""); // OpenFire Default : 7443
//let XmppWebsocketPath = getDbItem("XmppWebsocketPath", ""); // OpenFire Default : /ws
//let XmppDomain = getDbItem("XmppDomain", ""); // The domain of the XMPP server
//let profileUser = getDbItem("profileUser", null); // Username for auth with XMPP Server eg: 100
// XMPP Tenanting
let XmppRealm = getDbItem("XmppRealm", ""); // To create a tenant like partition in XMPP server all users and buddies will have this realm prepended to their details.
let XmppRealmSeparator = getDbItem("XmppRealmSeparator", "-"); // Separates the realm from the profileUser eg: abc123-100@XmppDomain
// TODO
let XmppChatGroupService = getDbItem("XmppChatGroupService", "conference");

// TODO
let EnableSendFiles = false; // Enables sending of Images
let EnableSendImages = false; // Enables sending of Images
let EnableAudioRecording = false; // Enables the ability to record a voice message
let EnableVideoRecording = false; // Enables the ability to record a video message
let EnableSms = false; // Enables SMS sending to the server (requires onward services)
let EnableFax = false; // Enables Fax sending to the server (requires onward services)
let EnableEmail = false; // Enables Email sending to the server (requires onward services)

// ===================================================
// Rather don't fiddle with anything beyond this point
// ===================================================

// System variables
// ================
//let userAgent = null;
let CanvasCollection = [];
let Buddies = [];
let selectedBuddy = null;
let selectedLine = null;
let windowObj = null;
let alertObj = null;
let confirmObj = null;
let promptObj = null;
let menuObj = null;
let HasVideoDevice = false;
let HasAudioDevice = false;
let HasSpeakerDevice = false;
let AudioinputDevices = [];
let VideoinputDevices = [];
let SpeakerDevices = [];
let Lines = [];
//let lang = {}
let audioBlobs = {};
let newLineNumber = 1;
let telNumericRegEx = /[^\d\*\#\+]/g;
let telAlphanumericRegEx = /[^\da-zA-Z\*\#\+\-\_\.\!\~\'\(\)]/g;

let settingsMicrophoneStream = null;
let settingsMicrophoneStreamTrack = null;
let settingsMicrophoneSoundMeter = null;

let settingsVideoStream = null;
let settingsVideoStreamTrack = null;

let CallRecordingsIndexDb = null;
let CallQosDataIndexDb = null;

function utcDateNow() {
  return moment().utc().format("YYYY-MM-DD HH:mm:ss UTC");
}
// Buddy: Chat / Instant Message / XMPP
// ====================================
function InitialiseStream(buddy) {
  var template = { TotalRows: 0, DataCollection: [] };
  localDB.setItem(buddy + "-stream", JSON.stringify(template));
  return JSON.parse(localDB.getItem(buddy + "-stream"));
}
function AddMessageToStream(buddyObj, messageId, type, message, DateTime, to, from) {
  //var xmpp_username = profileUser + "@" + XmppDomain; // Xmpp Doesnt like Uppercase
  xmpp_username = xmpp_username.toLowerCase();
  console.log("XMPP username: ", xmpp_username);
  var currentStream = JSON.parse(
    // localDB.getItem(buddyObj.identity + "-stream")
    localDB.getItem(buddyObj.jid + "-stream")
  );

  console.log("Stream message: ", message);
  if (message == null) {
    console.log("Stream message empty: ", message);
    return;
  }
  if (type != "chat") {
    console.log("message not chat: ", message);
    return;
  }
  console.log(currentStream);
  if (currentStream == null) currentStream = InitialiseStream(buddyObj.jid);

  // Add New Message
  var newMessageJson = {
    ItemId: messageId,
    ItemType: type,
    ItemDate: DateTime,
    SrcUserId: buddyObj.jid,
    Src: '"' + from + '"',
    DstUserId: to,
    Dst: "",
    MessageData: message,
  };

  currentStream.DataCollection.push(newMessageJson);
  currentStream.TotalRows = currentStream.DataCollection.length;
  localDB.setItem(buddyObj.jid + "-stream", JSON.stringify(currentStream));

  // Data Cleanup
  if (MaxDataStoreDays && MaxDataStoreDays > 0) {
    console.log("Cleaning up data: ", MaxDataStoreDays);
    //RemoveBuddyMessageStream(FindBuddyByIdentity(buddy), MaxDataStoreDays);
  }
  console.log("Messages: ", currentStream);
}

function getAudioSrcID() {
  var id = localDB.getItem("AudioSrcId");
  return id != null ? id : "default";
}

function getAudioOutputID() {
  var id = localDB.getItem("AudioOutputId");
  return id != null ? id : "default";
}
function getVideoSrcID() {
  var id = localDB.getItem("VideoSrcId");
  return id != null ? id : "default";
}
function getRingerOutputID() {
  var id = localDB.getItem("RingOutputId");
  return id != null ? id : "default";
}
function formatDuration(seconds) {
  var sec = Math.floor(parseFloat(seconds));
  if (sec < 0) {
    return sec;
  } else if (sec >= 0 && sec < 60) {
    return sec + " " + (sec > 1 ? lang.seconds_plural : lang.second_single);
  } else if (sec >= 60 && sec < 60 * 60) {
    // greater then a minute and less then an hour
    var duration = moment.duration(sec, "seconds");
    return (
      duration.minutes() +
      " " +
      (duration.minutes() > 1 ? lang.minutes_plural : lang.minute_single) +
      " " +
      duration.seconds() +
      " " +
      (duration.seconds() > 1 ? lang.seconds_plural : lang.second_single)
    );
  } else if (sec >= 60 * 60 && sec < 24 * 60 * 60) {
    // greater than an hour and less then a day
    var duration = moment.duration(sec, "seconds");
    return (
      duration.hours() +
      " " +
      (duration.hours() > 1 ? lang.hours_plural : lang.hour_single) +
      " " +
      duration.minutes() +
      " " +
      (duration.minutes() > 1 ? lang.minutes_plural : lang.minute_single) +
      " " +
      duration.seconds() +
      " " +
      (duration.seconds() > 1 ? lang.seconds_plural : lang.second_single)
    );
  }
  //  Otherwise.. this is just too long
}
function formatShortDuration(seconds) {
  var sec = Math.floor(parseFloat(seconds));
  if (sec < 0) {
    return sec;
  } else if (sec >= 0 && sec < 60) {
    return "00:" + (sec > 9 ? sec : "0" + sec);
  } else if (sec >= 60 && sec < 60 * 60) {
    // greater then a minute and less then an hour
    var duration = moment.duration(sec, "seconds");
    return (
      (duration.minutes() > 9 ? duration.minutes() : "0" + duration.minutes()) +
      ":" +
      (duration.seconds() > 9 ? duration.seconds() : "0" + duration.seconds())
    );
  } else if (sec >= 60 * 60 && sec < 24 * 60 * 60) {
    // greater than an hour and less then a day
    var duration = moment.duration(sec, "seconds");
    return (
      (duration.hours() > 9 ? duration.hours() : "0" + duration.hours()) +
      ":" +
      (duration.minutes() > 9 ? duration.minutes() : "0" + duration.minutes()) +
      ":" +
      (duration.seconds() > 9 ? duration.seconds() : "0" + duration.seconds())
    );
  }
  //  Otherwise.. this is just too long
}
function formatBytes(bytes, decimals) {
  if (bytes === 0) return "0 " + lang.bytes;
  var k = 1024;
  var dm = decimals && decimals >= 0 ? decimals : 2;
  var sizes = [
    lang.bytes,
    lang.kb,
    lang.mb,
    lang.gb,
    lang.tb,
    lang.pb,
    lang.eb,
    lang.zb,
    lang.yb,
  ];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
function UserLocale() {
  var language = window.navigator.userLanguage || window.navigator.language; // "en", "en-US", "fr", "fr-FR", "es-ES", etc.
  // langtag = language["-"script]["-" region] *("-" variant) *("-" extension) ["-" privateuse]
  // TODO Needs work
  // langtag = language.split("-");
  // if (langtag.length == 1) {
  //   return "";
  // } else if (langtag.length == 2) {
  //   return langtag[1].toLowerCase(); // en-US => us
  // } else if (langtag.length >= 3) {
  //   return langtag[1].toLowerCase(); // en-US => us
  // }
  return "us";
}
function GetAlternateLanguage() {
  var userLanguage = window.navigator.userLanguage || window.navigator.language; // "en", "en-US", "fr", "fr-FR", "es-ES", etc.
  // langtag = language["-"script]["-" region] *("-" variant) *("-" extension) ["-" privateuse]
  if (Language != "auto") userLanguage = Language;
  userLanguage = userLanguage.toLowerCase();
  if (userLanguage == "en" || userLanguage.indexOf("en-") == 0) return ""; // English is already loaded

  for (l = 0; l < availableLang.length; l++) {
    if (userLanguage.indexOf(availableLang[l].toLowerCase()) == 0) {
      console.log("Alternate Language detected: ", userLanguage);
      // Set up Moment with the same language settings
      moment.locale(userLanguage);
      return availableLang[l].toLowerCase();
    }
  }
  return "";
}
function getFilter(filter, keyword) {
  if (
    filter.indexOf(",", filter.indexOf(keyword + ": ") + keyword.length + 2) !=
    -1
  ) {
    return filter.substring(
      filter.indexOf(keyword + ": ") + keyword.length + 2,
      filter.indexOf(",", filter.indexOf(keyword + ": ") + keyword.length + 2)
    );
  } else {
    return filter.substring(
      filter.indexOf(keyword + ": ") + keyword.length + 2
    );
  }
}
function base64toBlob(base64Data, contentType) {
  if (base64Data.indexOf("," != -1)) base64Data = base64Data.split(",")[1]; // [data:image/png;base64] , [xxx...]
  var byteCharacters = atob(base64Data);
  var slicesCount = Math.ceil(byteCharacters.length / 1024);
  var byteArrays = new Array(slicesCount);
  for (var s = 0; s < slicesCount; ++s) {
    var begin = s * 1024;
    var end = Math.min(begin + 1024, byteCharacters.length);
    var bytes = new Array(end - begin);
    for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[s] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}
function MakeDataArray(defaultValue, count) {
  var rtnArray = new Array(count);
  for (var i = 0; i < rtnArray.length; i++) {
    rtnArray[i] = defaultValue;
  }
  return rtnArray;
}

function getMessagesFromStream(buddyObj) {
  var currentStream = JSON.parse(
    // localDB.getItem(buddyObj.identity + "-stream")
    localDB.getItem(buddyObj.jid + "-stream")
  );
  console.log("Messages stream: ", currentStream);
  return currentStream;
}

// Utilities
// =========
function uID() {
  return (
    Date.now() +
    Math.floor(Math.random() * 10000)
      .toString(16)
      .toUpperCase()
  );
}

function onInviteAccepted(response, session) {
  // Call in progress
  //   var session = lineObj.SipSession;

  //   if(session.data.earlyMedia){
  //       session.data.earlyMedia.pause();
  //       session.data.earlyMedia.removeAttribute('src');
  //       session.data.earlyMedia.load();
  //       session.data.earlyMedia = null;
  //   }
  // }
  console.log(response);
  // Gets remote tracks
  pc = session.sessionDescriptionHandler.peerConnection;
  var remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;
  remoteVideo.play().then(() => {
    pc.getReceivers().forEach(function (receiver) {
      remoteStream.addTrack(receiver.track);
    });
  });

  // Gets local tracks
  var localStream = new MediaStream();
  pc.getSenders().forEach(function (sender) {
    localStream.addTrack(sender.track);
  });
  localVideo.srcObject = localStream;
  localVideo.play();
}

// Create User Agent
// =================
function CreateUserAgent() {
  console.log("Creating User Agent...");

  wssServer = getDbItem("wssServer", null);
  WebSocketPort = getDbItem("WebSocketPort", null);
  ServerPath = getDbItem("ServerPath", "");
  SipUsername = getDbItem("SipUsername", null);
  SipPassword = getDbItem("SipPassword", null);
  SipDomain = getDbItem("SipDomain", null);

  console.warn("Websocket server: ", wssServer);
  console.warn("Websocket port: ", WebSocketPort);
  console.warn("Websocket path: ", ServerPath);
  console.warn("Sip username: ", SipUsername);
  console.warn("Sip password: ", SipPassword);
  console.warn("Sip domain: ", SipDomain);

  if (wssServer == null || WebSocketPort == null || SipUsername == null) {
    console.log(
      "Cannot connect to: ",
      "wss://" + wssServer + ":" + WebSocketPort + ServerPath
    );
    return;
  }

  SipDomain = wssServer; // Sets globally

  var spdOptions = {
    earlyMedia: true,
    sessionDescriptionHandlerOptions: {
      constraints: {
        audio: { deviceId: "default" },
        video: { deviceId: "default" },
      },
    },
  };

  var options = {
    logConfiguration: false, // If true, constructor logs the registerer configuration.
    uri: SIP.UserAgent.makeURI("sip:" + SipUsername + "@" + SipDomain),
    //uri: SIP.UserAgent.makeURI("sip:" + "1000" + "@" + "dev.zesco.co.zm"),
    transportOptions: {
      server: "wss://" + wssServer + ":" + WebSocketPort + "" + ServerPath,
      //server: "wss://" + "dev.zesco.co.zm" + ":" + "4443" + "" + "",
      traceSip: false,
      connectionTimeout: TransportConnectionTimeout,
      // keepAliveInterval: 30 // Uncomment this and make this any number greater then 0 for keep alive...
      // NB, adding a keep alive will NOT fix bad internet, if your connection cannot stay open (permanent WebSocket Connection) you probably
      // have a router or ISP issue, and if your internet is so poor that you need to some how keep it alive with empty packets
      // upgrade you internet connection. This is voip we are talking about here.
    },
    sessionDescriptionHandlerFactoryOptions: {
      peerConnectionConfiguration: {
        bundlePolicy: BundlePolicy,
        // certificates: undefined,
        // iceCandidatePoolSize: 10,
        // iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        // iceTransportPolicy: "all",
        // peerIdentity: undefined,
        // rtcpMuxPolicy: "require",
      },
      iceGatheringTimeout: IceStunCheckTimeout,
    },
    contactName: ContactUserName,
    displayName: profileName,
    authorizationUsername: SipUsername,
    authorizationPassword: SipPassword,
    hackIpInContact: IpInContact, // Asterisk should also be set to rewrite contact
    userAgentString: userAgentStr,
    autoStart: false,
    autoStop: true,
    register: false,
    noAnswerTimeout: NoAnswerTimeout,
    // sipExtension100rel: // UNSUPPORTED | SUPPORTED | REQUIRED NOTE: rel100 is not supported
    contactParams: {},
    delegate: {
      onInvite: function (session) {
        // Send Answer
        session.accept(spdOptions).then(function (response) {
          onInviteAccepted(response, session);
        });
        // }).catch(function(error){
        //     console.warn("Failed to answer call", error, lineObj.SipSession);
        //     lineObj.SipSession.data.reasonCode = 500;
        //     lineObj.SipSession.data.reasonText = "Client Error";
        //     teardownSession(lineObj);
        // });
        //ReceiveCall(session);
        // function sipCall() {
        //   var session = userAgent.invite(
        //     "sip:" + document.getElementById("number").value + "@bdt.allocloud.com"
        //   );

        //   var pc;

        //   session.on("trackAdded", function () {
        //     // We need to check the peer connection to determine which track was added

        //     pc = session.sessionDescriptionHandler.peerConnection;

        //     // Gets remote tracks
        //     var remoteStream = new MediaStream();
        //     pc.getReceivers().forEach(function (receiver) {
        //       remoteStream.addTrack(receiver.track);
        //     });
        //     remoteVideo.srcObject = remoteStream;
        //     remoteVideo.play();

        //     // Gets local tracks
        //     var localStream = new MediaStream();
        //     pc.getSenders().forEach(function (sender) {
        //       localStream.addTrack(sender.track);
        //     });
        //     localVideo.srcObject = localStream;
        //     localVideo.play();
        //   });
        // }

        // const CallCenter = () => {
        //   return (
        //     <div>
        //       <video id="remoteVideo"></video>
        //       <video id="localVideo"></video>
        //     </div>
        //   );
        // };

        // function AudioCall(callee1, callee2, callee3) {
        //var callBtn = document.getElementById("callBtn");
        // var remoteVideo = document.getElementById("remoteVideo");
        // var localVideo = document.getElementById("localVideo");

        //callBtn.addEventListener("click", sipCall);

        // var userAgent = new UserAgent({
        //   uri: "sip:1000@dev.zesco.co.zm",
        //   wsServers: "wss://dev.zesco.co.zm:4443",
        //   password: "1000",
        //   displayName: "1000"
        // });
        // var targetURI = SIP.UserAgent.makeURI(
        //   "sip:" + callee1 + "@" + SipDomain
        // );

        //userAgent.on("invite", function (session) {

        // var remoteVideo = document.getElementById("remoteVideo");
        // var localVideo = document.getElementById("localVideo");

        // console.warn("invite");
        // session.accept();
        // var pc;

        // session.on("trackAdded", function () {
        //   // We need to check the peer connection to determine which track was added

        //   pc = session.sessionDescriptionHandler.peerConnection;

        //   // Gets remote tracks
        //   var remoteStream = new MediaStream();
        //   remoteVideo.srcObject = remoteStream;
        //   remoteVideo.play().then(() => {
        //     pc.getReceivers().forEach(function (receiver) {
        //       remoteStream.addTrack(receiver.track);
        //     });
        //   });

        //   // Gets local tracks
        //   var localStream = new MediaStream();
        //   pc.getSenders().forEach(function (sender) {
        //     localStream.addTrack(sender.track);
        //   });
        //   localVideo.srcObject = localStream;
        //   localVideo.play();
        // });
        //});
        //}
        // var remoteVideo = document.getElementById("remoteVideo");
        // var localVideo = document.getElementById("localVideo");
        // //var localVideoStream = new MediaStream();
        // var pc = session.sessionDescriptionHandler.peerConnection;
        // // Gets remote tracks
        // var remoteStream = new MediaStream();
        // pc.getReceivers().forEach(function (receiver) {
        //   remoteStream.addTrack(receiver.track);
        // });
        // remoteVideo.srcObject = remoteStream;
        // remoteVideo.play();

        // // Gets local tracks
        // var localStream = new MediaStream();
        // pc.getSenders().forEach(function (sender) {
        //   localStream.addTrack(sender.track);
        // });
        // localVideo.srcObject = localStream;
        // localVideo.play();
      },
      onMessage: function (sip) {
        //ReceiveOutOfDialogMessage(sip);
        console.log(sip);
      },
    },
  };
  if (IceStunServerJson != "") {
    options.sessionDescriptionHandlerFactoryOptions.peerConnectionConfiguration.iceServers =
      JSON.parse(IceStunServerJson);
  }

  // Added to the contact BEFORE the '>' (permanent)
  if (
    RegisterContactParams &&
    RegisterContactParams != "" &&
    RegisterContactParams != "{}"
  ) {
    try {
      options.contactParams = JSON.parse(RegisterContactParams);
    } catch (e) {}
  }
  if (WssInTransport) {
    try {
      options.contactParams.transport = "wss";
    } catch (e) {}
  }

  // Add (Hardcode) other RTCPeerConnection({ rtcConfiguration }) config dictionary options here
  // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection
  // Example:
  // options.sessionDescriptionHandlerFactoryOptions.peerConnectionConfiguration.rtcpMuxPolicy = "require";

  userAgent = new SIP.UserAgent(options);
  userAgent.isRegistered = function () {
    return (
      userAgent &&
      userAgent.registerer &&
      userAgent.registerer.state == SIP.RegistererState.Registered
    );
  };
  // For some reason this is marked as private... not sure why
  userAgent.sessions = userAgent._sessions;
  userAgent.registrationCompleted = false;
  userAgent.registering = false;
  userAgent.transport.ReconnectionAttempts = TransportReconnectionAttempts;
  userAgent.transport.attemptingReconnection = false;
  userAgent.BlfSubs = [];
  userAgent.lastVoicemailCount = 0;

  console.log("Creating User Agent... Done");
  // Custom Web hook
  if (typeof web_hook_on_userAgent_created !== "undefined")
    web_hook_on_userAgent_created(userAgent);

  userAgent.transport.onConnect = function () {
    onTransportConnected();
  };
  userAgent.transport.onDisconnect = function (error) {
    if (error) {
      onTransportConnectError(error);
    } else {
      onTransportDisconnected();
    }
  };

  var RegistererOptions = {
    logConfiguration: false, // If true, constructor logs the registerer configuration.
    expires: RegisterExpires,
    extraHeaders: [],
    extraContactHeaderParams: [],
    refreshFrequency: 75, // Determines when a re-REGISTER request is sent. The value should be specified as a percentage of the expiration time (between 50 and 99).
  };

  // Added to the SIP Headers
  if (
    RegisterExtraHeaders &&
    RegisterExtraHeaders != "" &&
    RegisterExtraHeaders != "{}"
  ) {
    try {
      var registerExtraHeaders = JSON.parse(RegisterExtraHeaders);
      for (const [key, value] of Object.entries(registerExtraHeaders)) {
        if (value != "") {
          RegistererOptions.extraHeaders.push(key + ": " + value);
        }
      }
    } catch (e) {}
  }

  // Added to the contact AFTER the '>' (not permanent)
  if (
    RegisterExtraContactParams &&
    RegisterExtraContactParams != "" &&
    RegisterExtraContactParams != "{}"
  ) {
    try {
      var registerExtraContactParams = JSON.parse(RegisterExtraContactParams);
      for (const [key, value] of Object.entries(registerExtraContactParams)) {
        if (value == "") {
          RegistererOptions.extraContactHeaderParams.push(key);
        } else {
          RegistererOptions.extraContactHeaderParams.push(key + "=" + value);
        }
      }
    } catch (e) {}
  }

  userAgent.registerer = new SIP.Registerer(userAgent, RegistererOptions);
  console.log("Creating Registerer... Done");

  userAgent.registerer.stateChange.addListener(function (newState) {
    console.log("User Agent Registration State:", newState);
    switch (newState) {
      case SIP.RegistererState.Initial:
        // Nothing to do
        break;
      case SIP.RegistererState.Registered:
        onRegistered();
        break;
      case SIP.RegistererState.Unregistered:
        onUnregistered();
        break;
      case SIP.RegistererState.Terminated:
        // Nothing to do
        break;
    }
  });

  console.log("User Agent Connecting to WebSocket...");
  ////$("#regStatus").html(lang.connecting_to_web_socket);
  userAgent.start().catch(function (error) {
    onTransportConnectError(error);
  });
}

// Transport Events
// ================
function onTransportConnected() {
  console.log("Connected to Web Socket!");
  ////$("#regStatus").html(lang.connected_to_web_socket);

  ////$("#WebRtcFailed").hide();

  // Reset the ReconnectionAttempts
  userAgent.isReRegister = false;
  userAgent.transport.attemptingReconnection = false;
  userAgent.transport.ReconnectionAttempts = TransportReconnectionAttempts;

  // Auto start register
  if (
    userAgent.transport.attemptingReconnection == false &&
    userAgent.registering == false
  ) {
    window.setTimeout(function () {
      Register();
    }, 500);
  } else {
    console.warn(
      "onTransportConnected: Register() called, but attemptingReconnection is true or registering is true"
    );
  }
}
function onTransportConnectError(error) {
  console.warn("WebSocket Connection Failed:", error);

  // We set this flag here so that the re-register attempts are fully completed.
  userAgent.isReRegister = false;

  // If there is an issue with the WS connection
  // We unregister, so that we register again once its up
  console.log("Unregister...");
  try {
    userAgent.registerer.unregister();
  } catch (e) {
    // I know!!!
  }

  ////$("#regStatus").html(lang.web_socket_error);
  ////$("#WebRtcFailed").show();

  ReconnectTransport();

  // Custom Web hook
  if (typeof web_hook_on_transportError !== "undefined")
    web_hook_on_transportError(userAgent.transport, userAgent);
}

function onTransportDisconnected() {
  console.log("Disconnected from Web Socket!");
  ////$("#regStatus").html(lang.disconnected_from_web_socket);

  userAgent.isReRegister = false;
}
function ReconnectTransport() {
  if (userAgent == null) return;

  userAgent.registering = false; // if the transport was down, you will not be registered
  if (userAgent.transport && userAgent.transport.isConnected()) {
    // Asked to re-connect, but ws is connected
    onTransportConnected();
    return;
  }
  console.log("Reconnect Transport...");

  window.setTimeout(function () {
    ////$("#regStatus").html(lang.connecting_to_web_socket);
    console.log("ReConnecting to WebSocket...");

    if (userAgent.transport && userAgent.transport.isConnected()) {
      // Already Connected
      onTransportConnected();
      return;
    } else {
      userAgent.transport.attemptingReconnection = true;
      userAgent.reconnect().catch(function (error) {
        userAgent.transport.attemptingReconnection = false;
        console.warn("Failed to reconnect", error);

        // Try Again
        ReconnectTransport();
      });
    }
  }, TransportReconnectionTimeout * 1000);

  ////$("#regStatus").html(lang.connecting_to_web_socket);
  console.log(
    "Waiting to Re-connect...",
    TransportReconnectionTimeout,
    "Attempt remaining",
    userAgent.transport.ReconnectionAttempts
  );
  userAgent.transport.ReconnectionAttempts =
    userAgent.transport.ReconnectionAttempts - 1;
}

// Registration
// ============
function Register() {
  if (userAgent == null) return;
  if (userAgent.registering == true) return;
  if (userAgent.isRegistered()) return;

  var RegistererRegisterOptions = {
    requestDelegate: {
      onReject: function (sip) {
        onRegisterFailed(sip.message.reasonPhrase, sip.message.statusCode);
      },
    },
  };

  console.log("Sending Registration...");
  ////$("#regStatus").html(lang.sending_registration);
  userAgent.registering = true;
  userAgent.registerer.register(RegistererRegisterOptions);
}
function Unregister(skipUnsubscribe) {
  if (userAgent == null || !userAgent.isRegistered()) return;

  if (skipUnsubscribe == true) {
    console.log("Skipping Unsubscribe");
  } else {
    console.log("Unsubscribing...");
    ////$("#regStatus").html(lang.unsubscribing);
    try {
      UnsubscribeAll();
    } catch (e) {}
  }

  console.log("Unregister...");
  ////$("#regStatus").html(lang.disconnecting);
  userAgent.registerer.unregister();

  userAgent.transport.attemptingReconnection = false;
  userAgent.registering = false;
  userAgent.isReRegister = false;
}

// Registration Events
// ===================
/**
 * Called when account is registered
 */
function onRegistered() {
  // This code fires on re-register after session timeout
  // to ensure that events are not fired multiple times
  // a isReRegister state is kept.
  // TODO: This check appears obsolete

  userAgent.registrationCompleted = true;
  if (!userAgent.isReRegister) {
    console.log("Registered!");

    ////$("#reglink").hide();
    //$("#dereglink").show();
    if (DoNotDisturbEnabled || DoNotDisturbPolicy == "enabled") {
      //$("#dereglink").attr("class", "dotDoNotDisturb");
      //$("#dndStatus").html("(DND)");
    }

    // Start Subscribe Loop
    window.setTimeout(function () {
      SubscribeAll();
    }, 500);

    // Output to status
    //$("#regStatus").html(lang.registered);

    // Start XMPP
    if (ChatEngine == "XMPP") reconnectXmpp();

    userAgent.registering = false;

    // Close possible Alerts that may be open. (Can be from failed registers)
    // if (alertObj != null) {
    //   alertObj.dialog("close");
    //   alertObj = null;
    // }

    // Custom Web hook
    if (typeof web_hook_on_register !== "undefined")
      web_hook_on_register(userAgent);
  } else {
    userAgent.registering = false;

    console.log("ReRegistered!");
  }
  userAgent.isReRegister = true;
}

function Alert(messageStr, TitleStr, onOk) {
  if (confirmObj != null) {
    confirmObj.dialog("close");
    confirmObj = null;
  }
  if (promptObj != null) {
    promptObj.dialog("close");
    promptObj = null;
  }
  if (alertObj != null) {
    console.error(
      "Alert not null, while Alert called: " +
        TitleStr +
        ", saying:" +
        messageStr
    );
    return;
  } else {
    console.log(
      "Alert called with Title: " + TitleStr + ", saying: " + messageStr
    );
  }

  var html = "<div class=NoSelect>";
  html +=
    '<div class=UiText style="padding: 10px" id=AllertMessageText>' +
    messageStr +
    "</div>";
  html += "</div>";

  alertObj = document
    .getElementsByTagNameNS("<div>")
    .html(html)
    .dialog({
      autoOpen: false,
      title: TitleStr,
      modal: true,
      width: 300,
      height: "auto",
      resizable: false,
      closeOnEscape: false,
      close: function (event, ui) {
        //$(this).dialog("destroy");
        alertObj = null;
      },
    });

  var buttons = [];
  buttons.push({
    text: lang.ok,
    click: function () {
      console.log("Alert OK clicked");
      if (onOk) onOk();
      //$(this).dialog("close");
      alertObj = null;
    },
  });
  alertObj.dialog("option", "buttons", buttons);

  // Open the Window
  alertObj.dialog("open");

  alertObj.dialog({ dialogClass: "no-close" });

  // Call UpdateUI to perform all the nesesary UI updates.
  //UpdateUI();
}

/**
 * Called if UserAgent can connect, but not register.
 * @param {string} response Incoming request message
 * @param {string} cause Cause message. Unused
 **/
function onRegisterFailed(response, cause) {
  console.log("Registration Failed: " + response);
  //$("#regStatus").html(lang.registration_failed);

  //$("#reglink").show();
  //$("#dereglink").hide();

  Alert(lang.registration_failed + ":" + response, lang.registration_failed);

  userAgent.registering = false;

  // Custom Web hook
  if (typeof web_hook_on_registrationFailed !== "undefined")
    web_hook_on_registrationFailed(response);
}
/**
 * Called when Unregister is requested
 */
function onUnregistered() {
  if (userAgent.registrationCompleted) {
    console.log("Unregistered, bye!");
    //$("#regStatus").html(lang.unregistered);

    //$("#reglink").show();
    //$("#dereglink").hide();

    // Custom Web hook
    if (typeof web_hook_on_unregistered !== "undefined")
      web_hook_on_unregistered();
  } else {
    // Was never really registered, so cant really say unregistered
  }

  // We set this flag here so that the re-register attempts are fully completed.
  userAgent.isReRegister = false;
}

// Inbound Calls
// =============
function ReceiveCall(session) {
  // First Determine Identity from From
  var callerID = session.remoteIdentity.displayName;
  var did = session.remoteIdentity.uri.user;
  if (typeof callerID === "undefined") callerID = did;

  var sipHeaders = session.incomingInviteRequest.message.headers;
  // If a P-Asserted-Identity is parsed, use that
  if (sipHeaders.hasOwnProperty("P-Asserted-Identity")) {
    var rawUri = sipHeaders["P-Asserted-Identity"][0].raw;
    if (rawUri.includes("<sip:")) {
      var uriParts = rawUri.split("<sip:");
      if (uriParts[1].endsWith(">"))
        uriParts[1] = uriParts[1].substring(0, uriParts[1].length - 1);
      if (uriParts[1].endsWith("@" + SipDomain)) {
        var assertId = SIP.UserAgent.makeURI("sip:" + uriParts[1]); // should be sip:123@domain.com
        did = assertId.user;
        console.log(
          "Found P-Asserted-Identity, will use that to identify user:",
          did
        );
      } else {
        console.warn(
          "Found P-Asserted-Identity but not in trust domain: ",
          rawUri
        );
      }
    } else {
      console.warn("Found P-Asserted-Identity but not in a URI: ", rawUri);
    }
  }

  console.log("New Incoming Call!", callerID + " <" + did + ">");

  //var CurrentCalls = countSessions(session.id);
  //console.log("Current Call Count:", CurrentCalls);

  //var buddyObj = FindBuddyByDid(did);
  // Make new contact of its not there
  // if (buddyObj == null) {
  //   var focusOnBuddy = CurrentCalls == 0;

  //   // Check for Hints in Headers
  //   // Buddy Create Hints: Parse any of the following Sip Headers to help create a buddy
  //   // Note: SIP.js will make the header names Lowercase
  //   var buddyType = did.length > DidLength ? "contact" : "extension";
  //   // X-Buddytype: xmpp
  //   if (sipHeaders.hasOwnProperty("X-Buddytype")) {
  //     if (
  //       sipHeaders["X-Buddytype"][0].raw == "contact" ||
  //       sipHeaders["X-Buddytype"][0].raw == "extension" ||
  //       sipHeaders["X-Buddytype"][0].raw == "xmpp" ||
  //       sipHeaders["X-Buddytype"][0].raw == "group"
  //     ) {
  //       buddyType = sipHeaders["X-Buddytype"][0].raw;
  //       console.log("Hint Header X-Buddytype:", buddyType);
  //     } else {
  //       console.warn(
  //         "Hint Header X-Buddytype must either contact | extension | xmpp | group: ",
  //         sipHeaders["X-Buddytype"][0].raw
  //       );
  //     }
  //   }
  //   var xmppJid = null;
  //   // X-Xmppjid: bob@somedomain.com
  //   if (buddyType == "xmpp") {
  //     if (sipHeaders.hasOwnProperty("X-Xmppjid")) {
  //       if (sipHeaders["X-Xmppjid"][0].raw.endsWith("@" + XmppDomain)) {
  //         xmppJid = sipHeaders["X-Xmppjid"][0].raw;
  //         console.log("Hint Header X-Xmppjid:", xmppJid);
  //       }
  //     } else {
  //       console.warn(
  //         "Hint Header X-Xmppjid must end with @XmppDomain",
  //         sipHeaders["X-Xmppjid"][0].raw
  //       );
  //     }
  //   }
  //   // X-Subscribeuser: sip:1000@somedomain.com
  //   var subscribeToBuddy = false;
  //   var subscribeUser = null;
  //   if (sipHeaders.hasOwnProperty("X-Subscribeuser")) {
  //     if (
  //       sipHeaders["X-Subscribeuser"][0].raw.startsWith("sip:") &&
  //       sipHeaders["X-Subscribeuser"][0].raw.endsWith("@" + SipDomain)
  //     ) {
  //       subscribeUser = sipHeaders["X-Subscribeuser"][0].raw.substring(
  //         4,
  //         sipHeaders["X-Subscribeuser"][0].raw.indexOf("@")
  //       );
  //       subscribeToBuddy = true;
  //       console.log("Hint Header X-Subscribeuser:", subscribeUser);
  //     } else {
  //       console.warn(
  //         "Hint Header X-Subscribeuser must start with sip: and end with @SipDomain",
  //         sipHeaders["X-Subscribeuser"][0].raw
  //       );
  //     }
  //   }
  //   var allowDuringDnd = false;
  //   // X-Allowduringdnd: yes
  //   if (sipHeaders.hasOwnProperty("X-Allowduringdnd")) {
  //     if (
  //       sipHeaders["X-Allowduringdnd"][0].raw == "yes" ||
  //       sipHeaders["X-Allowduringdnd"][0].raw == "no"
  //     ) {
  //       allowDuringDnd = sipHeaders["X-Allowduringdnd"][0].raw == "yes";
  //       console.log("Hint Header X-Allowduringdnd:", allowDuringDnd);
  //     } else {
  //       console.warn(
  //         "Hint Header X-Allowduringdnd must yes | no :",
  //         sipHeaders["X-Allowduringdnd"][0].raw
  //       );
  //     }
  //   }
  //   var autoDelete = AutoDeleteDefault;
  //   // X-Autodelete: yes
  //   if (sipHeaders.hasOwnProperty("X-Autodelete")) {
  //     if (
  //       sipHeaders["X-Autodelete"][0].raw == "yes" ||
  //       sipHeaders["X-Autodelete"][0].raw == "no"
  //     ) {
  //       autoDelete = sipHeaders["X-Autodelete"][0].raw == "yes";
  //       console.log("Hint Header X-Autodelete:", autoDelete);
  //     } else {
  //       console.warn(
  //         "Hint Header X-Autodelete must yes | no :",
  //         sipHeaders["X-Autodelete"][0].raw
  //       );
  //     }
  //   }

  //   buddyObj = MakeBuddy(
  //     buddyType,
  //     true,
  //     focusOnBuddy,
  //     subscribeToBuddy,
  //     callerID,
  //     did,
  //     xmppJid,
  //     allowDuringDnd,
  //     subscribeUser,
  //     autoDelete,
  //     true
  //   );
  // } else {
  //   // Double check that the buddy has the same caller ID as the incoming call
  //   // With Buddies that are contacts, eg +441234567890 <+441234567890> leave as as
  //   if (buddyObj.type == "extension" && buddyObj.CallerIDName != callerID) {
  //     UpdateBuddyCallerID(buddyObj, callerID);
  //   } else if (
  //     buddyObj.type == "contact" &&
  //     callerID != did &&
  //     buddyObj.CallerIDName != callerID
  //   ) {
  //     UpdateBuddyCallerID(buddyObj, callerID);
  //   }
  // }

  // var startTime = moment.utc();

  // // Create the line and add the session so we can answer or reject it.
  // newLineNumber = newLineNumber + 1;
  // var lineObj = new Line(newLineNumber, callerID, did, buddyObj);
  // lineObj.SipSession = session;
  // lineObj.SipSession.data = {};
  // lineObj.SipSession.data.line = lineObj.LineNumber;
  // lineObj.SipSession.data.calldirection = "inbound";
  // lineObj.SipSession.data.terminateby = "";
  // lineObj.SipSession.data.src = did;
  // lineObj.SipSession.data.buddyId = lineObj.BuddyObj.identity;
  // lineObj.SipSession.data.callstart = startTime.format(
  //   "YYYY-MM-DD HH:mm:ss UTC"
  // );
  // lineObj.SipSession.data.callTimer = window.setInterval(function () {
  //   var now = moment.utc();
  //   var duration = moment.duration(now.diff(startTime));
  //   var timeStr = formatShortDuration(duration.asSeconds());
  //   $("#line-" + lineObj.LineNumber + "-timer").html(timeStr);
  //   $("#line-" + lineObj.LineNumber + "-datetime").html(timeStr);
  // }, 1000);
  // lineObj.SipSession.data.earlyReject = false;
  // Lines.push(lineObj);
  // // Detect Video
  // lineObj.SipSession.data.withvideo = false;
  // if (EnableVideoCalling == true && lineObj.SipSession.request.body) {
  //   // Asterisk 13 PJ_SIP always sends m=video if endpoint has video codec,
  //   // even if original invite does not specify video.
  //   if (lineObj.SipSession.request.body.indexOf("m=video") > -1) {
  //     lineObj.SipSession.data.withvideo = true;
  //     // The invite may have video, but the buddy may be a contact
  //     if (buddyObj.type == "contact") {
  //       // videoInvite = false;
  //       // TODO: Is this limitation necessary?
  //     }
  //   }
  // }

  // Session Delegates
  lineObj.SipSession.delegate = {
    onBye: function (sip) {
      onSessionReceivedBye(lineObj, sip);
    },
    onMessage: function (sip) {
      onSessionReceivedMessage(lineObj, sip);
    },
    onInvite: function (sip) {
      onSessionReinvited(lineObj, sip);
    },
    onSessionDescriptionHandler: function (sdh, provisional) {
      onSessionDescriptionHandlerCreated(
        lineObj,
        sdh,
        provisional,
        lineObj.SipSession.data.withvideo
      );
    },
  };
  // incomingInviteRequestDelegate
  lineObj.SipSession.incomingInviteRequest.delegate = {
    onCancel: function (sip) {
      onInviteCancel(lineObj, sip);
    },
  };

  // Possible Early Rejection options
  if (DoNotDisturbEnabled == true || DoNotDisturbPolicy == "enabled") {
    if (DoNotDisturbEnabled == true && buddyObj.EnableDuringDnd == true) {
      // This buddy has been allowed
      console.log("Buddy is allowed to call while you are on DND");
    } else {
      console.log("Do Not Disturb Enabled, rejecting call.");
      lineObj.SipSession.data.earlyReject = true;
      RejectCall(lineObj.LineNumber, true);
      return;
    }
  }
  if (CurrentCalls >= 1) {
    if (CallWaitingEnabled == false || CallWaitingEnabled == "disabled") {
      console.log("Call Waiting Disabled, rejecting call.");
      lineObj.SipSession.data.earlyReject = true;
      RejectCall(lineObj.LineNumber, true);
      return;
    }
  }

  // Create the call HTML
  AddLineHtml(lineObj, "inbound");
  $("#line-" + lineObj.LineNumber + "-msg").html(lang.incoming_call);
  $("#line-" + lineObj.LineNumber + "-msg").show();
  $("#line-" + lineObj.LineNumber + "-timer").show();
  if (lineObj.SipSession.data.withvideo) {
    $("#line-" + lineObj.LineNumber + "-answer-video").show();
  } else {
    $("#line-" + lineObj.LineNumber + "-answer-video").hide();
  }
  $("#line-" + lineObj.LineNumber + "-AnswerCall").show();

  // Update the buddy list now so that any early rejected calls don't flash on
  UpdateBuddyList();

  // Auto Answer options
  var autoAnswerRequested = false;
  var answerTimeout = 1000;
  if (!AutoAnswerEnabled && IntercomPolicy == "enabled") {
    // Check headers only if policy is allow

    // https://github.com/InnovateAsterisk/Browser-Phone/issues/126
    // Alert-Info: info=alert-autoanswer
    // Alert-Info: answer-after=0
    // Call-info: answer-after=0; x=y
    // Call-Info: Answer-After=0
    // Alert-Info: ;info=alert-autoanswer
    // Alert-Info: <sip:>;info=alert-autoanswer
    // Alert-Info: <sip:domain>;info=alert-autoanswer

    var ci = session.request.headers["Call-Info"];
    if (ci !== undefined && ci.length > 0) {
      for (var i = 0; i < ci.length; i++) {
        var raw_ci = ci[i].raw.toLowerCase();
        if (raw_ci.indexOf("answer-after=") > 0) {
          var temp_seconds_autoanswer = parseInt(
            raw_ci
              .substring(
                raw_ci.indexOf("answer-after=") + "answer-after=".length
              )
              .split(";")[0]
          );
          if (
            Number.isInteger(temp_seconds_autoanswer) &&
            temp_seconds_autoanswer >= 0
          ) {
            autoAnswerRequested = true;
            if (temp_seconds_autoanswer > 1)
              answerTimeout = temp_seconds_autoanswer * 1000;
            break;
          }
        }
      }
    }
    var ai = session.request.headers["Alert-Info"];
    if (autoAnswerRequested === false && ai !== undefined && ai.length > 0) {
      for (var i = 0; i < ai.length; i++) {
        var raw_ai = ai[i].raw.toLowerCase();
        if (
          raw_ai.indexOf("auto answer") > 0 ||
          raw_ai.indexOf("alert-autoanswer") > 0
        ) {
          var autoAnswerRequested = true;
          break;
        }
        if (raw_ai.indexOf("answer-after=") > 0) {
          var temp_seconds_autoanswer = parseInt(
            raw_ai
              .substring(
                raw_ai.indexOf("answer-after=") + "answer-after=".length
              )
              .split(";")[0]
          );
          if (
            Number.isInteger(temp_seconds_autoanswer) &&
            temp_seconds_autoanswer >= 0
          ) {
            autoAnswerRequested = true;
            if (temp_seconds_autoanswer > 1)
              answerTimeout = temp_seconds_autoanswer * 1000;
            break;
          }
        }
      }
    }
  }

  if (
    AutoAnswerEnabled ||
    AutoAnswerPolicy == "enabled" ||
    autoAnswerRequested
  ) {
    if (CurrentCalls == 0) {
      // There are no other calls, so you can answer
      console.log("Going to Auto Answer this call...");
      window.setTimeout(function () {
        // If the call is with video, assume the auto answer is also
        // In order for this to work nicely, the recipient maut be "ready" to accept video calls
        // In order to ensure video call compatibility (i.e. the recipient must have their web cam in, and working)
        // The NULL video should be configured
        // https://github.com/InnovateAsterisk/Browser-Phone/issues/26
        if (lineObj.SipSession.data.withvideo) {
          AnswerVideoCall(lineObj.LineNumber);
        } else {
          AnswerAudioCall(lineObj.LineNumber);
        }
      }, answerTimeout);

      // Select Buddy
      SelectLine(lineObj.LineNumber);
      return;
    } else {
      console.warn("Could not auto answer call, already on a call.");
    }
  }

  // Check if that buddy is not already on a call??
  var streamVisible = $("#stream-" + buddyObj.identity).is(":visible");
  if (streamVisible || CurrentCalls == 0) {
    // If you are already on the selected buddy who is now calling you, switch to his call.
    // NOTE: This will put other calls on hold
    if (CurrentCalls == 0) SelectLine(lineObj.LineNumber);
  }

  // Show notification / Ring / Windows Etc
  // ======================================

  // Browser Window Notification
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      var noticeOptions = {
        body: lang.incoming_call_from + " " + callerID + " <" + did + ">",
        icon: getPicture(buddyObj.identity),
      };
      var inComingCallNotification = new Notification(
        lang.incoming_call,
        noticeOptions
      );
      inComingCallNotification.onclick = function (event) {
        var lineNo = lineObj.LineNumber;
        var videoInvite = lineObj.SipSession.data.withvideo;
        window.setTimeout(function () {
          // https://github.com/InnovateAsterisk/Browser-Phone/issues/26
          if (videoInvite) {
            AnswerVideoCall(lineNo);
          } else {
            AnswerAudioCall(lineNo);
          }
        }, 1000);

        // Select Buddy
        SelectLine(lineNo);
        return;
      };
    }
  }

  // Play Ring Tone if not on the phone
  if (EnableRingtone == true) {
    if (CurrentCalls >= 1) {
      // Play Alert
      console.log("Audio:", audioBlobs.CallWaiting.url);
      var ringer = new Audio(audioBlobs.CallWaiting.blob);
      ringer.preload = "auto";
      ringer.loop = false;
      ringer.oncanplaythrough = function (e) {
        if (
          typeof ringer.sinkId !== "undefined" &&
          getRingerOutputID() != "default"
        ) {
          ringer
            .setSinkId(getRingerOutputID())
            .then(function () {
              console.log("Set sinkId to:", getRingerOutputID());
            })
            .catch(function (e) {
              console.warn("Failed not apply setSinkId.", e);
            });
        }
        // If there has been no interaction with the page at all... this page will not work
        ringer
          .play()
          .then(function () {
            // Audio Is Playing
          })
          .catch(function (e) {
            console.warn("Unable to play audio file.", e);
          });
      };
      lineObj.SipSession.data.ringerObj = ringer;
    } else {
      // Play Ring Tone
      console.log("Audio:", audioBlobs.Ringtone.url);
      var ringer = new Audio(audioBlobs.Ringtone.blob);
      ringer.preload = "auto";
      ringer.loop = true;
      ringer.oncanplaythrough = function (e) {
        if (
          typeof ringer.sinkId !== "undefined" &&
          getRingerOutputID() != "default"
        ) {
          ringer
            .setSinkId(getRingerOutputID())
            .then(function () {
              console.log("Set sinkId to:", getRingerOutputID());
            })
            .catch(function (e) {
              console.warn("Failed not apply setSinkId.", e);
            });
        }
        // If there has been no interaction with the page at all... this page will not work
        ringer
          .play()
          .then(function () {
            // Audio Is Playing
          })
          .catch(function (e) {
            console.warn("Unable to play audio file.", e);
          });
      };
      lineObj.SipSession.data.ringerObj = ringer;
    }
  }

  // Custom Web hook
  if (typeof web_hook_on_invite !== "undefined") web_hook_on_invite(session);
}

let buddiesList = [];
let XMPP = null;
//let jid = getDbItem("jid", null);
//let password = getDbItem("password", null);

// IGLINTERNS5.zescocorp.zescoad.zesco.co.zm

//const strophe = Strophe;
let BOSH_SERVICE =
  "wss://" + XmppDomain + ":" + XmppWebsocketPort + XmppWebsocketPath;

let XMPPStatus = "disconnected";

function App() {
  const [count, setCount] = useState(0);
  const [buddies, setBuddies] = useState(buddiesList);
  const [selectedBuddy, setSelectedBuddy] = useState(-1);
  const [composedMsg, setComposedMsg] = useState("");

  const [converseData, setConverseData] = useState([]);
  const [addDialogStatus, setAddDialogStatus] = useState(false);
  // const [XMPPStatus, setXMPPStatus] = useState("disconnected");

  //react-sipjs
  // const {
  //   connectAndRegister,
  //   sessionManager,
  //   sessions,
  //   registerStatus,
  //   connectStatus,
  // } = useSIPProvider();
  const [username, setUsername] = useState("1000");
  const [password, setPassword] = useState("1000");

  const [callTo, setCallTo] = useState("1001");
  //react-sipjs

  function onRoster(roster) {
    console.log("Roster: ", roster);
    buddiesList = [];
    Strophe.forEachChild(roster, "query", function (query) {
      Strophe.forEachChild(query, "item", function (buddyItem) {
        // console.log("Register Buddy", buddyItem);

        // <item xmlns="jabber:iq:roster" jid="58347g3721h~800@xmpp-eu-west-1.innovateasterisk.com" name="Alfredo Dixon" subscription="both"/>
        // <item xmlns="jabber:iq:roster" jid="58347g3721h~123456@conference.xmpp-eu-west-1.innovateasterisk.com" name="Some Group Name" subscription="both"/>

        var jid = buddyItem.getAttribute("jid");
        var displayName = buddyItem.getAttribute("name");
        var node = Strophe.getNodeFromJid(jid);
        var buddyDid = node;
        console.log("JID in roster: ", jid);
        var buddyObj = {
          jid: jid,
          displayName: displayName,
          stream: getMessagesFromStream({ jid: jid, displayName: displayName }),
        };
        buddiesList.push(buddyObj);
        //buddies.push({ jid: jid, displayName: displayName });
        console.log("buddy stream: ", buddyObj.stream);
        setBuddies(buddiesList);
      });
    });

    //if (buddiesList.length != buddies.length) {
    // console.log("Updating buddies: ", buddiesList);
    // setBuddies(buddiesList);
    // console.log("Updating buddies: ", buddies);
    // //}
    //setBuddies(buddiesList);
  }

  function setMyPresence(str, desc, updateVcard) {
    if (!XMPP || XMPP.connected == false) {
      console.warn("XMPP not connected");
      return;
    }

    // ["away", "chat", "dnd", "xa"] ["Away", "Available", "Busy", "Gone"]

    console.log("Setting My Own Presence to: " + str + "(" + desc + ")");

    // if (desc == "") desc = lang.default_status;
    // //$("#regStatus").html("<i class=\"fa fa-comments\"></i> " + desc);

    var pres_request = $pres({ id: XMPP.getUniqueId(), from: XMPP.jid });
    pres_request.c("show").t(str);
    if (desc && desc != "") {
      pres_request.root();
      pres_request.c("status").t(desc);
    }
    // if (updateVcard == true) {
    //   var base64 = getPicture("profilePicture");
    //   var imgBase64 = base64.split(",")[1];
    //   var photoHash = $.md5(imgBase64);

    //   pres_request.root();
    //   pres_request.c("x", { "xmlns": "vcard-temp:x:update" });
    //   if (photoHash) {
    //     pres_request.c("photo", {}, photoHash);
    //   }
    // }

    XMPP.sendPresence(
      pres_request,
      function (result) {
        console.log("XmppSetMyPresence Response: ", result);
      },
      function (e) {
        console.warn("Error in XmppSetMyPresence", e);
      },
      30 * 1000
    );
  }

  function getRoster() {
    var iq_request = $iq({
      type: "get",
      id: XMPP.getUniqueId(),
      from: XMPP.jid,
    });
    iq_request.c("query", { xmlns: "jabber:iq:roster" });
    XMPP.sendIQ(iq_request, onRoster);
  }
  function listRoomCallback(iq) {
    let results = iq.getElementsByTagName("item");
    let roomList = [];
    for (let i = 0; i < results.length; i++) {
      roomList.push({
        jid: results.item(i).attributes.getNamedItem("jid").value,
        name: results.item(i).attributes.getNamedItem("name").value,
      });
    }
    this.setState({ chatRooms: roomList });
  }
  function onPresenceChange(presence) {
    // console.log('onPresenceChange', presence);

    var from = presence.getAttribute("from");
    var to = presence.getAttribute("to");

    var subscription = presence.getAttribute("subscription");
    var type = presence.getAttribute("type")
      ? presence.getAttribute("type")
      : "presence"; // subscribe | subscribed | unavailable
    var pres = "";
    var status = "";
    var xmlns = "";
    Strophe.forEachChild(presence, "show", function (elem) {
      pres = elem.textContent;
    });
    Strophe.forEachChild(presence, "status", function (elem) {
      status = elem.textContent;
    });
    Strophe.forEachChild(presence, "x", function (elem) {
      xmlns = elem.getAttribute("xmlns");
    });

    var fromJid = Strophe.getBareJidFromJid(from);

    // Presence notification from me to me
    if (from == to) {
      // Either my vCard updated, or my Presence updated
      return true;
    }

    // Find the buddy this message is coming from
    //var buddyObj = FindBuddyByJid(fromJid);
    // var buddyObj = buddiesList.filter((buddy)=>buddies.jid==from);
    var buddyObj = { jid: from };
    if (buddyObj == null) {
      // TODO: What to do here?

      console.warn("Buddy Not Found: ", fromJid);
      //return true;
    }

    if (type == "subscribe") {
      // <presence xmlns="jabber:client" type="subscribe" from="58347g3721h~800@...com" id="1" subscription="both" to="58347g3721h~100@...com"/>
      // <presence xmlns="jabber:client" type="subscribe" from="58347g3721h~800@...com" id="1" subscription="both" to="58347g3721h~100@...com"/>

      // One of your buddies is requestion subscription
      console.log(
        "Presence: " + buddyObj.jid + " requesting subscrption",
        from
      );

      XmppConfirmSubscription(buddyObj);

      // Also Subscribe to them
      XmppSendSubscriptionRequest(buddyObj);

      //UpdateBuddyList();
      return true;
    }
    if (type == "subscribed") {
      // One of your buddies has confimed subscription
      console.log("Presence: " + buddyObj.jid + " confimed subscrption");

      //UpdateBuddyList();
      return true;
    }
    if (type == "unavailable") {
      // <presence xmlns="jabber:client" type="unavailable" from="58347g3721h~800@...com/63zy33arw5" to="yas43lag8l@...com"/>
      console.log("Presence: " + buddyObj.jid + " unavailable");

      //UpdateBuddyList();
      return true;
    }

    if (xmlns == "vcard-temp:x:update") {
      // This is a presence update for the picture change
      console.log(
        "Presence: " +
          buddyObj.ExtNo +
          " - " +
          buddyObj.CallerIDName +
          " vCard change"
      );

      // Should check if the hash is different, could have been a non-picture change..
      // However, either way you would need to update the vCard, as there isnt a awy to just get the picture
      // XmppGetBuddyVcard(buddyObj);

      //// UpdateBuddyList();
    }

    if (pres != "") {
      // This is a regulare
      console.log(
        "Presence: " +
          buddyObj.ExtNo +
          " - " +
          buddyObj.CallerIDName +
          " is now: " +
          pres +
          "(" +
          status +
          ")"
      );

      buddyObj.presence = pres;
      buddyObj.presenceText = status == "" ? lang.default_status : status;

      // UpdateBuddyList();
    }

    return true;
  }

  function XmppConfirmSubscription(buddyObj) {
    if (!XMPP || XMPP.connected == false) {
      console.warn("XMPP not connected");
      return;
    }

    var pres_request = $pres({
      to: buddyObj.jid,
      from: XMPP.jid,
      type: "subscribed",
    });
    XMPP.sendPresence(pres_request);
    // Responses are handled in the main handler
  }
  function XmppSendSubscriptionRequest(buddyObj) {
    if (!XMPP || XMPP.connected == false) {
      console.warn("XMPP not connected");
      return;
    }

    var pres_request = $pres({
      to: buddyObj.jid,
      from: XMPP.jid,
      type: "subscribe",
    });
    XMPP.sendPresence(pres_request);
    // Responses are handled in the main handler
  }

  // XMPP Roster
  // ===========
  function XmppRemoveBuddyFromRoster(buddyObj) {
    if (!XMPP || XMPP.connected == false) {
      console.warn("XMPP not connected");
      return;
    }

    var iq_request = $iq({
      type: "set",
      id: XMPP.getUniqueId(),
      from: XMPP.jid,
    });
    iq_request.c("query", { xmlns: "jabber:iq:roster" });
    iq_request.c("item", { jid: buddyObj.jid, subscription: "remove" });
    if (buddyObj.jid == null) {
      console.warn("Missing JID", buddyObj);
      return;
    }
    console.log("Removing " + buddyObj.CallerIDName + "  from roster...");

    XMPP.sendIQ(iq_request, function (result) {
      // console.log(result);
    });
  }
  function onXmppMessage(message) {
    console.log("New message: ", message);
    let to = message.getAttribute("to");
    let from = message.getAttribute("from");

    let fromJid = from;
    let type = message.getAttribute("type");
    let elems = message.getElementsByTagName("body");
    let body = Strophe.getText(elems[0]);
    var messageId = message.getAttribute("id");
    if (body != null) {
      let name;
      if (type === "groupchat") {
        name = from.substring(from.indexOf("/") + 1, from.length);
      }
      if (type === "chat") {
        name = from.substring(0, from.indexOf("@"));
      }
      from = from.substring(0, from.indexOf("/"));
      let message = {
        to: to,
        from: from,
        type: type,
        name: name,
        message: body,
      };
      getNewMessage(message);
    }

    var buddyObj = null;
    var buddyIndex = -1;
    //var buddyObj = FindBuddyByJid(fromJid);
    console.log(
      "Selecting buddy from buddies %s, key: %s: ",
      buddiesList,
      from
    );

    console.log("Buddies length: ", buddiesList.length);
    for (var x = 0; x < buddiesList.length; x++) {
      if (buddiesList[x].jid == from) {
        buddyObj = buddiesList[x];
        console.log("Selected buddy", buddiesList[x]);
        buddyIndex = x;
      }
    }
    if (buddyObj == null) {
      buddyObj = {
        jid: from,
        displayName: from,
        stream: getMessagesFromStream({ jid: from, displayName: from }),
      };
      buddiesList.push(buddyObj);
    }

    console.log("Message from: ", buddyObj);

    // Messages
    //   if(originalMessage == ""){
    //     // Not a full message
    // }
    // else {
    if (messageId && type === "chat") {
      // Although XMPP does not require message ID's, this application does
      //XmppSendDeliveryReceipt(buddyObj, messageId);
      var originalMessage = message;
      var DateTime = utcDateNow();

      AddMessageToStream(buddyObj, messageId, "chat", body, DateTime,from, xmpp_username);

      //useEffect(() => {
      //  console.log("useEffect");
      buddiesList[buddyIndex].stream = getMessagesFromStream(buddyObj);
      setConverseData(buddiesList[buddyIndex].stream);

      setBuddies(buddiesList);
      //});

      //getRoster();
      //UpdateBuddyActivity(buddyObj.identity);
      // var streamVisible = $("#stream-"+ buddyObj.identity).is(":visible");
      // if (streamVisible) {
      //     MarkMessageRead(buddyObj, messageId);
      //     XmppSendDisplayReceipt(buddyObj, messageId);
      // }
      //RefreshStream(buddyObj);
      //ActivateStream(buddyObj, originalMessage);
    } else {
      console.warn("Sorry, messages must have an id ", message);
    }
    //}

    return true;
  }

  function onPingRequest(iq) {
    // Handle Ping Pong
    // <iq type="get" id="86-14" from="localhost" to="websocketuser@localhost/cc9fd219" >
    //     <ping xmlns="urn:xmpp:ping"/>
    // </iq>
    var id = iq.getAttribute("id");
    var to = iq.getAttribute("to");
    var from = iq.getAttribute("from");

    var iq_response = $iq({ type: "result", id: id, to: from, from: to });
    XMPP.send(iq_response);

    return true;
  }
  function onVersionRequest(iq) {
    // Handle Request for our version etc
    // <iq xmlns="jabber:client" type="get" id="419-24" to=".../..." from="innovateasterisk.com">
    //     <query xmlns="jabber:iq:version"/>
    // </iq>
    var id = iq.getAttribute("id");
    var to = iq.getAttribute("to");
    var from = iq.getAttribute("from");

    var iq_response = $iq({ type: "result", id: id, to: from, from: to });
    iq_response.c("query", { xmlns: "jabber:iq:version" });
    iq_response.c("name", null, "Browser Phone");
    iq_response.c("version", null, "0.0.1");
    iq_response.c("os", null, "Browser");
    XMPP.send(iq_response);

    return true;
  }

  function onStatusChange(status) {
    // Strophe.ConnectionStatus = status;
    if (status == Strophe.Status.CONNECTING) {
      console.log("XMPP is connecting...");
      XMPPStatus = "connecting";
    } else if (status == Strophe.Status.CONNFAIL) {
      console.warn("XMPP failed to connect.");
      XMPPStatus = "failed";
    } else if (status == Strophe.Status.DISCONNECTING) {
      console.log("XMPP is disconnecting.");
      XMPPStatus = "disconnecting";
    } else if (status == Strophe.Status.DISCONNECTED) {
      console.log("XMPP is disconnected.");

      XMPPStatus = "disconnected";
      //Keep connected
      window.setTimeout(function () {
        // reconnectXmpp();
      }, 5 * 1000);
    } else if (status == Strophe.Status.CONNECTED) {
      console.log("XMPP is connected!");

      XMPPStatus = "connected";

      //setConnected(true);

      //XMPP.addHandler(onMessage, null, 'message', null, null, null);
      //XMPP.addHandler(onSubscriptionRequest, null, 'presence', 'subscribe');
      //XMPP.addHandler(onPresence, null, 'presence');
      //     setMyPresence("Available", "Available", "")
      // XMPP.addHandler(onPingRequest, "urn:xmpp:ping", "iq", "get");
      // XMPP.addHandler(onVersionRequest, "jabber:iq:version", "iq", "get");
      setMyPresence("Available", "Available", "");

      // Get buddies
      //XmppGetBuddies();
      getRoster();

      // XMPP.ping = window.setTimeout(function () {
      //   XmppSendPing();
      // }, 5 * 1000);
      // setConnected(true);
    } else {
      console.log("XMPP is: ", Strophe.Status);
    }
  }

  var reconnectXmpp = function () {
    if (XMPP) XMPP.disconnect("");
    if (XMPP) XMPP.reset();
    //Strophe.LogLevel = 0;
    XMPP = new Strophe.Connection(BOSH_SERVICE, { keepalive: true });

    console.warn("Websocket server: ", getDbItem("wssServer", null));
    console.warn("Websocket port: ", getDbItem("WebSocketPort", null));
    console.warn("Websocket path: ", getDbItem("ServerPath", ""));
    console.warn("Sip username: ", getDbItem("SipUsername", null));
    console.warn("Sip password: ", getDbItem("SipPassword", null));
    console.warn("Sip domain: ", getDbItem("SipDomain", null));

    XmppServer = getDbItem("XmppServer", null);
    XmppWebsocketPort = getDbItem("XmppWebsocketPort", null);
    XmppWebsocketPath = getDbItem("XmppWebsocketPath", "");
    XmppDomain = getDbItem("XmppDomain", null);
    profileUser = getDbItem("profileUser", null);
    SipPassword = getDbItem("SipPassword", null);

    //const strophe = Strophe;
    BOSH_SERVICE =
      "ws://" + XmppDomain + ":" + XmppWebsocketPort + XmppWebsocketPath;

    xmpp_username = profileUser + "@" + XmppDomain; // Xmpp Doesnt like Uppercase
    xmpp_username = xmpp_username.toLowerCase();
    jid = xmpp_username;
    var xmpp_password = SipPassword;
    console.log("XMPP username: ", xmpp_username);
    console.log("XMPP password: ", xmpp_password);
    console.log("XMPP server: ", BOSH_SERVICE);

    //XMPP = null;
    if (
      XmppDomain == "" ||
      XmppServer == "" ||
      XmppWebsocketPort == "" ||
      XmppDomain == null ||
      XmppServer == null ||
      XmppWebsocketPort == null
    ) {
      console.log(
        "Cannot connect to XMPP: ",
        XmppDomain,
        XmppServer,
        XmppWebsocketPort,
        XmppWebsocketPath
      );
      return;
      //setLoginShow(true);
    }
    // // Information Query
    // XMPP.addHandler(onPingRequest, "urn:xmpp:ping", "iq", "get");
    // XMPP.addHandler(onVersionRequest, "jabber:iq:version", "iq", "get");

    // Presence
    XMPP.addHandler(onPresenceChange, null, "presence", null);
    // Message
    XMPP.addHandler(onXmppMessage, null, "message", null);

    // connection.addHandler(onMessage, null, 'message', null, null, null);
    // connection.addHandler(onSubscriptionRequest, null, 'presence', 'subscribe');
    // connection.addHandler(onPresence, null, 'presence');
    // //     setMyPresence("Available", "Available", "")
    XMPP.addHandler(onPingRequest, "urn:xmpp:ping", "iq", "get");
    XMPP.addHandler(onVersionRequest, "jabber:iq:version", "iq", "get");

    XMPP.connect(xmpp_username, xmpp_password, onStatusChange);
    //console.log("New Connection is ", connection);
  };

  //var status = Strophe.Status.DISCONNECTED;
  if (XMPPStatus != "connected") {
    // if (jid != null && password != null)
    reconnectXmpp();
    CreateUserAgent();
  }
  // if (!loginShow) {
  //   // if (jid != null && password != null)
  //    reconnectXmpp();
  //  }

  const getNewMessage = (message) => {
    // let newMessages = this.state.messages.concat(message);
    // this.setState({ messages: newMessages }, this.scrollToBottom)
    console.log(message);
  };
  function XmppSendMessage(
    buddyObj,
    message,
    messageId,
    thread,
    markable,
    type
  ) {
    if (!XMPP || XMPP.connected == false) {
      console.warn("XMPP not connected");
      return;
    }
    console.log(
      "sending message to: %s, from: %s, message %s",
      buddyObj.jid,
      XMPP.jid,
      message
    );

    if (!type) type = "normal"; // chat | error | normal | groupchat | headline
    var msg = $msg({
      to: buddyObj.jid,
      type: "chat",
      id: messageId,
      from: XMPP.jid,
    });
    if (thread && thread != "") {
      msg.c("thread").t(thread);
      msg.up();
    }
    msg.c("body").t(message);
    // XHTML-IM
    msg.up();
    msg.c("active", { xmlns: "http://jabber.org/protocol/chatstates" });
    msg.up();
    msg.c("x", { xmlns: "jabber:x:event" });
    msg.c("delivered");
    msg.up();
    msg.c("displayed");

    console.log("sending message...%s, to: %s", msg, buddyObj.jid);
    // buddyObj.chatstate = "active";
    // if(buddyObj.chatstateTimeout){
    //     window.clearTimeout(buddyObj.chatstateTimeout);
    // }
    // buddyObj.chatstateTimeout = null;
    var buddyIndex = -1;
    //var buddyObj = FindBuddyByJid(fromJid);
    //console.log("Selecting buddy from buddies %s, key: %s: ",buddiesList, from)
    for (var x = 0; x < buddiesList.length; x++) {
      if (buddiesList[x].jid == buddyObj.jid) {
        //buddyObj = buddiesList[x];
        console.log("Selected buddy", buddiesList[x]);
        buddyIndex = x;
      }
    }

    try {
      XMPP.send(msg);
      console.log("Sent message");

      var DateTime = utcDateNow();
      AddMessageToStream(buddyObj, messageId, "chat", message, DateTime,xmpp_username, buddyObj.jid, );
      // buddiesList[buddyIndex].stream = getMessagesFromStream(buddyObj);
      // console.log(buddiesList[buddyIndex].stream);
      //useEffect(() => {
      //  console.log("useEffect");
      buddiesList[buddyIndex].stream = getMessagesFromStream(buddyObj);
      setConverseData(buddiesList[buddyIndex].stream);
      setBuddies(buddiesList);
      //});
      //getRoster();
      //MarkMessageSent(buddyObj, messageId, false);
    } catch (e) {
      // MarkMessageNotSent(buddyObj, messageId, false);
      console.log(e);
    }
  }

  const UpdateBuddyList = () => {
    getRoster();
  };

  const mainContainer = {
    display: "flex",
    flexDirection: "row",
    height: "100vh",
    width: "100%",
    background: "#f8f9fb",
  };
  const container = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    flex: 0.8,
  };

  const profileArea = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    flex: 0.8,
    justifyContent: "space-between",
  };

  const Conversation = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    flex: 2,
    background: "#f6f7f8",
  };

  const profileInfoDiv = {
    display: "flex",
    flexDirection: "row",
    background: "#ededed",
    padding: "15px",
  };

  const ProfileImage = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
  };

  const SearchBox = {
    display: "flex",
    background: "#f6f6f6",
    padding: "10px",
  };

  const SearchContainer = {
    display: "flex",
    flexDirection: "row",
    background: "white",
    borderRadius: "16px",
    width: "100%",
    padding: "20px 0",
  };

  const SearchIcon = {
    width: "28px",
    height: "28px",
    paddingLeft: "10px",
  };
  const SearchInput = {
    width: "100%",
    outline: "none",
    border: "none",
    paddingLeft: "15px",
    fontSize: "17px",
    marginLeft: "10px",
  };

  const ContactItem = {
    display: "flex",
    flexBirection: "row",
    borderBottom: "1px solid #f2f2f2",
    background: "white",
    cursor: "pointer",
    padding: "15px 12px",
  };

  const ProfileIcon = {
    width: "38px",
    height: "38px",
  };
  const ContactName = {
    width: "100%",
    fontSize: "16px",
    color: "black",
  };
  const MessageText = {
    width: "20%",
    fontSize: "14px",
    marginTop: "3px",
    color: "rgba (0,0,0,0.8)",
  };
  const ContactInfo = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    margin: "0 19px",
  };

  const contactContainer = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    flex: 0.8,
  };
  const contactProfileInfoDiv = {
    display: "flex",
    flexDirection: "row",
    background: "#ededed",
    padding: "15px",
  };
  const contactProfileImage = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
  };
  const contactSearchBox = {
    display: "flex",
    background: "#f6f6f6",
    padding: "10px",
  };
  const contactSearchContainer = {
    display: "flex",
    flexDirection: "row",
    background: "white",
    borderRadius: "16px",
    width: "100%",
    padding: "20px 0",
  };
  const contactSearchIcon = {
    width: "28px",
    height: "28px",
    paddingLeft: "10px",
  };

  const contactSearchInput = {
    width: "100%",
    outline: "none",
    border: "none",
    paddingLeft: "15px",
    fontSize: "17px",
    marginLeft: "10px",
  };
  const contactContactItem = {
    display: "flex",
    flexDirection: "row",
    borderBottom: "1px solid #f2f2f2",
    background: "white",
    cursor: "pointer",
    padding: "15px 12px",
  };

  const contactProfileIcon = {
    width: "38px",
    height: "38px",
  };
  const contactContactName = {
    width: "100%",
    fontSize: "16px",
    color: "black",
  };
  const contactMessageText = {
    width: "20%",
    fontSize: "14px",
    marginTop: "3px",
    color: "rgba (0,0,0,0.8)",
  };
  const contactContactInfo = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    margin: "0 19px",
  };

  const conversContainer = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    flex: 2,
    background: "#f6f7f8",
  };
  const conversProfileHeader = {
    display: "flex",
    flexDirection: "row",
    background: "#ededed",
    padding: "15px",
    alignItems: "center",
    gap: "10px",
  };

  const conversProfileImage = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
  };

  const conversChatBox = {
    display: "flex",
    background: "#f0f0f0",
    padding: "10px",
    alignItems: "center",
    bottom: 0,
  };

  const conversEmojiImage = {
    width: "30px",
    height: "28px",
    opacity: "0.4",
    cursor: "pointer",
  };
  const conversMessageContainer = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#e5ddd6",
    overflow: "auto",
  };

  const is_your = (buddyJid) => {
    console.log(`Stream: ${buddyJid} jid: ${xmpp_username}`);

    if (buddyJid == xmpp_username)
      return {
        justifyContent: "flex-end",
        display: "flex",
        margin: "5px 16px",
      };
    else
      return {
        justifyContent: "flex-start",
        display: "flex",
        margin: "5px 16px",
      };
  };
  const conversMessageDiv = {
    justifyContent: "flex-end",
    display: "flex",
    margin: "5px 16px",
  };

  const conversMessage = {
    background: "#daf8cb",
    maxWidth: "50%",
    color: "#303030",
    padding: "8px 10px",
    fontSize: "19px",
  };

  const selectBuddy = (event, index) => {
    console.log(index);

    selectedBuddy();
  };

  const [show, setShow] = useState(false);
  const [showConverse, setShowConverse] = useState(false);
  const handleClose = (e) => {
    console.log(strContact);
    setShow(false);

    setStrContact(strContact + "@" + XmppDomain);
    XmppSendSubscriptionRequest({
      jid: strContact + "@" + XmppDomain,
    });
  };
  const handleCancel = (e) => {
    //console.log(e);
    setShow(false);
  };

  const [strContact, setStrContact] = useState("");
  const handleShow = () => {
    setLoginShow(true);
  };
  const handleShowConverse = () => {
    setShowConverse(true);
    //XmppRemoveBuddyFromRoster({jid:buddies[selectedBuddy].jid})
  };
  const deleteConverse = () => {
    setShowConverse(true);
    XmppRemoveBuddyFromRoster({ jid: buddies[selectedBuddy].jid });
  };

  const handleSetContact = (e) => {
    //console.log(strContact)
    //setStrContact(strContact + e.key);
    setStrContact(event.target.value);
  };

  const [jabberID, setJabberID] = useState("");
  const [jabberPassword, setJabberPassword] = useState("");

  const [loginShow, setLoginShow] = useState(
    getDbItem("SipUsername", null) == null ||
      getDbItem("wssServer", null) == null ||
      getDbItem("WebSocketPort", null) == null ||
      getDbItem("ServerPath", "") == null ||
      getDbItem("SipUsername", null) == null ||
      getDbItem("SipDomain", null) == null ||
      getDbItem("XmppWebsocketPort", null) == null ||
      getDbItem("XmppWebsocketPath", null) == null ||
      getDbItem("XmppDomain", null) == null
      ? true
      : false
  );
  const handleLogin = () => {
    jid = jabberID + "@" + XmppDomain;
    xmppPassword = jabberPassword;

    //localDB.setItem("jid", jid);
    //localDB.setItem("password", password);

    //function getDbItem(itemIndex, defaultValue)

    //CreateUserAgent();
    setJabberID("");
    setJabberPassword("");
    setLoginShow(false);
    console.log("Username: %s, password: %s", jid, xmppPassword);
    //reconnectXmpp();
  };
  const handleRegistration = () => {
    console.log("Not implemented");
  };

  function sipCall(callee) {
    var session = userAgent.invite(
      "sip:" + document.getElementById("number").value + "@bdt.allocloud.com"
    );

    var pc;

    session.on("trackAdded", function () {
      // We need to check the peer connection to determine which track was added

      pc = session.sessionDescriptionHandler.peerConnection;

      // Gets remote tracks
      var remoteStream = new MediaStream();
      pc.getReceivers().forEach(function (receiver) {
        remoteStream.addTrack(receiver.track);
      });
      remoteVideo.srcObject = remoteStream;
      remoteVideo.play();

      // Gets local tracks
      var localStream = new MediaStream();
      pc.getSenders().forEach(function (sender) {
        localStream.addTrack(sender.track);
      });
      localVideo.srcObject = localStream;
      localVideo.play();
    });

    userAgent.invite();
  }

  const CallCenter = () => {
    return (
      <div hidden={true}>
        <video id="remoteVideo"></video>
        <video id="localVideo"></video>
      </div>
    );
  }

  function AudioCall(callee) {
    if (callee < 0) {
      alert("Select buddy first");
      return
    }
    console.log("calling: ", buddiesList[callee].jid);
    // var targetURI = SIP.UserAgent.makeURI(
    //   "sip:" +"1000" + "@dev.zesco.co.zm"
    // );
    var targetURI = SIP.UserAgent.makeURI(
      "sip:" + buddiesList[callee].jid // + "@dev.zesco.co.zm"
    );
    var spdOptions = {
      earlyMedia: true,
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: { deviceId: "default" },
          video: { deviceId: "default" },
        },
      },
    };
    var SipSession = new SIP.Inviter(userAgent, targetURI, spdOptions);
    //pc = SipSession.sessionDescriptionHandler.peerConnection;
    //userAgent.invite("sip:" + callee2 + "@dev.zesco.co.zm")
    //var callBtn = document.getElementById("callBtn");
    // var remoteVideo = document.getElementById("remoteVideo");
    // var localVideo = document.getElementById("localVideo");

    // //callBtn.addEventListener("click", sipCall);

    // var userAgent = new UserAgent({
    //   uri: "sip:1000@dev.zesco.co.zm",
    //   wsServers: "wss://dev.zesco.co.zm:4443",
    //   password: "1000",
    //   displayName: "1000"
    // });
    // var targetURI = SIP.UserAgent.makeURI(
    //   "sip:" + callee1 + "@" + SipDomain
    // );
    SipSession.delegate = {
      onBye: function (sip) {
        onSessionReceivedBye(lineObj, sip);
      },
      onMessage: function (sip) {
        onSessionReceivedMessage(lineObj, sip);
      },
      onInvite: function (sip) {
        onSessionReinvited(lineObj, sip);
      },
      onSessionDescriptionHandler: function (sdh, provisional) {
        onSessionDescriptionHandlerCreated(sdh, provisional, true);
      },
    };

    var inviterOptions = {
      requestDelegate: {
        // OutgoingRequestDelegate
        onTrying: function (sip) {
          onInviteTrying(sip);
        },
        onProgress: function (sip) {
          onInviteProgress(sip);
        },
        // onRedirect:function(sip){
        //     onInviteRedirected(lineObj, sip);
        // },
        onAccept: function (sip) {
          onInviteAccepted(SipSession, true, sip);
        },
        onReject: function (sip) {
          onInviteRejected(sip);
        },
      },
    };
    SipSession.invite(inviterOptions).catch(function (e) {
      console.warn("Failed to send INVITE:", e);
    });
    //userAgent.invite(targetURI)

    // userAgent.on("invite", function (session) {
    //   console.warn("invite");
    //   session.accept();
    //   var pc;

    //   session.on("trackAdded", function () {
    //     // We need to check the peer connection to determine which track was added

    //     pc = session.sessionDescriptionHandler.peerConnection;

    //     // Gets remote tracks
    //     var remoteStream = new MediaStream();
    //     remoteVideo.srcObject = remoteStream;
    //     remoteVideo.play().then(() => {
    //       pc.getReceivers().forEach(function (receiver) {
    //         remoteStream.addTrack(receiver.track);
    //       });
    //     });

    //     // Gets local tracks
    //     var localStream = new MediaStream();
    //     pc.getSenders().forEach(function (sender) {
    //       localStream.addTrack(sender.track);
    //     });
    //     localVideo.srcObject = localStream;
    //     localVideo.play();
    //   });
    // });
  }

  // Phone Lines
  // ===========
  var Line = function (lineNumber, displayName, displayNumber, buddyObj) {
    this.LineNumber = lineNumber;
    this.DisplayName = displayName;
    this.DisplayNumber = displayNumber;
    this.IsSelected = false;
    //this.BuddyObj = buddyObj;
    this.SipSession = null;
    this.LocalSoundMeter = null;
    this.RemoteSoundMeter = null;
  };

  function onSessionDescriptionHandlerCreated(sdh, provisional, includeVideo) {
    if (sdh) {
      if (sdh.peerConnection) {
        sdh.peerConnection.ontrack = function (event) {
          // We need to check the peer connection to determine which track was added

          pc = sdh.peerConnection;

          // Gets remote tracks
          var remoteStream = new MediaStream();
          remoteVideo.srcObject = remoteStream;
          remoteVideo.play().then(() => {
            pc.getReceivers().forEach(function (receiver) {
              remoteStream.addTrack(receiver.track);
            });
          });

          // Gets local tracks
          var localStream = new MediaStream();
          pc.getSenders().forEach(function (sender) {
            localStream.addTrack(sender.track);
          });
          localVideo.srcObject = localStream;
          localVideo.play();
        };
      }
    }
  }
  // General end of Session
  function teardownSession(lineObj) {
    if (lineObj == null || lineObj.SipSession == null) return;

    var session = lineObj.SipSession;
    if (session.data.teardownComplete == true) return;
    session.data.teardownComplete = true; // Run this code only once

    // Call UI
    if (session.data.earlyReject != true) {
      //HidePopup();
    }

    // End any child calls
    if (session.data.childsession) {
      session.data.childsession
        .dispose()
        .then(function () {
          session.data.childsession = null;
        })
        .catch(function (error) {
          session.data.childsession = null;
          // Suppress message
        });
    }

    // Mixed Tracks
    if (
      session.data.AudioSourceTrack &&
      session.data.AudioSourceTrack.kind == "audio"
    ) {
      session.data.AudioSourceTrack.stop();
      session.data.AudioSourceTrack = null;
    }
    // Stop any Early Media
    if (session.data.earlyMedia) {
      session.data.earlyMedia.pause();
      session.data.earlyMedia.removeAttribute("src");
      session.data.earlyMedia.load();
      session.data.earlyMedia = null;
    }
    // Stop any ringing calls
    if (session.data.ringerObj) {
      session.data.ringerObj.pause();
      session.data.ringerObj.removeAttribute("src");
      session.data.ringerObj.load();
      session.data.ringerObj = null;
    }

    // Stop Recording if we are
    StopRecording(lineObj.LineNumber, true);

    // Audio Meters
    if (lineObj.LocalSoundMeter != null) {
      lineObj.LocalSoundMeter.stop();
      lineObj.LocalSoundMeter = null;
    }
    if (lineObj.RemoteSoundMeter != null) {
      lineObj.RemoteSoundMeter.stop();
      lineObj.RemoteSoundMeter = null;
    }

    // Make sure you have released the microphone
    if (
      session &&
      session.sessionDescriptionHandler &&
      session.sessionDescriptionHandler.peerConnection
    ) {
      var pc = session.sessionDescriptionHandler.peerConnection;
      pc.getSenders().forEach(function (RTCRtpSender) {
        if (RTCRtpSender.track && RTCRtpSender.track.kind == "audio") {
          RTCRtpSender.track.stop();
        }
      });
    }

    // End timers
    window.clearInterval(session.data.videoResampleInterval);
    window.clearInterval(session.data.callTimer);

    // Add to stream
    //AddCallMessage(lineObj.BuddyObj.identity, session);

    // Check if this call was missed
    if (session.data.calldirection == "inbound") {
      if (session.data.earlyReject) {
        // Call was rejected without even ringing
        IncreaseMissedBadge(session.data.buddyId);
      } else if (
        session.data.terminateby == "them" &&
        session.data.startTime == null
      ) {
        // Call Terminated by them during ringing
        if (session.data.reasonCode == 0) {
          // Call was canceled, and not answered elsewhere
          IncreaseMissedBadge(session.data.buddyId);
        }
      }
    }

    // Close up the UI
    // window.setTimeout(function () {
    //     RemoveLine(lineObj);
    // }, 1000);

    UpdateBuddyList();
    if (session.data.earlyReject != true) {
      UpdateUI();
    }

    // Custom Web hook
    if (typeof web_hook_on_terminate !== "undefined")
      web_hook_on_terminate(session);
  }

  function onInviteAccepted(SipSession, includeVideo, response) {
    // Call in progress
    var session = SipSession;

    // if(session.data.earlyMedia){
    //     session.data.earlyMedia.pause();
    //     session.data.earlyMedia.removeAttribute('src');
    //     session.data.earlyMedia.load();
    //     session.data.earlyMedia = null;
    // }

    // window.clearInterval(session.data.callTimer);
    // $("#line-" + lineObj.LineNumber + "-timer").show();
    // var startTime = moment.utc();
    // session.data.startTime = startTime;
    // session.data.callTimer = window.setInterval(function(){
    //     var now = moment.utc();
    //     var duration = moment.duration(now.diff(startTime));
    //     var timeStr = formatShortDuration(duration.asSeconds());
    //     $("#line-" + lineObj.LineNumber + "-timer").html(timeStr);
    //     $("#line-" + lineObj.LineNumber + "-datetime").html(timeStr);
    // }, 1000);
    // session.isOnHold = false;
    // session.data.started = true;

    // if(includeVideo){
    //     // Preview our stream from peer connection
    //     var localVideoStream = new MediaStream();
    //     var pc = session.sessionDescriptionHandler.peerConnection;
    //     pc.getSenders().forEach(function (sender) {
    //         if(sender.track && sender.track.kind == "video"){
    //             localVideoStream.addTrack(sender.track);
    //         }
    //     });
    //     var localVideo = $("#line-" + lineObj.LineNumber + "-localVideo").get(0);
    //     localVideo.srcObject = localVideoStream;
    //     localVideo.onloadedmetadata = function(e) {
    //         localVideo.play();
    //     }

    //     // Apply Call Bandwidth Limits
    //     if(MaxVideoBandwidth > -1){
    //         pc.getSenders().forEach(function (sender) {
    //             if(sender.track && sender.track.kind == "video"){

    //                 var parameters = sender.getParameters();
    //                 if(!parameters.encodings) parameters.encodings = [{}];
    //                 parameters.encodings[0].maxBitrate = MaxVideoBandwidth * 1000;

    //                 console.log("Applying limit for Bandwidth to: ", MaxVideoBandwidth + "kb per second")

    //                 // Only going to try without re-negotiations
    //                 sender.setParameters(parameters).catch(function(e){
    //                     console.warn("Cannot apply Bandwidth Limits", e);
    //                 });

    //             }
    //         });
    //     }

    // }

    // // Start Call Recording
    // if(RecordAllCalls || CallRecordingPolicy == "enabled") {
    //     StartRecording(lineObj.LineNumber);
    // }

    // if(includeVideo){
    //     // Layout for Video Call
    //     $("#line-"+ lineObj.LineNumber +"-progress").hide();
    //     $("#line-"+ lineObj.LineNumber +"-VideoCall").show();
    //     $("#line-"+ lineObj.LineNumber +"-ActiveCall").show();

    //     $("#line-"+ lineObj.LineNumber +"-btn-Conference").hide(); // Cannot conference a Video Call (Yet...)
    //     $("#line-"+ lineObj.LineNumber +"-btn-CancelConference").hide();
    //     $("#line-"+ lineObj.LineNumber +"-Conference").hide();

    //     $("#line-"+ lineObj.LineNumber +"-btn-Transfer").hide(); // Cannot transfer a Video Call (Yet...)
    //     $("#line-"+ lineObj.LineNumber +"-btn-CancelTransfer").hide();
    //     $("#line-"+ lineObj.LineNumber +"-Transfer").hide();

    //     // Default to use Camera
    //     $("#line-"+ lineObj.LineNumber +"-src-camera").prop("disabled", true);
    //     $("#line-"+ lineObj.LineNumber +"-src-canvas").prop("disabled", false);
    //     $("#line-"+ lineObj.LineNumber +"-src-desktop").prop("disabled", false);
    //     $("#line-"+ lineObj.LineNumber +"-src-video").prop("disabled", false);
    // }
    // else {
    //     // Layout for Audio Call
    //     $("#line-" + lineObj.LineNumber + "-progress").hide();
    //     $("#line-" + lineObj.LineNumber + "-VideoCall").hide();
    //     $("#line-" + lineObj.LineNumber + "-AudioCall").show();
    //     // Call Control
    //     $("#line-"+ lineObj.LineNumber +"-btn-Mute").show();
    //     $("#line-"+ lineObj.LineNumber +"-btn-Unmute").hide();
    //     $("#line-"+ lineObj.LineNumber +"-btn-start-recording").show();
    //     $("#line-"+ lineObj.LineNumber +"-btn-stop-recording").hide();
    //     $("#line-"+ lineObj.LineNumber +"-btn-Hold").show();
    //     $("#line-"+ lineObj.LineNumber +"-btn-Unhold").hide();
    //     $("#line-"+ lineObj.LineNumber +"-btn-Transfer").show();
    //     $("#line-"+ lineObj.LineNumber +"-btn-CancelTransfer").hide();
    //     $("#line-"+ lineObj.LineNumber +"-btn-Conference").show();
    //     $("#line-"+ lineObj.LineNumber +"-btn-CancelConference").hide();
    //     $("#line-"+ lineObj.LineNumber +"-btn-ShowDtmf").show();
    //     $("#line-"+ lineObj.LineNumber +"-btn-settings").show();
    //     $("#line-"+ lineObj.LineNumber +"-btn-ShowCallStats").show();
    //     $("#line-"+ lineObj.LineNumber +"-btn-HideCallStats").hide();
    //     $("#line-"+ lineObj.LineNumber +"-btn-ShowTimeline").show();
    //     $("#line-"+ lineObj.LineNumber +"-btn-HideTimeline").hide();
    //     $("#line-"+ lineObj.LineNumber +"-btn-present-src").hide();
    //     $("#line-"+ lineObj.LineNumber +"-btn-expand").hide();
    //     $("#line-"+ lineObj.LineNumber +"-btn-restore").hide();
    //     $("#line-"+ lineObj.LineNumber +"-btn-End").show();
    //     // Show the Call
    //     $("#line-" + lineObj.LineNumber + "-ActiveCall").show();
    // }

    // UpdateBuddyList()
    // updateLineScroll(lineObj.LineNumber);

    // // Start Audio Monitoring
    // lineObj.LocalSoundMeter = StartLocalAudioMediaMonitoring(lineObj.LineNumber, session);
    // lineObj.RemoteSoundMeter = StartRemoteAudioMediaMonitoring(lineObj.LineNumber, session);

    // $("#line-" + lineObj.LineNumber + "-msg").html(lang.call_in_progress);

    // if(includeVideo && StartVideoFullScreen) ExpandVideoArea(lineObj.LineNumber);

    // // Custom Web hook
    // if(typeof web_hook_on_modify !== 'undefined') web_hook_on_modify("accepted", session);

    //pc = session.sessionDescriptionHandler.peerConnection;
    var remoteVideo = document.getElementById("remoteVideo");
    var localVideo = document.getElementById("localVideo");
    //var localVideoStream = new MediaStream();
    var pc = session.sessionDescriptionHandler.peerConnection;
    // Gets remote tracks
    var remoteStream = new MediaStream();
    pc.getReceivers().forEach(function (receiver) {
      remoteStream.addTrack(receiver.track);
    });
    remoteVideo.srcObject = remoteStream;
    remoteVideo.play();

    // Gets local tracks
    var localStream = new MediaStream();
    pc.getSenders().forEach(function (sender) {
      localStream.addTrack(sender.track);
    });
    localVideo.srcObject = localStream;
    localVideo.play();
    // var remoteVideo = document.getElementById("remoteVideo");
    // var localVideo = document.getElementById("localVideo");
  }

  // Outgoing INVITE
  function onInviteTrying(response) {
    //$("#line-" + lineObj.LineNumber + "-msg").html(lang.trying);

    // Custom Web hook
    // if (typeof web_hook_on_modify !== "undefined")
    //   web_hook_on_modify("trying", lineObj.SipSession);
    console.log(response);
  }

  function onInviteProgress(response) {
    console.log("Call Progress:", response.message.statusCode);

    // // Provisional 1xx
    // // response.message.reasonPhrase
    // if (response.message.statusCode == 180) {
    //   //$("#line-" + lineObj.LineNumber + "-msg").html(lang.ringing);

    //   var soundFile = audioBlobs.EarlyMedia_European;
    //   if (UserLocale().indexOf("us") > -1) soundFile = audioBlobs.EarlyMedia_US;
    //   if (UserLocale().indexOf("gb") > -1) soundFile = audioBlobs.EarlyMedia_UK;
    //   if (UserLocale().indexOf("au") > -1)
    //     soundFile = audioBlobs.EarlyMedia_Australia;
    //   if (UserLocale().indexOf("jp") > -1)
    //     soundFile = audioBlobs.EarlyMedia_Japan;

    //   // Play Early Media
    //   console.log("Audio:", soundFile.url);
    //   if (lineObj.SipSession.data.earlyMedia) {
    //     // There is already early media playing
    //     // onProgress can be called multiple times
    //     // Don't add it again
    //     console.log("Early Media already playing");
    //   } else {
    //     var earlyMedia = new Audio(soundFile.blob);
    //     earlyMedia.preload = "auto";
    //     earlyMedia.loop = true;
    //     earlyMedia.oncanplaythrough = function (e) {
    //       if (
    //         typeof earlyMedia.sinkId !== "undefined" &&
    //         getAudioOutputID() != "default"
    //       ) {
    //         earlyMedia
    //           .setSinkId(getAudioOutputID())
    //           .then(function () {
    //             console.log("Set sinkId to:", getAudioOutputID());
    //           })
    //           .catch(function (e) {
    //             console.warn("Failed not apply setSinkId.", e);
    //           });
    //       }
    //       earlyMedia
    //         .play()
    //         .then(function () {
    //           // Audio Is Playing
    //         })
    //         .catch(function (e) {
    //           console.warn("Unable to play audio file.", e);
    //         });
    //     };
    //     lineObj.SipSession.data.earlyMedia = earlyMedia;
    //   }
    // } else if (response.message.statusCode === 183) {
    //   // $("#line-" + lineObj.LineNumber + "-msg").html(
    //   //   response.message.reasonPhrase + "..."
    //   // );
    //   // Add UI to allow DTMF
    //   //$("#line-" + lineObj.LineNumber + "-early-dtmf").show();
    // } else {
    //   // 181 = Call is Being Forwarded
    //   // 182 = Call is queued (Busy server!)
    //   // 199 = Call is Terminated (Early Dialog)
    //   // $("#line-" + lineObj.LineNumber + "-msg").html(
    //   //   response.message.reasonPhrase + "..."
    //   // );
    // }

    // // Custom Web hook
    // if (typeof web_hook_on_modify !== "undefined")
    //   web_hook_on_modify("progress", lineObj.SipSession);
  }

  function onInviteRejected(response) {
    console.log("INVITE Rejected:", response.message.reasonPhrase);

    // lineObj.SipSession.data.terminateby = "them";
    // lineObj.SipSession.data.reasonCode = response.message.statusCode;
    // lineObj.SipSession.data.reasonText = response.message.reasonPhrase;

    //teardownSession(lineObj);
  }
  function FindLineByNumber(lineNum) {
    for (var l = 0; l < Lines.length; l++) {
      if (Lines[l].LineNumber == lineNum) return Lines[l];
    }
    return null;
  }

  // function AudioCall(
  //   dialledNumber //, extraHeaders
  // ) {
  //   if (userAgent == null) return;
  //   if (userAgent.isRegistered() == false) return;
  //   //if(lineObj == null) return;

  //   // var lineObj = Line("1001","1001","1001")

  //   var lineObj = {
  //     LineNumber: dialledNumber,
  //     DisplayName: dialledNumber,
  //     DisplayNumber: dialledNumber,
  //     IsSelected: false,
  //     //this.BuddyObj = buddyObj;
  //     SipSession: null,
  //     LocalSoundMeter: null,
  //     RemoteSoundMeter: null,
  //   };

  //   if (HasAudioDevice == false) {
  //     Alert(lang.alert_no_microphone);
  //     return;
  //   }

  //   var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();

  //   var spdOptions = {
  //     earlyMedia: true,
  //     sessionDescriptionHandlerOptions: {
  //       constraints: {
  //         audio: { deviceId: "default" },
  //         video: false,
  //       },
  //     },
  //   };
  //   // Configure Audio
  //   var currentAudioDevice = getAudioSrcID();
  //   if (currentAudioDevice != "default") {
  //     var confirmedAudioDevice = false;
  //     for (var i = 0; i < AudioinputDevices.length; ++i) {
  //       if (currentAudioDevice == AudioinputDevices[i].deviceId) {
  //         confirmedAudioDevice = true;
  //         break;
  //       }
  //     }
  //     if (confirmedAudioDevice) {
  //       spdOptions.sessionDescriptionHandlerOptions.constraints.audio.deviceId =
  //         { exact: currentAudioDevice };
  //     } else {
  //       console.warn(
  //         "The audio device you used before is no longer available, default settings applied."
  //       );
  //       localDB.setItem("AudioSrcId", "default");
  //     }
  //   }
  //   // Add additional Constraints
  //   if (supportedConstraints.autoGainControl) {
  //     spdOptions.sessionDescriptionHandlerOptions.constraints.audio.autoGainControl =
  //       AutoGainControl;
  //   }
  //   if (supportedConstraints.echoCancellation) {
  //     spdOptions.sessionDescriptionHandlerOptions.constraints.audio.echoCancellation =
  //       EchoCancellation;
  //   }
  //   if (supportedConstraints.noiseSuppression) {
  //     spdOptions.sessionDescriptionHandlerOptions.constraints.audio.noiseSuppression =
  //       NoiseSuppression;
  //   }
  //   // Added to the SIP Headers
  //   // if(extraHeaders) {
  //   //     spdOptions.extraHeaders = extraHeaders;
  //   // } else {
  //   //     spdOptions.extraHeaders = [];
  //   // }
  //   // if(InviteExtraHeaders && InviteExtraHeaders != "" && InviteExtraHeaders != "{}"){
  //   //     try{
  //   //         var inviteExtraHeaders = JSON.parse(InviteExtraHeaders);
  //   //         for (const [key, value] of Object.entries(inviteExtraHeaders)) {
  //   //             if(value == ""){
  //   //                 // This is a header, must be format: "Field: Value"
  //   //             } else {
  //   //                 spdOptions.extraHeaders.push(key + ": "+  value);
  //   //             }
  //   //         }
  //   //     } catch(e){}
  //   // }

  //   //$("#line-" + lineObj.LineNumber + "-msg").html(lang.starting_audio_call);
  //   //$("#line-" + lineObj.LineNumber + "-timer").show();

  //   var startTime = moment.utc();

  //   // Invite
  //   console.log("INVITE (audio): " + dialledNumber + "@" + SipDomain);

  //   var targetURI = SIP.UserAgent.makeURI(
  //     "sip:" + dialledNumber.replace(/#/g, "%23") + "@" + SipDomain
  //   );
  //   lineObj.SipSession = new SIP.Inviter(userAgent, targetURI, spdOptions);
  //   lineObj.SipSession.data = {};
  //   lineObj.SipSession.data.line = lineObj.LineNumber;
  //   //lineObj.SipSession.data.buddyId = lineObj.BuddyObj.identity;
  //   //lineObj.SipSession.data.calldirection = "outbound";
  //   lineObj.SipSession.data.dst = dialledNumber;
  //   lineObj.SipSession.data.callstart = startTime.format(
  //     "YYYY-MM-DD HH:mm:ss UTC"
  //   );
  //   lineObj.SipSession.data.callTimer = window.setInterval(function () {
  //     var now = moment.utc();
  //     var duration = moment.duration(now.diff(startTime));
  //     var timeStr = formatShortDuration(duration.asSeconds());
  //     //$("#line-" + lineObj.LineNumber + "-timer").html(timeStr);
  //     //$("#line-" + lineObj.LineNumber + "-datetime").html(timeStr);
  //   }, 1000);
  //   lineObj.SipSession.data.VideoSourceDevice = null;
  //   lineObj.SipSession.data.AudioSourceDevice = getAudioSrcID();
  //   lineObj.SipSession.data.AudioOutputDevice = getAudioOutputID();
  //   lineObj.SipSession.data.terminateby = "them";
  //   lineObj.SipSession.data.withvideo = false;
  //   lineObj.SipSession.data.earlyReject = false;
  //   lineObj.SipSession.isOnHold = false;
  //   lineObj.SipSession.delegate = {
  //     onBye: function (sip) {
  //       onSessionReceivedBye(lineObj, sip);
  //     },
  //     onMessage: function (sip) {
  //       onSessionReceivedMessage(lineObj, sip);
  //     },
  //     onInvite: function (sip) {
  //       onSessionReinvited(lineObj, sip);
  //     },
  //     onSessionDescriptionHandler: function (sdh, provisional) {
  //       onSessionDescriptionHandlerCreated(lineObj, sdh, provisional, false);
  //     },
  //   };
  //   var inviterOptions = {
  //     requestDelegate: {
  //       // OutgoingRequestDelegate
  //       onTrying: function (sip) {
  //         onInviteTrying(lineObj, sip);
  //       },
  //       onProgress: function (sip) {
  //         onInviteProgress(lineObj, sip);
  //       },
  //       onRedirect: function (sip) {
  //         onInviteRedirected(lineObj, sip);
  //       },
  //       onAccept: function (sip) {
  //         onInviteAccepted(lineObj, false, sip);
  //       },
  //       onReject: function (sip) {
  //         onInviteRejected(lineObj, sip);
  //       },
  //     },
  //   };
  //   lineObj.SipSession.invite(inviterOptions).catch(function (e) {
  //     console.warn("Failed to send INVITE:", e);
  //   });

  //   // $("#line-" + lineObj.LineNumber + "-btn-settings").removeAttr('disabled');
  //   // $("#line-" + lineObj.LineNumber + "-btn-audioCall").prop('disabled','disabled');
  //   // $("#line-" + lineObj.LineNumber + "-btn-videoCall").prop('disabled','disabled');
  //   // $("#line-" + lineObj.LineNumber + "-btn-search").removeAttr('disabled');

  //   // $("#line-" + lineObj.LineNumber + "-progress").show();
  //   // $("#line-" + lineObj.LineNumber + "-msg").show();

  //   // UpdateUI();
  //   // UpdateBuddyList();
  //   // updateLineScroll(lineObj.LineNumber);

  //   // // Custom Web hook
  //   // if(typeof web_hook_on_invite !== 'undefined') web_hook_on_invite(lineObj.SipSession);
  // }

  // Sessions & During Call Activity
  // ===============================
  function getSession(buddy) {
    if (userAgent == null) {
      console.warn("userAgent is null");
      return null;
    }
    if (userAgent.isRegistered() == false) {
      console.warn("userAgent is not registered");
      return null;
    }

    var rtnSession = null;
    $.each(userAgent.sessions, function (i, session) {
      if (session.data.buddyId == buddy) {
        rtnSession = session;
        return false;
      }
    });
    return rtnSession;
  }
  function countSessions(id) {
    var rtn = 0;
    if (userAgent == null) {
      console.warn("userAgent is null");
      return 0;
    }
    $.each(userAgent.sessions, function (i, session) {
      if (id != session.id) rtn++;
    });
    return rtn;
  }
  function StartRecording(lineNum) {
    if (CallRecordingPolicy == "disabled") {
      console.warn("Policy Disabled: Call Recording");
      return;
    }
    var lineObj = FindLineByNumber(lineNum);
    if (lineObj == null) return;

    $("#line-" + lineObj.LineNumber + "-btn-start-recording").hide();
    $("#line-" + lineObj.LineNumber + "-btn-stop-recording").show();

    var session = lineObj.SipSession;
    if (session == null) {
      console.warn("Could not find session");
      return;
    }

    var id = uID();

    if (!session.data.recordings) session.data.recordings = [];
    session.data.recordings.push({
      uID: id,
      startTime: utcDateNow(),
      stopTime: utcDateNow(),
    });

    if (
      session.data.mediaRecorder &&
      session.data.mediaRecorder.state == "recording"
    ) {
      console.warn("Call Recording was somehow on... stopping call recording");
      StopRecording(lineNum, true);
      // State should be inactive now, but the data available event will fire
      // Note: potential race condition here if someone hits the stop, and start quite quickly.
    }
    console.log("Creating call recorder...");

    session.data.recordingAudioStreams = new MediaStream();
    var pc = session.sessionDescriptionHandler.peerConnection;
    pc.getSenders().forEach(function (RTCRtpSender) {
      if (RTCRtpSender.track && RTCRtpSender.track.kind == "audio") {
        console.log(
          "Adding sender audio track to record:",
          RTCRtpSender.track.label
        );
        session.data.recordingAudioStreams.addTrack(RTCRtpSender.track);
      }
    });
    pc.getReceivers().forEach(function (RTCRtpReceiver) {
      if (RTCRtpReceiver.track && RTCRtpReceiver.track.kind == "audio") {
        console.log(
          "Adding receiver audio track to record:",
          RTCRtpReceiver.track.label
        );
        session.data.recordingAudioStreams.addTrack(RTCRtpReceiver.track);
      }
    });

    // Resample the Video Recording
    if (session.data.withvideo) {
      var recordingWidth = 640;
      var recordingHeight = 360;
      var pnpVideSize = 100;
      if (RecordingVideoSize == "HD") {
        recordingWidth = 1280;
        recordingHeight = 720;
        pnpVideSize = 144;
      }
      if (RecordingVideoSize == "FHD") {
        recordingWidth = 1920;
        recordingHeight = 1080;
        pnpVideSize = 240;
      }
      // Create Canvas
      session.data.recordingCanvas = $("<canvas/>").get(0);
      session.data.recordingCanvas.width =
        RecordingLayout == "side-by-side"
          ? recordingWidth * 2 + 5
          : recordingWidth;
      session.data.recordingCanvas.height = recordingHeight;
      session.data.recordingContext =
        session.data.recordingCanvas.getContext("2d");

      // Capture Interval
      window.clearInterval(session.data.recordingRedrawInterval);
      session.data.recordingRedrawInterval = window.setInterval(function () {
        // Video Source
        var pnpVideo = $("#line-" + lineObj.LineNumber + "-localVideo").get(0);

        var mainVideo = null;
        var validVideos = [];
        var talkingVideos = [];
        var videoContainer = $(
          "#line-" + lineObj.LineNumber + "-remote-videos"
        );
        var potentialVideos = videoContainer.find("video").length;
        if (potentialVideos == 0) {
          // Nothing to render
          // console.log("Nothing to render in this frame")
        } else if (potentialVideos == 1) {
          mainVideo = videoContainer.find("video")[0];
          // console.log("Only one video element", mainVideo);
        } else if (potentialVideos > 1) {
          // Decide what video to record
          videoContainer.find("video").each(function (i, video) {
            var videoTrack = video.srcObject.getVideoTracks()[0];
            if (
              videoTrack.readyState == "live" &&
              video.videoWidth > 10 &&
              video.videoHeight >= 10
            ) {
              if (video.srcObject.isPinned == true) {
                mainVideo = video;
                // console.log("Multiple Videos using last PINNED frame");
              }
              if (video.srcObject.isTalking == true) {
                talkingVideos.push(video);
              }
              validVideos.push(video);
            }
          });

          // Check if we found something
          if (mainVideo == null && talkingVideos.length >= 1) {
            // Nothing pinned use talking
            mainVideo = talkingVideos[0];
            // console.log("Multiple Videos using first talking frame");
          }
          if (mainVideo == null && validVideos.length >= 1) {
            // Nothing pinned or talking use valid
            mainVideo = validVideos[0];
            // console.log("Multiple Videos using first VALID frame");
          }
        }

        // Main Video
        var videoWidth =
          mainVideo && mainVideo.videoWidth > 0
            ? mainVideo.videoWidth
            : recordingWidth;
        var videoHeight =
          mainVideo && mainVideo.videoHeight > 0
            ? mainVideo.videoHeight
            : recordingHeight;
        if (videoWidth >= videoHeight) {
          // Landscape / Square
          var scale = recordingWidth / videoWidth;
          videoWidth = recordingWidth;
          videoHeight = videoHeight * scale;
          if (videoHeight > recordingHeight) {
            var scale = recordingHeight / videoHeight;
            videoHeight = recordingHeight;
            videoWidth = videoWidth * scale;
          }
        } else {
          // Portrait
          var scale = recordingHeight / videoHeight;
          videoHeight = recordingHeight;
          videoWidth = videoWidth * scale;
        }
        var offsetX =
          videoWidth < recordingWidth ? (recordingWidth - videoWidth) / 2 : 0;
        var offsetY =
          videoHeight < recordingHeight
            ? (recordingHeight - videoHeight) / 2
            : 0;
        if (RecordingLayout == "side-by-side")
          offsetX = recordingWidth + 5 + offsetX;

        // Picture-in-Picture Video
        var pnpVideoHeight = pnpVideo.videoHeight;
        var pnpVideoWidth = pnpVideo.videoWidth;
        if (pnpVideoHeight > 0) {
          if (pnpVideoWidth >= pnpVideoHeight) {
            var scale = pnpVideSize / pnpVideoHeight;
            pnpVideoHeight = pnpVideSize;
            pnpVideoWidth = pnpVideoWidth * scale;
          } else {
            var scale = pnpVideSize / pnpVideoWidth;
            pnpVideoWidth = pnpVideSize;
            pnpVideoHeight = pnpVideoHeight * scale;
          }
        }
        var pnpOffsetX = 10;
        var pnpOffsetY = 10;
        if (RecordingLayout == "side-by-side") {
          pnpVideoWidth = pnpVideo.videoWidth;
          pnpVideoHeight = pnpVideo.videoHeight;
          if (pnpVideoWidth >= pnpVideoHeight) {
            // Landscape / Square
            var scale = recordingWidth / pnpVideoWidth;
            pnpVideoWidth = recordingWidth;
            pnpVideoHeight = pnpVideoHeight * scale;
            if (pnpVideoHeight > recordingHeight) {
              var scale = recordingHeight / pnpVideoHeight;
              pnpVideoHeight = recordingHeight;
              pnpVideoWidth = pnpVideoWidth * scale;
            }
          } else {
            // Portrait
            var scale = recordingHeight / pnpVideoHeight;
            pnpVideoHeight = recordingHeight;
            pnpVideoWidth = pnpVideoWidth * scale;
          }
          pnpOffsetX =
            pnpVideoWidth < recordingWidth
              ? (recordingWidth - pnpVideoWidth) / 2
              : 0;
          pnpOffsetY =
            pnpVideoHeight < recordingHeight
              ? (recordingHeight - pnpVideoHeight) / 2
              : 0;
        }

        // Draw Background
        session.data.recordingContext.fillRect(
          0,
          0,
          session.data.recordingCanvas.width,
          session.data.recordingCanvas.height
        );

        // Draw Main Video
        if (mainVideo && mainVideo.videoHeight > 0) {
          session.data.recordingContext.drawImage(
            mainVideo,
            offsetX,
            offsetY,
            videoWidth,
            videoHeight
          );
        }

        // Draw PnP
        if (
          pnpVideo.videoHeight > 0 &&
          (RecordingLayout == "side-by-side" || RecordingLayout == "them-pnp")
        ) {
          // Only Draw the Pnp Video when needed
          session.data.recordingContext.drawImage(
            pnpVideo,
            pnpOffsetX,
            pnpOffsetY,
            pnpVideoWidth,
            pnpVideoHeight
          );
        }
      }, Math.floor(1000 / RecordingVideoFps));

      // Start Video Capture
      session.data.recordingVideoMediaStream =
        session.data.recordingCanvas.captureStream(RecordingVideoFps);
    }

    session.data.recordingMixedAudioVideoRecordStream = new MediaStream();
    session.data.recordingMixedAudioVideoRecordStream.addTrack(
      MixAudioStreams(session.data.recordingAudioStreams).getAudioTracks()[0]
    );
    if (session.data.withvideo) {
      session.data.recordingMixedAudioVideoRecordStream.addTrack(
        session.data.recordingVideoMediaStream.getVideoTracks()[0]
      );
    }

    var mediaType = "audio/webm"; // audio/mp4 | audio/webm;
    if (session.data.withvideo) mediaType = "video/webm";
    var options = {
      mimeType: mediaType,
    };
    // Note: It appears that mimeType is optional, but... Safari is truly dreadful at recording in mp4, and doesn't have webm yet
    // You you can leave this as default, or force webm, however know that Safari will be no good at this either way.
    // session.data.mediaRecorder = new MediaRecorder(session.data.recordingMixedAudioVideoRecordStream, options);
    session.data.mediaRecorder = new MediaRecorder(
      session.data.recordingMixedAudioVideoRecordStream
    );
    session.data.mediaRecorder.data = {};
    session.data.mediaRecorder.data.id = "" + id;
    session.data.mediaRecorder.data.sessionId = "" + session.id;
    session.data.mediaRecorder.data.buddyId = "" + lineObj.BuddyObj.identity;
    session.data.mediaRecorder.ondataavailable = function (event) {
      console.log(
        "Got Call Recording Data: ",
        event.data.size + "Bytes",
        this.data.id,
        this.data.buddyId,
        this.data.sessionId
      );
      // Save the Audio/Video file
      SaveCallRecording(
        event.data,
        this.data.id,
        this.data.buddyId,
        this.data.sessionId
      );
    };

    console.log("Starting Call Recording", id);
    session.data.mediaRecorder.start(); // Safari does not support time slice
    session.data.recordings[session.data.recordings.length - 1].startTime =
      utcDateNow();

    $("#line-" + lineObj.LineNumber + "-msg").html(lang.call_recording_started);

    updateLineScroll(lineNum);
  }
  function SaveCallRecording(blob, id, buddy, sessionid) {
    if (CallRecordingsIndexDb != null) {
      // Prepare data to write
      var data = {
        uID: id,
        sessionid: sessionid,
        bytes: blob.size,
        type: blob.type,
        mediaBlob: blob,
      };
      // Commit Transaction
      var transaction = CallRecordingsIndexDb.transaction(
        ["Recordings"],
        "readwrite"
      );
      var objectStoreAdd = transaction.objectStore("Recordings").add(data);
      objectStoreAdd.onsuccess = function (event) {
        console.log(
          "Call Recording Success: ",
          id,
          blob.size,
          blob.type,
          buddy,
          sessionid
        );
      };
    } else {
      console.warn("CallRecordingsIndexDb is null.");
    }
  }
  function StopRecording(lineNum, noConfirm) {
    var lineObj = FindLineByNumber(lineNum);
    if (lineObj == null || lineObj.SipSession == null) return;

    var session = lineObj.SipSession;
    if (noConfirm == true) {
      // Called at the end of a call
      $("#line-" + lineObj.LineNumber + "-btn-start-recording").show();
      $("#line-" + lineObj.LineNumber + "-btn-stop-recording").hide();

      if (session.data.mediaRecorder) {
        if (session.data.mediaRecorder.state == "recording") {
          console.log("Stopping Call Recording");
          session.data.mediaRecorder.stop();
          session.data.recordings[session.data.recordings.length - 1].stopTime =
            utcDateNow();
          window.clearInterval(session.data.recordingRedrawInterval);

          $("#line-" + lineObj.LineNumber + "-msg").html(
            lang.call_recording_stopped
          );

          updateLineScroll(lineNum);
        } else {
          console.warn("Recorder is in an unknown state");
        }
      }
      return;
    } else {
      // User attempts to end call recording
      if (CallRecordingPolicy == "enabled") {
        console.warn("Policy Enabled: Call Recording");
        return;
      }

      Confirm(lang.confirm_stop_recording, lang.stop_recording, function () {
        StopRecording(lineNum, true);
      });
    }
  }
  function PlayAudioCallRecording(obj, cdrId, uID) {
    var container = $(obj).parent();
    container.empty();

    var audioObj = new Audio();
    audioObj.autoplay = false;
    audioObj.controls = true;

    // Make sure you are playing out via the correct device
    var sinkId = getAudioOutputID();
    if (typeof audioObj.sinkId !== "undefined") {
      audioObj
        .setSinkId(sinkId)
        .then(function () {
          console.log("sinkId applied: " + sinkId);
        })
        .catch(function (e) {
          console.warn("Error using setSinkId: ", e);
        });
    } else {
      console.warn("setSinkId() is not possible using this browser.");
    }

    container.append(audioObj);

    if (CallRecordingsIndexDb != null) {
      var transaction = CallRecordingsIndexDb.transaction(["Recordings"]);
      var objectStoreGet = transaction.objectStore("Recordings").get(uID);
      objectStoreGet.onerror = function (event) {
        console.error("IndexDB Get Error:", event);
      };
      objectStoreGet.onsuccess = function (event) {
        $("#cdr-media-meta-size-" + cdrId + "-" + uID).html(
          " Size: " + formatBytes(event.target.result.bytes)
        );
        $("#cdr-media-meta-codec-" + cdrId + "-" + uID).html(
          " Codec: " + event.target.result.type
        );

        // Play
        audioObj.src = window.URL.createObjectURL(
          event.target.result.mediaBlob
        );
        audioObj.oncanplaythrough = function () {
          audioObj
            .play()
            .then(function () {
              console.log("Playback started");
            })
            .catch(function (e) {
              console.error("Error playing back file: ", e);
            });
        };
      };
    } else {
      console.warn("CallRecordingsIndexDb is null.");
    }
  }
  function PlayVideoCallRecording(obj, cdrId, uID, buddy) {
    var container = $(obj).parent();
    container.empty();

    var videoObj = $("<video>").get(0);
    videoObj.id = "callrecording-video-" + cdrId;
    videoObj.autoplay = false;
    videoObj.controls = true;
    videoObj.playsinline = true;
    videoObj.ontimeupdate = function (event) {
      $("#cdr-video-meta-width-" + cdrId + "-" + uID).html(
        lang.width + " : " + event.target.videoWidth + "px"
      );
      $("#cdr-video-meta-height-" + cdrId + "-" + uID).html(
        lang.height + " : " + event.target.videoHeight + "px"
      );
    };

    var sinkId = getAudioOutputID();
    if (typeof videoObj.sinkId !== "undefined") {
      videoObj
        .setSinkId(sinkId)
        .then(function () {
          console.log("sinkId applied: " + sinkId);
        })
        .catch(function (e) {
          console.warn("Error using setSinkId: ", e);
        });
    } else {
      console.warn("setSinkId() is not possible using this browser.");
    }

    container.append(videoObj);

    if (CallRecordingsIndexDb != null) {
      var transaction = CallRecordingsIndexDb.transaction(["Recordings"]);
      var objectStoreGet = transaction.objectStore("Recordings").get(uID);
      objectStoreGet.onerror = function (event) {
        console.error("IndexDB Get Error:", event);
      };
      objectStoreGet.onsuccess = function (event) {
        $("#cdr-media-meta-size-" + cdrId + "-" + uID).html(
          " Size: " + formatBytes(event.target.result.bytes)
        );
        $("#cdr-media-meta-codec-" + cdrId + "-" + uID).html(
          " Codec: " + event.target.result.type
        );

        // Play
        videoObj.src = window.URL.createObjectURL(
          event.target.result.mediaBlob
        );
        videoObj.oncanplaythrough = function () {
          try {
            videoObj.scrollIntoViewIfNeeded(false);
          } catch (e) {}
          videoObj
            .play()
            .then(function () {
              console.log("Playback started");
            })
            .catch(function (e) {
              console.error("Error playing back file: ", e);
            });

          // Create a Post Image after a second
          if (buddy) {
            window.setTimeout(function () {
              var canvas = $("<canvas>").get(0);
              var videoWidth = videoObj.videoWidth;
              var videoHeight = videoObj.videoHeight;
              if (videoWidth > videoHeight) {
                // Landscape
                if (videoHeight > 225) {
                  var p = 225 / videoHeight;
                  videoHeight = 225;
                  videoWidth = videoWidth * p;
                }
              } else {
                // Portrait
                if (videoHeight > 225) {
                  var p = 225 / videoWidth;
                  videoWidth = 225;
                  videoHeight = videoHeight * p;
                }
              }
              canvas.width = videoWidth;
              canvas.height = videoHeight;
              canvas
                .getContext("2d")
                .drawImage(videoObj, 0, 0, videoWidth, videoHeight);
              canvas.toBlob(
                function (blob) {
                  var reader = new FileReader();
                  reader.readAsDataURL(blob);
                  reader.onloadend = function () {
                    var Poster = {
                      width: videoWidth,
                      height: videoHeight,
                      posterBase64: reader.result,
                    };
                    console.log("Capturing Video Poster...");

                    // Update DB
                    var currentStream = JSON.parse(
                      localDB.getItem(buddy + "-stream")
                    );
                    if (
                      currentStream != null ||
                      currentStream.DataCollection != null
                    ) {
                      $.each(currentStream.DataCollection, function (i, item) {
                        if (item.ItemType == "CDR" && item.CdrId == cdrId) {
                          // Found
                          if (item.Recordings && item.Recordings.length >= 1) {
                            $.each(item.Recordings, function (r, recording) {
                              if (recording.uID == uID)
                                recording.Poster = Poster;
                            });
                          }
                          return false;
                        }
                      });
                      localDB.setItem(
                        buddy + "-stream",
                        JSON.stringify(currentStream)
                      );
                      console.log("Capturing Video Poster, Done");
                    }
                  };
                },
                "image/jpeg",
                PosterJpegQuality
              );
            }, 1000);
          }
        };
      };
    } else {
      console.warn("CallRecordingsIndexDb is null.");
    }
  }
  // Device Detection
  // ================
  function DetectDevices() {
    navigator.mediaDevices
      .enumerateDevices()
      .then(function (deviceInfos) {
        // deviceInfos will not have a populated lable unless to accept the permission
        // during getUserMedia. This normally happens at startup/setup
        // so from then on these devices will be with lables.
        HasVideoDevice = false;
        HasAudioDevice = false;
        HasSpeakerDevice = false; // Safari and Firefox don't have these
        AudioinputDevices = [];
        VideoinputDevices = [];
        SpeakerDevices = [];
        for (var i = 0; i < deviceInfos.length; ++i) {
          if (deviceInfos[i].kind === "audioinput") {
            HasAudioDevice = true;
            AudioinputDevices.push(deviceInfos[i]);
          } else if (deviceInfos[i].kind === "audiooutput") {
            HasSpeakerDevice = true;
            SpeakerDevices.push(deviceInfos[i]);
          } else if (deviceInfos[i].kind === "videoinput") {
            if (EnableVideoCalling == true) {
              HasVideoDevice = true;
              VideoinputDevices.push(deviceInfos[i]);
            }
          }
        }
        // console.log(AudioinputDevices, VideoinputDevices);
      })
      .catch(function (e) {
        console.error("Error enumerating devices", e);
      });
  }
  DetectDevices();
  window.setInterval(function () {
    DetectDevices();
  }, 10000);

  //if (!loginShow && !UserAgent.isRegistered) CreateUserAgent();

  const handleLoginNew = (status) => {};

  const handleCall = () => {
    console.log("Calling user agent");
  };

  // connectAndRegister({
  //   username: username,
  //   password: password,
  // });

  //sessionManager.connect();

  if (!loginShow) {
    return (
      // <AcctHtml setLoginShow={setLoginShow}/>
      // Main Container
      <div style={mainContainer}>
        <Modal
          show={showConverse}
          onHide={handleClose}
          style={{ position: "absolute" }}
        >
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <input
                type="text"
                placeholder="Number"
                onChange={handleSetContact}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={deleteConverse}>
              Remove subscription
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <div style={container}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={profileInfoDiv}>
              <img
                style={ProfileImage}
                src={profileImg}
                alt="Profile image"
              />
            </div>

            <Button variant="primary" onClick={handleShow}>
              Configure account
            </Button>
          </div>

          <div //SearchBox
            style={SearchBox}
          >
            <div //SearchContainer
              style={SearchContainer}
            >
              <img
                style={SearchIcon}
                src={profileImg2} //SearchIcon
              />
              <input
                style={SearchInput}
                type="text"
                placeholder="Search or start new chat"
              />
            </div>
          </div>

          {buddies.map((userData, index) => (
            <div
              style={contactContactItem}
              key={index}
              onClick={(e) => {
                e.preventDefault();
                setSelectedBuddy(index);
                setConverseData(buddies[index].stream);
                console.log(userData.jid);
                //alert('You clicked me!'+index);
              }}
            >
              <img style={contactProfileIcon} src={profileImg3} alt="Profile icon" />
              <div style={contactContactInfo}>
                <span style={contactContactName}>
                  {userData.jid} {index}
                </span>
                <span style={contactMessageText}>10:04 PM</span>
              </div>
            </div>
          ))}
        </div>
        <div style={Conversation}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={conversProfileHeader}>
              <img style={conversProfileImage} src={profileImg4} alt="Profile Image" />
              Kelly Kinyama
            </div>
            <div style={conversProfileHeader}>
              <button
                onClick={(e) => {
                  AudioCall(selectedBuddy);
                  e.preventDefault();
                  //sessionManager.call(`sip:${callTo}@dev.zesco.co.zm`, {});
                }}
              >
                Call
              </button>
            </div>
            <div style={conversProfileHeader}>
              <button onClick={handleShowConverse}>Delete Subscription</button>
            </div>
          </div>
          <div style={conversMessageContainer}>
            {selectedBuddy >= 0 &&
            buddies[selectedBuddy] != null &&
            buddies[selectedBuddy].stream != null &&
            buddies[selectedBuddy].stream.DataCollection != null
              ? buddies[selectedBuddy].stream.DataCollection.map(
                  (message, index) => (
                    <div style={is_your(message.DstUserId)} key={index}>
                      <div style={conversMessage}>{message.MessageData}</div>
                    </div>
                  )
                )
              : ""}
          </div>
          <div style={conversChatBox}>
            <div style={SearchContainer}>
              <img style={conversEmojiImage} src={profileImg5} alt="Emoji" />
              <textarea
                style={SearchInput}
                type="text"
                placeholder="Type a message"
                onChange={(e) => {
                  setComposedMsg(e.target.value);
                  console.log(composedMsg);
                }}
              ></textarea>
              <button
                onClick={() => {
                  if (selectedBuddy != -1) {
                    XmppSendMessage(buddies[selectedBuddy], composedMsg, uID());
                  } else {
                    alert("Select buddy first");
                  }
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
        <CallCenter />
      </div>
    );
  } else
    return (
      // mainView()
      <AcctHtml
        lang={lang}
        getDbItem={getDbItem}
        setLoginShow={setLoginShow}
        reconnectXmpp={reconnectXmpp}
        loginShow={loginShow}
      />
    );
}

export default App;
