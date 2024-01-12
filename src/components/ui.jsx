function initUI() {
  return (
    // Left Section
    <div
      id="leftContent"
      style={{ float: "left", height: "100%", width: "320px" }}
    >
      <table
        id="leftContentTable"
        className="leftContentTable"
        style={{height:"100%", width:"100%"}}
        cellspacing="0"
        cellpadding="0"
      >
        <tr>
          <td
            className="streamSection"
            style={{height: "50px", boxSizing: "border-box"}}
          >
            {/* // Profile User */}
            <div className="profileContainer">
              {/* // Picture, Caller ID and settings Menu */}
              <div
                className="contact"
                id="UserProfile"
                style={{ cursor: "default", marginBottom: "5px" }}
              >
                {/* // Voicemail Count */}
                <span id="TxtVoiceMessages" className="voiceMessageNotifyer">
                  0
                </span>
                "<div id="UserProfilePic" className="buddyIcon"></div>
                {/* // Action Buttons */}
                <span className="settingsMenu">
                  <button className="roundButtons" id="BtnFreeDial">
                    <i className="fa fa-phone"></i>
                  </button>
                  <button className="roundButtons" id="BtnAddSomeone">
                    <i className="fa fa-user-plus"></i>
                  </button>
                  {/* if(false){ */}
                  {/* // TODO */}
                  <button id="BtnCreateGroup">
                    <i className="fa fa-users"></i>
                    <i className="fa fa-plus" style={{fontSize:"9px"}}></i>
                  </button>
                  {/* } */}
                  <button className="roundButtons" id="SettingsMenu">
                    <i className="fa fa-cogs"></i>
                  </button>
                </span>
                {/* // className=settingsMenu */}
                {/* // Display Name */}
                <div className="contactNameText" style={{marginRight: "0px"}}>
                  "{/* // Status */}
                  <span
                    id="dereglink"
                    className="dotOnline"
                    style={{display:"none"}}
                  ></span>
                  <span
                    id="WebRtcFailed"
                    className="dotFailed"
                    style={{display:"none"}}
                  ></span>
                  <span id="reglink" className="dotOffline"></span>
                  {/* // User */}
                  <span id="UserCallID"></span>"
                </div>
                {/* // className=contactNameText */}
                <div className="presenceText">
                  <span id="regStatus">&nbsp;</span>{" "}
                  <span id="dndStatus"></span>
                </div>
              </div>
              {/* //id=UserProfile */}
            </div>
            {/* //  className=profileContainer */}
          </td>
        </tr>
        <tr id="searchArea">
          <td
            className="streamSection"
            style={{height: "35px", boxSizing: borderBox, paddingTop: "3px", paddingBottom: "0px"}}
          >
            {/* // Search */}
            <span id="divFindBuddy" className="searchClean">
              <input
                id="txtFindBuddy"
                type="text"
                autocomplete="none"
                style={{ width: "calc(100% - 78px)" }}
              />
            </span>
            <button
              className="roundButtons"
              id="BtnFilter"
              style={{marginLeft:"5px"}}
            >
              <i className="fa fa-sliders"></i>
            </button>
            "
          </td>
        </tr>
        <tr>
          <td className="streamSection">
            {/* // Lines & Buddies */}
            <div id="myContacts" className="contactArea cleanScroller"></div>"
            <div
              id="actionArea"
              style={{display:"none"}}
              className="contactArea cleanScroller"
            ></div>
            "
          </td>
        </tr>
      </table>
    </div>
  );
}

function SetStatusWindow() {
  return (
    <div className="UiWindowField">
      <div>
        <input
          type="text"
          id="presence_text"
          className="UiInputText"
          maxlength="128"
        />
      </div>
    </div>
  );
}

