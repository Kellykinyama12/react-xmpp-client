import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
//import "./App.css";
import moment from "moment";
import * as SIP from "sip.js";

import { Strophe, $pres, $iq, $msg } from "strophe.js";

import { useState, useEffect } from "react";

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

let lang = {}

let profileUserID = getDbItem("profileUserID", "1000"); // Internal reference ID. (DON'T CHANGE THIS!)
let profileName = getDbItem("profileName", "1000"); // eg: Keyla James
let wssServer = getDbItem("wssServer", "127.0.0.1"); // eg: raspberrypi.local
let WebSocketPort = getDbItem("WebSocketPort", 8088); // eg: 444 | 4443
let ServerPath = getDbItem("ServerPath", ""); // eg: /ws
let SipDomain = getDbItem("SipDomain", "127.0.0.1"); // eg: raspberrypi.local
let SipUsername = getDbItem("SipUsername", "1000"); // eg: webrtc
let SipPassword = getDbItem("SipPassword", "1000"); // eg: webrtc

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
let VoicemailDid = getDbItem("VoicemailDid", ""); // Number to dial for VoicemialMain()
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
let XmppServer = getDbItem("XmppServer", ""); // FQDN of XMPP server HTTP service";
let XmppWebsocketPort = getDbItem("XmppWebsocketPort", ""); // OpenFire Default : 7443
let XmppWebsocketPath = getDbItem("XmppWebsocketPath", ""); // OpenFire Default : /ws
let XmppDomain = getDbItem("XmppDomain", ""); // The domain of the XMPP server
let profileUser = getDbItem("profileUser", null); // Username for auth with XMPP Server eg: 100
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
function AddMessageToStream(buddyObj, messageId, type, message, DateTime) {
  var currentStream = JSON.parse(
    // localDB.getItem(buddyObj.identity + "-stream")
    localDB.getItem(buddyObj.jid + "-stream")
  );
  if (currentStream == null) currentStream = InitialiseStream(buddyObj.jid);

  // Add New Message
  var newMessageJson = {
    ItemId: messageId,
    ItemType: type,
    ItemDate: DateTime,
    SrcUserId: buddyObj.jid,
    Src: '"' + buddyObj.jid + '"',
    DstUserId: jid,
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

function getMessagesFromStream(buddyObj) {
  var currentStream = JSON.parse(
    // localDB.getItem(buddyObj.identity + "-stream")
    localDB.getItem(buddyObj.jid + "-stream")
  );
  console.log("Messages: ", currentStream);
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

// Create User Agent
// =================
function CreateUserAgent() {
  console.log("Creating User Agent...");
  if (
    SipDomain == null ||
    SipDomain == "" ||
    SipDomain == "null" ||
    SipDomain == "undefined"
  )
    SipDomain = wssServer; // Sets globally
  var options = {
    logConfiguration: false, // If true, constructor logs the registerer configuration.
    uri: SIP.UserAgent.makeURI("sip:" + SipUsername + "@" + SipDomain),
    transportOptions: {
      server: "ws://" + wssServer + ":" + WebSocketPort + "" + ServerPath,
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
      onInvite: function (sip) {
        ReceiveCall(sip);
      },
      onMessage: function (sip) {
        ReceiveOutOfDialogMessage(sip);
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

let buddiesList = [];
let XMPP = null;
let jid = getDbItem("jid", null);
let password = getDbItem("password", null);

// IGLINTERNS5.zescocorp.zescoad.zesco.co.zm

//const strophe = Strophe;
let BOSH_SERVICE = "ws://IGLINTERNS5.zescocorp.zescoad.zesco.co.zm:7070/ws";

let XMPPStatus = "disconnected";

function App() {
  const [count, setCount] = useState(0);
  const [buddies, setBuddies] = useState(buddiesList);
  const [selectedBuddy, setSelectedBuddy] = useState(-1);
  const [composedMsg, setComposedMsg] = useState("");

  const [converseData, setConverseData] = useState([]);
  const [addDialogStatus, setAddDialogStatus] = useState(false);
  // const [XMPPStatus, setXMPPStatus] = useState("disconnected");

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
        buddiesList.push({
          jid: jid,
          displayName: displayName,
          stream: getMessagesFromStream({ jid: jid, displayName: displayName }),
        });
        //buddies.push({ jid: jid, displayName: displayName });
        //console.log("Updating buddies: ", buddiesList);
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
  function onMessage(message) {
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
    for (var x = 0; x < buddiesList.length; x++) {
      if (buddiesList[x].jid == from) {
        buddyObj = buddiesList[x];
        console.log("Selected buddy", buddiesList[x]);
        buddyIndex = x;
      }
    }

    console.log("Message from: ", buddyObj);

    // Messages
    //   if(originalMessage == ""){
    //     // Not a full message
    // }
    // else {
    if (messageId) {
      // Although XMPP does not require message ID's, this application does
      //XmppSendDeliveryReceipt(buddyObj, messageId);
      var originalMessage = message;
      var DateTime = utcDateNow();

      AddMessageToStream(buddyObj, messageId, "MSG", body, DateTime);

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

    // // Information Query
    // XMPP.addHandler(onPingRequest, "urn:xmpp:ping", "iq", "get");
    // XMPP.addHandler(onVersionRequest, "jabber:iq:version", "iq", "get");

    // Presence
    XMPP.addHandler(onPresenceChange, null, "presence", null);
    // Message
    XMPP.addHandler(onMessage, null, "message", null);

    // connection.addHandler(onMessage, null, 'message', null, null, null);
    // connection.addHandler(onSubscriptionRequest, null, 'presence', 'subscribe');
    // connection.addHandler(onPresence, null, 'presence');
    // //     setMyPresence("Available", "Available", "")
    XMPP.addHandler(onPingRequest, "urn:xmpp:ping", "iq", "get");
    XMPP.addHandler(onVersionRequest, "jabber:iq:version", "iq", "get");
    XMPP.connect(jid, password, onStatusChange);
    //console.log("New Connection is ", connection);
  };

  //var status = Strophe.Status.DISCONNECTED;
  if (XMPPStatus != "connected") {
    if (jid != null && password != null) reconnectXmpp();
  }

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
      AddMessageToStream(buddyObj, messageId, "MSG", message, DateTime);
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
    console.log(`${buddyJid} jid: ${jid}`);

    if (buddyJid == jid)
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

    setStrContact(strContact + "@IGLINTERNS5.zescocorp.zescoad.zesco.co.zm");
    XmppSendSubscriptionRequest({
      jid: strContact + "@IGLINTERNS5.zescocorp.zescoad.zesco.co.zm",
    });
  };
  const handleCancel = (e) => {
    //console.log(e);
    setShow(false);
  };

  const [strContact, setStrContact] = useState("");
  const handleShow = () => {
    setShow(true);
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
    setStrContact(strContact + e.key);
  };

  const [jabberID, setJabberID] = useState("");
  const [jabberPassword, setJabberPassword] = useState("");

  const [loginShow, setLoginShow] = useState(
    getDbItem("jid", null) == null ? true : false
  );
  const handleLogin = () => {
    jid = jabberID + "@IGLINTERNS5.zescocorp.zescoad.zesco.co.zm";
    password = jabberPassword;

    localDB.setItem("jid", jid);
    localDB.setItem("password", password);

    //function getDbItem(itemIndex, defaultValue)

    //CreateUserAgent();
    setJabberID("");
    setJabberPassword("");
    setLoginShow(false);
    console.log("Username: %s, password: %s", jid, password);
    //reconnectXmpp();
  };
  const handleRegistration = () => {
    console.log("Not implemented");
  };

  // useEffect(() => {
  //   //Runs on the first render
  //   //And any time any dependency value changes
  // }, [buddies, setBuddies]);

  // useEffect(() => {
  //   // Runs on the first render
  //   // And any time any dependency value changes
  //   //buddies=buddiesList;
  // },[buddies[selectedBuddy]]);

  const acctHtml = () => {
    <div>
      <div id="Configure_Extension_Html" style={{ display: "none" }}>
        <div className="UiText"> {lang.asterisk_server_address}:</div>
        <div>
          <input
            id="Configure_Account_wssServer"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_asterisk_server_address}
            value={getDbItem("wssServer", "")}
          />
        </div>

        <div className="UiText">{lang.websocket_port}:</div>
        <div>
          <input
            id="Configure_Account_WebSocketPort"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_websocket_port}
            value={getDbItem("WebSocketPort", "")}
          />
        </div>

        <div className="UiText">{lang.websocket_path}:</div>
        <div>
          <input
            id="Configure_Account_ServerPath"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_websocket_path}
            value={getDbItem("ServerPath", "")}
          />
        </div>

        <div className="UiText">{lang.full_name}:</div>
        <div>
          <input
            id="Configure_Account_profileName"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_full_name}
            value={getDbItem("profileName", "")}
          />
        </div>

        <div className="UiText">{lang.sip_domain}:</div>
        <div>
          <input
            id="Configure_Account_SipDomain"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_sip_domain}
            value={getDbItem("SipDomain", "")}
          />
        </div>

        <div className="UiText">{lang.sip_username}:</div>
        <div>
          <input
            id="Configure_Account_SipUsername"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_sip_username}
            value={getDbItem("SipUsername", "")}
          />
        </div>

        <div className="UiText">{lang.sip_password}":</div>
        <div>
          <input
            id="Configure_Account_SipPassword"
            className="UiInputText"
            type="password"
            placeholder={lang.eg_sip_password}
            value={getDbItem("SipPassword", "")}
          />
        </div>

        <div className="UiText">{lang.subscribe_voicemail}:</div>
        <div>
          <label for="Configure_Account_Voicemail_Subscribe">
            {lang.yes}
            <input type="checkbox" id="Configure_Account_Voicemail_Subscribe" />
          </label>
        </div>

        {/* <div id="Voicemail_Did_row" style=\"display:"+ ((VoiceMailSubscribe == true)? "unset" : "none") +"\"> */}
        <div className="UiText" style={{ marginLeft: "20px" }}>
          {lang.voicemail_did}:
        </div>
        <div style={{ marginLeft: "20px" }}>
          <input
            id="Configure_Account_Voicemail_Did"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_internal_subscribe_extension}
            value={getDbItem("VoicemailDid", "")}
          />
        </div>
      </div>

      <div className="UiText">{lang.chat_engine}:</div>

      <ul style={{ listStyleType: "none" }}>
        "
        <li>
          <label for="chat_type_sip">
            SIP
            <input type="radio" name="chatEngine" id="chat_type_sip" />
          </label>
        </li>
        <li>
          <label for="chat_type_xmpp">
            XMPP
            <input type="radio" name="chatEngine" id="chat_type_xmpp" />
          </label>
        </li>
      </ul>

      <div id="RowChatEngine_xmpp">
        <div className="UiText">{lang.xmpp_server_address}:</div>
        <div>
          <input
            id="Configure_Account_xmpp_address"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_xmpp_server_address}
            value={getDbItem("XmppServer", "")}
          />
        </div>

        <div className="UiText">XMPP {lang.websocket_port}:</div>
        <div>
          <input
            id="Configure_Account_xmpp_port"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_websocket_port}
            value={getDbItem("XmppWebsocketPort", "")}
          />
        </div>

        <div className="UiText">{lang.websocket_path}:</div>
        <div>
          <input
            id="Configure_Account_xmpp_path"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_websocket_path}
            value={getDbItem("XmppWebsocketPath", "")}
          />
        </div>

        <div className="UiText">XMPP {lang.sip_domain}:</div>
        <div>
          <input
            id="Configure_Account_xmpp_domain"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_sip_domain}
            value={getDbItem("XmppDomain", "")}
          />
        </div>

        <div className="UiText">{lang.extension_number}:</div>
        <div>
          <input
            id="Configure_Account_profileUser"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_internal_subscribe_extension}
            value={getDbItem("profileUser", "")}
          />
        </div>
      </div>
    </div>;
  };

  const loginShowFunc=()=>{
    <div>
        {/* <Modal
          show={loginShow}
          onHide={handleLogin}
          style={{ position: "absolute" }}
        > */}
        {/* <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title> */}
        {/* </Modal.Header>
          <Modal.Body> */}
        <div>
          <input
            type="text"
            placeholder="Username"
            onKeyPress={(e) => {
              setJabberID(jabberID + e.key);
            }}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Password"
            onKeyPress={(e) => {
              setJabberPassword(jabberPassword + e.key);
            }}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Domain"
            onKeyPress={(e) => {
              setJabberPassword(jabberPassword + e.key);
            }}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Websocket server"
            onKeyPress={(e) => {
              setJabberPassword(jabberPassword + e.key);
            }}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Websocket port"
            onKeyPress={(e) => {
              setJabberPassword(jabberPassword + e.key);
            }}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="SIP Username"
            onKeyPress={(e) => {
              setJabberPassword(jabberPassword + e.key);
            }}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="SIP Password"
            onKeyPress={(e) => {
              setJabberPassword(jabberPassword + e.key);
            }}
          />
        </div>
        {/* </Modal.Body>
          <Modal.Footer> */}
        <Button variant="primary" onClick={handleLogin}>
          Login
        </Button>
        <Button variant="secondary" onClick={handleRegistration}>
          Cancel
        </Button>
        {/* </Modal.Footer>
        </Modal> */}
      </div>
  }
  const mainView=()=>{
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
            onKeyPress={handleSetContact}
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
      <div style={{ display: "flex" }}>
        <div style={profileInfoDiv}>
          <img
            style={ProfileImage}
            src="/profile/profilephoto.jpeg"
            alt="Profile image"
          />
        </div>

        <Button variant="primary" onClick={handleShow}>
          Launch demo modal
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
            src={"/search-icon.svg"} //SearchIcon
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
          <img style={contactProfileIcon} src="" alt="Profile icon" />
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
          <img style={conversProfileImage} src="" alt="Profile Image" />
          Kelly Kinyama
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
                  <div style={conversMessage}>
                    {JSON.stringify(message.MessageData)}
                  </div>
                </div>
              )
            )
          : ""}
      </div>
      <div style={conversChatBox}>
        <div style={SearchContainer}>
          <img style={conversEmojiImage} src="" alt="Emoji" />
          <textarea
            style={SearchInput}
            type="text"
            placeholder="Type a message"
            onKeyPress={(e) => {
              setComposedMsg(composedMsg + e.key);
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
  </div>

  }

  if (loginShow) {
    return (
      loginShowFunc()
    );
  } else
    return (
      // mainView()
      acctHtml()
          );
}

export default App;
