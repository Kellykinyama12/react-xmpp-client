import { useState, useEffect } from "react";

export function AcctHtml({
  lang,
  getDbItem,
  loginShow,
  setLoginShow,
  reconnectXmpp,
}) {
  const [WssServer, setWssServer] = useState("");
  const [WssPort, setWssPort] = useState("");
  const [WssPath, setWssPath] = useState("");
  const [profileName, setprofileName] = useState("");
  const [SipDomain, setSipDomain] = useState("");
  const [SipUsername, setSipUsername] = useState("");
  const [SipPassword, setSipPassword] = useState("");
  const [VoicemailDid, setVoicemailDid] = useState("");
  const [chatEngine, setchatEngine] = useState("");
  const [XmppServer, setXmppServer] = useState("");
  const [XmppWsPort, setXmppWsPort] = useState("");
  const [XmppWsPath, setXmppWsPath] = useState("");
  const [XmppDomain, setXmppDomain] = useState("");
  const [profileUser, setprofileUser] = useState("");

  const handleLogin = () => {
    console.warn("Websocket server: ", getDbItem("wssServer", null));
    console.warn("Websocket port: ", getDbItem("WebSocketPort", null));
    console.warn("Websocket path: ", getDbItem("ServerPath", ""));
    console.warn("Sip username: ", getDbItem("SipUsername", null));
    console.warn("Sip password: ", getDbItem("SipPassword", null));
    console.warn("Sip domain: ", getDbItem("SipDomain", null));

    // if (XmppDomain == "" || XmppServer == "" || XmppWebsocketPort == "") {
    //   console.log(
    //     "Cannot connect to XMPP: ",
    //     XmppDomain,
    //     XmppServer,
    //     XmppWebsocketPort,
    //     XmppWebsocketPath
    //   );
    //   //setLoginShow(true);
    // } else 
    //reconnectXmpp();
  };

  const handleWssServerChange = (event) => {
    // 👇 Get input value from "event"

    localStorage.setItem("wssServer", event.target.value);
    setWssServer(event.target.value);
    console.log();
  };

  const handleWssPortChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("WebSocketPort", event.target.value);
    setWssPort(event.target.value);
  };
  const handleWssPathChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("ServerPath", event.target.value);
    setWssPath(event.target.value);
  };
  const handleprofileNameChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("profileName", event.target.value);
    setprofileName(event.target.value);
  };
  const handleSipDomainChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("SipDomain", event.target.value);
    setSipDomain(event.target.value);
  };
  const handleSipUsernameChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("SipUsername", event.target.value);
    setSipUsername(event.target.value);
  };
  const handleSipPasswordChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("SipPassword", event.target.value);
    setSipPassword(event.target.value);
  };
  const handleVoicemailDidChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("VoicemailDid", event.target.value);
    setVoicemailDid(event.target.value);
  };
  const handlechatEngineChange = (event) => {
    // 👇 Get input value from "event"
    //localStorage.setItem("wssServer", event.target.value)
    setchatEngine(event.target.value);
  };
  const handleXmppServerChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("XmppServer", event.target.value);
    setXmppServer(event.target.value);
  };
  const handleXmppWsPortChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("XmppWebsocketPort", event.target.value);
    setXmppWsPort(event.target.value);
  };
  const handleXmppWsPathChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("XmppWebsocketPath", event.target.value);
    setXmppWsPath(event.target.value);
  };
  const handleXmppDomainChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("XmppDomain", event.target.value);
    setXmppDomain(event.target.value);
  };
  const handleXprofileUserChange = (event) => {
    // 👇 Get input value from "event"
    localStorage.setItem("profileUser", event.target.value);
    setprofileUser(event.target.value);
  };
  return (
    <div>
      <div id="Configure_Extension_Html">
        <div className="UiText"> {lang.asterisk_server_address}:</div>
        <div>
          <input
            id="Configure_Account_wssServer"
            className="UiInputText"
            type="text"
            placeholder={lang.eg_asterisk_server_address}
            value={getDbItem("wssServer", "")}
            onChange={handleWssServerChange}
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
            onChange={handleWssPortChange}
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
            onChange={handleWssPathChange}
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
            onChange={handleprofileNameChange}
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
            onChange={handleSipDomainChange}
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
            onChange={handleSipUsernameChange}
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
            onChange={handleSipPasswordChange}
          />
        </div>

        <div className="UiText">{lang.subscribe_voicemail}:</div>
        <div>
          <label htmlFor="Configure_Account_Voicemail_Subscribe">
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
            onChange={handleVoicemailDidChange}
          />
        </div>
      </div>
      <div className="UiText">{lang.chat_engine}:</div>
      <ul style={{ listStyleType: "none" }}>
        "
        <li>
          <label htmlFor="chat_type_sip">
            SIP
            <input
              type="radio"
              name="chatEngine"
              id="chat_type_sip"
              onChange={handlechatEngineChange}
            />
          </label>
        </li>
        <li>
          <label htmlFor="chat_type_xmpp">
            XMPP
            <input
              type="radio"
              name="chatEngine"
              id="chat_type_xmpp"
              onChange={handlechatEngineChange}
            />
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
            onChange={handleXmppServerChange}
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
            onChange={handleXmppWsPortChange}
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
            onChange={handleXmppWsPathChange}
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
            onChange={handleXmppDomainChange}
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
            onChange={handleXprofileUserChange}
          />
        </div>
      </div>

      <button
        onClick={() => {
          setLoginShow(
            getDbItem("SipUsername", null) == null ||
              getDbItem("wssServer", null) == null ||
              getDbItem("WebSocketPort", null) == null  ||
              getDbItem("SipUsername", null) == null ||
              getDbItem("SipDomain", null) == null ||
              getDbItem("XmppWebsocketPort", null) == null ||
              getDbItem("XmppDomain", null) == null
              ? true
              : false
          );
          console.log("Set credentials properly")
          handleLogin();
        }}
      >
        Login
      </button>
    </div>
  );
}