function EditBuddyWindow() {
  return (
    <div border="0" className="UiWindowField">
      <div id="ImageCanvas" style={{ width: "150px", height: "150px" }}></div>
      <div style={{ float: "left", marginLeft: "200px" }}>
        <input id="fileUploader" type="file" />
      </div>
      <div style={{ marginTop: "50px" }}></div>

      <div className="UiText">"+ lang.full_name +":</div>
      <div>
        <input
          id="AddSomeone_Name"
          className="UiInputText"
          type="text"
          placeholder='"+ lang.eg_full_name +"'
          value='"+ ((buddyJson.DisplayName && buddyJson.DisplayName != "null" && buddyJson.DisplayName != "undefined")? buddyJson.DisplayName : "") +"'
        />
      </div>
      <div>
        <label for="AddSomeone_Dnd">
          Allow calls while on Do Not Disturb
          <input type="checkbox" id="AddSomeone_Dnd" />
        </label>
      </div>

      <div className="UiText">"+ lang.title_description +":</div>
      <div>
        <input
          id="AddSomeone_Desc"
          className="UiInputText"
          type="text"
          placeholder='"+ lang.eg_general_manager +"'
          value='"+ ((buddyJson.Description && buddyJson.Description != "null" && buddyJson.Description != "undefined")? buddyJson.Description : "") +"'
        />
      </div>

      {/* if(buddyJson.Type == "extension" || buddyJson.Type == "xmpp"){ */}
      <div className="UiText">"+ lang.extension_number +": </div>
      <div>
        <input
          id="AddSomeone_Exten"
          className="UiInputText"
          type="text"
          value="+ buddyJson.ExtensionNumber +"
        />
      </div>
      <div>
        <label for="AddSomeone_Subscribe">
          Subscribe to Device State Notifications
          <input type="checkbox" />
        </label>
      </div>
      <div id="RowSubscribe">
        <div className="UiText" style={{marginLeft:"30px"}}>
          "+ lang.internal_subscribe_extension +":
        </div>
        <div style={{ marginLeft: "30px" }}>
          <input
            id="AddSomeone_SubscribeUser"
            className="UiInputText"
            type="text"
            placeholder='"+ lang.eg_internal_subscribe_extension +"'
            value='"+ ((buddyJson.SubscribeUser && buddyJson.SubscribeUser != "null" && buddyJson.SubscribeUser != "undefined")? buddyJson.SubscribeUser : "") +"'
          />
        </div>
      </div>
      {/* }
    else { */}
      <input
        type="checkbox"
        id="AddSomeone_Subscribe"
        style={{ display: "none" }}
      />
      {/* } */}
      <div className="UiText">"+ lang.mobile_number +":</div>
      <div>
        <input
          id="AddSomeone_Mobile"
          className="UiInputText"
          type="text"
          placeholder='"+ lang.eg_mobile_number +"'
          value='"+ ((buddyJson.MobileNumber && buddyJson.MobileNumber != "null" && buddyJson.MobileNumber != "undefined")? buddyJson.MobileNumber : "") +"'
        />
      </div>

      <div className="UiText">"+ lang.email +":</div>
      <div>
        <input
          id="AddSomeone_Email"
          className="UiInputText"
          type="text"
          placeholder='"+ lang.eg_email +"'
          value='"+ ((buddyJson.Email && buddyJson.Email != "null" && buddyJson.Email != "undefined")? buddyJson.Email : "") +"'
        />
      </div>

      <div className="UiText">"+ lang.contact_number_1 +":</div>
      <div>
        <input
          id="AddSomeone_Num1"
          className="UiInputText"
          type="text"
          placeholder='"+ lang.eg_contact_number_1 +"'
          value='"+((buddyJson.ContactNumber1 && buddyJson.ContactNumber1 != "null" && buddyJson.ContactNumber1 != "undefined")? buddyJson.ContactNumber1 : "") +"'
        />
      </div>

      <div className="UiText">"+ lang.contact_number_2 +":</div>
      <div>
        <input
          id="AddSomeone_Num2"
          className="UiInputText"
          type="text"
          placeholder='"+ lang.eg_contact_number_2 +"'
          value='"+ ((buddyJson.ContactNumber2 && buddyJson.ContactNumber2 != "null" && buddyJson.ContactNumber2 != "undefined")? buddyJson.ContactNumber2 : "") +"'
        />
      </div>

      <div className="UiText">Auto Delete:</div>
      <div>
        <label for="AddSomeone_AutoDelete">
          "+ lang.yes +"
          <input type="checkbox" />
        </label>
      </div>

      {/* // TODO, add option to delete data, etc, etc */}
      <div className="UiText">
        <button onclick="" className="UiDeleteButton">
          <i className="fa fa-trash"></i> "+ lang.delete_buddy +"
        </button>
      </div>
    </div>
  );
}

