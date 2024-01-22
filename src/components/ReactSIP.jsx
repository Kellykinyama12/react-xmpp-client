import { SIPProvider,useSIPProvider } from "react-sipjs";


export function ReactSIP() {


    const CallCenter = () => {
        const [username, setUsername] = useState<string>("test8");
        const [password, setPassword] = useState<string>("test123");
        const {
          connectAndRegister,
          connectStatus,
        } = useSIPProvider();
        
        useEffect(() => {
          connectAndRegister({
            username: username,
            password: password,
          });
        }, []);
      
        //return ...;
      }
  return (
    <div className="p-5">
      <SIPProvider
        options={{
          domain: "voice.chatchilladev.sip.jambonz.cloud",
          webSocketServer: "wss://sip.jambonz.cloud:8443",
        }}
      >
        <div>
          <CallCenter />
        </div>
      </SIPProvider>
    </div>
  );
}