function AddSomeoneWindow() {
  return (
    <div>
      <div style={{textAlign:right}}>
        <button className="roundButtons" onclick="ShowContacts()">
          <i className="fa fa-close"></i>
        </button>
      </div>

      <div border="0" className="UiSideField">
        <div className="UiText">"+ lang.full_name +":</div>
        <div>
          <input
            id="AddSomeone_Name"
            className="UiInputText"
            type="text"
            placeholder='"+ lang.eg_full_name +"'
          />
        </div>
        <div>
          <label for="AddSomeone_Dnd">
            "+ lang.allow_calls_on_dnd +"
            <input type="checkbox" id="AddSomeone_Dnd" />
          </label>
        </div>
        {/* // Type */}
        <ul style={{listStyleType:"none"}}>
          <li>
            <label for="type_exten">
              "+ lang.basic_extension +"
              <input type="radio" name="buddyType" id="type_exten" checked />
            </label>
          </li>
          {/* if(ChatEngine == "XMPP"){ */}
          <li>
            <label for="type_xmpp">
              "+ lang.extension_including_xmpp +"
              <input type="radio" name="buddyType" id="type_xmpp"></input>
            </label>
          </li>
          {/* // } */}
          <li>
            <label for="type_contact">
              "+ lang.addressbook_contact +"
              <input type="radio" name="buddyType" id="type_contact"></input>
            </label>
          </li>
        </ul>
        <div id="RowDescription">
          <div className="UiText">"+ lang.title_description +":</div>
          <div>
            <input
              id="AddSomeone_Desc"
              className="UiInputText"
              type="text"
              placeholder='"+ lang.eg_general_manager +"'
            />
          </div>
        </div>
        <div id="RowExtension">
          <div className="UiText">"+ lang.extension_number +":</div>
          <div>
            <input
              id="AddSomeone_Exten"
              className="UiInputText"
              type="text"
              placeholder='"+ lang.eg_internal_subscribe_extension +"'
            />
          </div>
          <div>
            <label for="AddSomeone_Subscribe">
              "+ lang.subscribe_to_dev_state +"
              <input type="checkbox" id="AddSomeone_Subscribe" />
            </label>
          </div>
          <div id="RowSubscribe" style={{display:"none", marginLeft:"30px"}}>
            <div className="UiText">
              "+ lang.internal_subscribe_extension +":
            </div>
            <div>
              <input
                id="AddSomeone_SubscribeUser"
                className="UiInputText"
                type="text"
                placeholder='"+ lang.eg_internal_subscribe_extension +"'
              />
            </div>
          </div>
        </div>
        <div id="RowMobileNumber">
          <div className="UiText">"+ lang.mobile_number +":</div>
          <div>
            <input
              id="AddSomeone_Mobile"
              className="UiInputText"
              type="tel"
              placeholder='"+ lang.eg_mobile_number +"'
            />
          </div>
        </div>
        <div id="RowEmail">
          <div className="UiText">"+ lang.email +":</div>
          <div>
            <input
              id="AddSomeone_Email"
              className="UiInputText"
              type="email"
              placeholder='"+ lang.eg_email +"'
            />
          </div>
        </div>
        <div id="RowContact1">
          <div className="UiText">"+ lang.contact_number_1 +":</div>
          <div>
            <input
              id="AddSomeone_Num1"
              className="UiInputText"
              type="text"
              placeholder='"+ lang.eg_contact_number_1 +"'
            />
          </div>
        </div>
        <div id="RowContact2">
          <div className="UiText">"+ lang.contact_number_2 +":</div>
          <div>
            <input
              id="AddSomeone_Num2"
              className="UiInputText"
              type="text"
              placeholder='"+ lang.eg_contact_number_2 +"'
            />
          </div>
        </div>
        <div id="Persistance">
          <div className="UiText">Auto Delete:</div>
          <div>
            <label for="AddSomeone_AutoDelete">
              "+ lang.yes +"
              <input type="checkbox" id="AddSomeone_AutoDelete" />
            </label>
          </div>
        </div>
      </div>
      <div className="UiWindowButtonBar" id="ButtonBar"></div>
    </div>
  );
}

function main() {
  return <div></div>;
}
