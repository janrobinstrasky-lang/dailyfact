import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, orderBy, query, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

// ── Categories & Fact Database ─────────────────────────────────────────────
const CATEGORIES = ["Wissenschaft","Geschichte","Natur","Technologie","Kultur","Geografie"];

const FACT_DB = {
  Wissenschaft: ["Das menschliche Gehirn verbraucht etwa 20% der gesamten Körperenergie.","Licht braucht ca. 8 Minuten von der Sonne zur Erde.","Ein Teelöffel Neutronensternmaterie würde eine Milliarde Tonnen wiegen.","DNA-Stränge aus einer einzigen menschlichen Zelle wären 2 Meter lang, wenn man sie streckt.","Es gibt mehr Sterne im Universum als Sandkörner auf der Erde.","Das menschliche Auge kann über 10 Millionen Farben unterscheiden.","Wasser kann gleichzeitig kochen und gefrieren – beim Tripelpunkt.","Ein Blitz ist fünfmal heisser als die Oberfläche der Sonne.","Die Erde dreht sich langsamer – der Tag wird alle 100 Jahre um 1,4 Millisekunden länger.","Quanten können sich an zwei Orten gleichzeitig befinden."],
  Geschichte: ["Die Pyramiden von Gizeh sind älter als die Erfindung des Rades.","Cleopatra lebte zeitlich näher an der Mondlandung als an den Pyramiden.","Die Wikinger hatten Katzen auf ihren Schiffen gegen Mäuse.","Napoleon war mit 1,70m für seine Zeit durchschnittlich gross – nicht klein.","Oxford University ist älter als die Azteken.","Der erste Weltkrieg begann durch die Ermordung eines Erzherzogs in Sarajevo 1914.","Die Berliner Mauer stand nur 28 Jahre.","Hannibal überquerte die Alpen mit 37 Kriegselefanten.","Die erste Olympiade fand 776 v. Chr. statt.","Julius Caesar wurde an den Iden des März (15. März) 44 v. Chr. ermordet."],
  Natur: ["Honig wird nie schlecht – 3000 Jahre alter Honig aus Ägypten war noch essbar.","Schmetterlinge schmecken mit ihren Füssen.","Ein Oktopus hat drei Herzen und blaues Blut.","Bäume kommunizieren über unterirdische Pilznetzwerke.","Ein Regenwurm hat fünf Herzen.","Quallen bestehen zu 95% aus Wasser.","Eichhörnchen vergessen bis zu 74% ihrer versteckten Nüsse.","Ein Hai muss sich ständig bewegen, sonst ertrinkt er.","Flamingos sind nicht von Natur aus rosa – sie färben sich durch ihre Nahrung.","Die Mimosa-Pflanze kann sich an Erfahrungen erinnern."],
  Technologie: ["Das erste Computerprogramm wurde 1843 von Ada Lovelace geschrieben.","Die erste E-Mail wurde 1971 von Ray Tomlinson an sich selbst geschickt.","Das Internet wurde ursprünglich für militärische Kommunikation entwickelt.","Der erste Smartphone-Prototyp wurde 1994 von IBM entwickelt.","Bitcoin wurde 2009 von der anonymen Person/Gruppe Satoshi Nakamoto erfunden.","1 GB Speicher kostete 1980 ca. 400'000 Dollar.","Der erste Computer wog über 27 Tonnen.","Google verarbeitet täglich über 8,5 Milliarden Suchanfragen.","Das erste Videospiel war 'Tennis for Two' aus dem Jahr 1958.","Ein modernes Smartphone hat mehr Rechenleistung als die NASA 1969."],
  Kultur: ["Shakespeare erfand über 1700 Wörter, die heute noch im Englischen verwendet werden.","Die Mona Lisa hat keine Augenbrauen – es war damals Mode, sie zu rasieren.","Beethoven war fast vollständig taub, als er seine neunte Sinfonie komponierte.","Die meistgespielte Melodie der Welt ist 'Happy Birthday to You'.","Van Gogh verkaufte zu Lebzeiten nur ein einziges Gemälde.","Die Ilias und die Odyssee wurden jahrhundertelang mündlich überliefert.","Mozart komponierte seine erste Sinfonie mit 8 Jahren.","Der Buchdruck mit beweglichen Lettern wurde 1440 von Gutenberg erfunden.","Der Louvre ist das meistbesuchte Museum der Welt.","Die Sixtinische Kapelle wurde 4 Jahre lang von Michelangelo bemalt."],
  Geografie: ["Russland ist so gross, dass es 11 Zeitzonen umspannt.","Australien ist breiter als der Mond.","Die Sahara ist nicht die grösste Wüste – die Antarktis ist es.","Der Nil war lange Zeit als längster Fluss bekannt, heute gilt der Amazonas als länger.","Kanada hat mehr Seen als alle anderen Länder zusammen.","Die höchste Erhebung auf dem Mars ist fast dreimal so hoch wie der Everest.","Norwegen hat eine 25'000 km lange Küstenlinie.","Island hat fast keine Mücken.","Der Pazifik ist grösser als alle Kontinente zusammen.","Die Schweiz hat 4 Amtssprachen: Deutsch, Französisch, Italienisch und Rätoromanisch."],
};

function getRandomFact(category, exclude = "") {
  const facts = FACT_DB[category] || FACT_DB.Wissenschaft;
  const filtered = facts.filter(f => f !== exclude);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// ── Character System ───────────────────────────────────────────────────────
const CHAR_SKINS = [
  {id:"fox",label:"Fuchs",body:"#E8834A",belly:"#F5C18A",ear:"#E8834A",earInner:"#F5A07A"},
  {id:"cat",label:"Katze",body:"#8B7BB5",belly:"#C4B8E8",ear:"#8B7BB5",earInner:"#C4A0C0"},
  {id:"bear",label:"Bär",body:"#8B6348",belly:"#C4956A",ear:"#8B6348",earInner:"#D4A882"},
  {id:"frog",label:"Frosch",body:"#5BAD6F",belly:"#A8E0B0",ear:"#5BAD6F",earInner:"#5BAD6F"},
  {id:"panda",label:"Panda",body:"#DEDEDE",belly:"#F5F5F5",ear:"#2C2C2A",earInner:"#2C2C2A"},
  {id:"bunny",label:"Hase",body:"#F0D0D8",belly:"#FFF0F4",ear:"#F0D0D8",earInner:"#F4A0B0"},
];
const ACCESSORIES = {
  hat:[{id:"none",label:"Kein"},{id:"crown",label:"Krone"},{id:"cap",label:"Mütze"},{id:"top",label:"Zylinder"},{id:"star",label:"Stern"}],
  glasses:[{id:"none",label:"Keine"},{id:"round",label:"Rund"},{id:"cool",label:"Cool"},{id:"heart",label:"Herz"},{id:"nerd",label:"Nerd"}],
  extra:[{id:"none",label:"Kein"},{id:"cape",label:"Umhang"},{id:"bow",label:"Schleife"},{id:"scarf",label:"Schal"},{id:"wings",label:"Flügel"},{id:"halo",label:"Heiligenschein"},{id:"lightning",label:"Blitz"},{id:"flowers",label:"Blumen"},{id:"mask",label:"Maske"},{id:"tail",label:"Schwanz"}],
};
const MOODS = [
  {score:8,border:"#639922",bg:"#EAF3DE",label:"Super fleissig!",anim:"bounce"},
  {score:5,border:"#534AB7",bg:"#EEEDFE",label:"Auf Kurs",anim:"sway"},
  {score:2,border:"#BA7517",bg:"#FAEEDA",label:"Könnte mehr",anim:"idle"},
  {score:0,border:"#E24B4A",bg:"#FCEBEB",label:"Vermisst dich!",anim:"sad"},
];
function getMood(score){return MOODS.find(m=>score>=m.score)||MOODS[3];}
const DEFAULT_CHAR={skin:"fox",hat:"none",glasses:"none",extra:"none"};

function CharSVG({skin,acc,mood,size=60,animate=true}){
  const s=CHAR_SKINS.find(c=>c.id===skin)||CHAR_SKINS[0];
  const m=getMood(mood);
  const [frame,setFrame]=useState(0);
  const [blink,setBlink]=useState(false);
  const [bounce,setBounce]=useState(0);
  useEffect(()=>{if(!animate)return;const t=setInterval(()=>setFrame(f=>(f+1)%60),80);const b=setInterval(()=>{setBlink(true);setTimeout(()=>setBlink(false),150);},3000+Math.random()*2000);return()=>{clearInterval(t);clearInterval(b);};},[animate]);
  useEffect(()=>{if(!animate)return;const i=setInterval(()=>{if(m.anim==="bounce")setBounce(Math.sin(Date.now()/300)*3);else if(m.anim==="sway")setBounce(Math.sin(Date.now()/600)*1.5);else if(m.anim==="sad")setBounce(Math.sin(Date.now()/1200)*0.8);else setBounce(Math.sin(Date.now()/800)*1);},30);return()=>clearInterval(i);},[animate,m.anim]);
  const ty=bounce;
  const mouth=mood>=8?`M28 52 Q40 62 52 52`:mood>=5?`M32 52 Q40 58 48 52`:mood>=2?`M32 53 Q40 53 48 53`:`M30 56 Q40 50 50 56`;
  const eyeH=blink?1:(mood>=5?5:4);
  const eyeY=mood>=8?41:43;
  return(
    <svg width={size} height={size+10} viewBox="0 0 80 90" style={{overflow:"visible",display:"block"}}>
      <g transform={`translate(0,${ty})`}>
        <ellipse cx="40" cy="85" rx="18" ry="4" fill="rgba(0,0,0,0.08)"/>
        {skin==="bunny"?<><ellipse cx="26" cy="18" rx="7" ry="14" fill={s.ear}/><ellipse cx="54" cy="18" rx="7" ry="14" fill={s.ear}/><ellipse cx="26" cy="18" rx="4" ry="11" fill={s.earInner}/><ellipse cx="54" cy="18" rx="4" ry="11" fill={s.earInner}/></>:<><path d="M22 28 L18 12 L32 22 Z" fill={s.ear}/><path d="M58 28 L62 12 L48 22 Z" fill={s.ear}/><path d="M23 26 L20 15 L30 23 Z" fill={s.earInner}/><path d="M57 26 L60 15 L50 23 Z" fill={s.earInner}/></>}
        <ellipse cx="40" cy="72" rx="16" ry="12" fill={s.body}/><ellipse cx="40" cy="73" rx="10" ry="8" fill={s.belly}/>
        <circle cx="40" cy="40" r="22" fill={s.body}/><ellipse cx="40" cy="46" rx="14" ry="10" fill={s.belly}/>
        {skin==="panda"&&<><ellipse cx="29" cy="40" rx="7" ry="6" fill="#2C2C2A"/><ellipse cx="51" cy="40" rx="7" ry="6" fill="#2C2C2A"/></>}
        {mood>=8?<><path d={`M27 ${eyeY-2} Q30 ${eyeY-6} 33 ${eyeY-2}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d={`M47 ${eyeY-2} Q50 ${eyeY-6} 53 ${eyeY-2}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="30" cy={eyeY} rx="4" ry={eyeH} fill={skin==="panda"?"#fff":"#2C2C2A"}/><ellipse cx="50" cy={eyeY} rx="4" ry={eyeH} fill={skin==="panda"?"#fff":"#2C2C2A"}/>{!blink&&<><circle cx="31.5" cy={eyeY-1} r="1.5" fill="white"/><circle cx="51.5" cy={eyeY-1} r="1.5" fill="white"/></>}{mood<=2&&<><path d={`M26 ${eyeY-6} L28 ${eyeY-4}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="1.5" strokeLinecap="round"/><path d={`M34 ${eyeY-6} L32 ${eyeY-4}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="1.5" strokeLinecap="round"/><path d={`M46 ${eyeY-6} L48 ${eyeY-4}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="1.5" strokeLinecap="round"/><path d={`M54 ${eyeY-6} L52 ${eyeY-4}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="1.5" strokeLinecap="round"/></>}</>}
        <ellipse cx="40" cy="48" rx="3" ry="2" fill={skin==="frog"?"#3B7A4A":"#5C4033"}/>
        <path d={mouth} stroke="#5C4033" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {acc?.extra==="cape"&&<><path d="M24 68 Q20 82 28 84 Q40 88 52 84 Q60 82 56 68" fill="#E24B4A" opacity="0.9"/><path d="M24 68 Q32 76 40 72 Q48 76 56 68" fill="#A32D2D"/></>}
        {acc?.extra==="bow"&&<><path d="M32 25 Q28 20 24 24 Q28 28 32 25Z" fill="#D4537E"/><path d="M32 25 Q36 20 40 24 Q36 28 32 25Z" fill="#D4537E"/><circle cx="32" cy="25" r="3" fill="#F4C0D1"/></>}
        {acc?.extra==="scarf"&&<><path d="M18 60 Q40 56 62 60 Q60 66 54 65 Q40 62 26 65 Q20 66 18 60Z" fill="#EF9F27"/><rect x="52" y="62" width="10" height="14" rx="3" fill="#EF9F27"/></>}
        {acc?.extra==="wings"&&<><path d="M18 55 Q4 44 8 58 Q12 68 22 64Z" fill="#B5D4F4" opacity="0.85"/><path d="M62 55 Q76 44 72 58 Q68 68 58 64Z" fill="#B5D4F4" opacity="0.85"/></>}
        {acc?.extra==="halo"&&<ellipse cx="40" cy="14" rx="14" ry="4" fill="none" stroke="#EF9F27" strokeWidth="2.5" opacity="0.9"/>}
        {acc?.extra==="lightning"&&<path d="M14 36 L18 44 L15 44 L19 54" stroke="#EF9F27" strokeWidth="2" fill="none" strokeLinecap="round"/>}
        {acc?.extra==="flowers"&&[{cx:16,cy:36},{cx:64,cy:36},{cx:12,cy:52}].map((p,i)=><g key={i}>{[0,60,120,180,240,300].map(a=><ellipse key={a} cx={p.cx+Math.cos(a*Math.PI/180)*4} cy={p.cy+Math.sin(a*Math.PI/180)*4} rx="2.5" ry="2" fill={["#F4C0D1","#97C459","#FAC775"][i]}/>)}<circle cx={p.cx} cy={p.cy} r="2.5" fill="#EF9F27"/></g>)}
        {acc?.extra==="mask"&&<><path d="M22 36 Q40 32 58 36 Q60 44 52 48 Q40 52 28 48 Q20 44 22 36Z" fill="#534AB7" opacity="0.85"/>{[28,40,52].map(x=><circle key={x} cx={x} cy="44" r="2" fill="#CECBF6" opacity="0.7"/>)}</>}
        {acc?.extra==="tail"&&<path d={`M56 74 Q72 ${68+Math.sin(frame/8)*6} 74 ${80+Math.sin(frame/6)*4} Q70 ${90+Math.cos(frame/7)*4} 60 82`} fill="none" stroke={s.body} strokeWidth="7" strokeLinecap="round"/>}
        {acc?.glasses==="round"&&<><circle cx="30" cy="43" r="7" fill="none" stroke="#3C3489" strokeWidth="1.5"/><circle cx="50" cy="43" r="7" fill="none" stroke="#3C3489" strokeWidth="1.5"/><line x1="37" y1="43" x2="43" y2="43" stroke="#3C3489" strokeWidth="1.5"/><line x1="23" y1="43" x2="18" y2="41" stroke="#3C3489" strokeWidth="1.5"/><line x1="57" y1="43" x2="62" y2="41" stroke="#3C3489" strokeWidth="1.5"/></>}
        {acc?.glasses==="cool"&&<><rect x="21" y="39" width="16" height="8" rx="3" fill="rgba(30,20,80,0.7)"/><rect x="43" y="39" width="16" height="8" rx="3" fill="rgba(30,20,80,0.7)"/><line x1="37" y1="43" x2="43" y2="43" stroke="#2C2C2A" strokeWidth="1.5"/></>}
        {acc?.glasses==="heart"&&<><path d="M23 43 Q26 38 30 43 Q34 38 37 43" fill="rgba(212,83,126,0.3)" stroke="#D4537E" strokeWidth="1.5"/><path d="M43 43 Q46 38 50 43 Q54 38 57 43" fill="rgba(212,83,126,0.3)" stroke="#D4537E" strokeWidth="1.5"/><line x1="37" y1="43" x2="43" y2="43" stroke="#D4537E" strokeWidth="1.5"/></>}
        {acc?.glasses==="nerd"&&<><rect x="22" y="38" width="15" height="10" rx="2" fill="none" stroke="#633806" strokeWidth="2"/><rect x="43" y="38" width="15" height="10" rx="2" fill="none" stroke="#633806" strokeWidth="2"/><line x1="37" y1="43" x2="43" y2="43" stroke="#633806" strokeWidth="2"/><line x1="22" y1="43" x2="17" y2="41" stroke="#633806" strokeWidth="2"/><line x1="58" y1="43" x2="63" y2="41" stroke="#633806" strokeWidth="2"/></>}
        {acc?.hat==="crown"&&<><path d="M20 28 L24 18 L30 24 L40 16 L50 24 L56 18 L60 28 Z" fill="#EF9F27" stroke="#BA7517" strokeWidth="1"/><rect x="19" y="27" width="42" height="5" rx="2" fill="#EF9F27" stroke="#BA7517" strokeWidth="1"/><circle cx="30" cy="21" r="2" fill="#E24B4A"/><circle cx="40" cy="17" r="2" fill="#7F77DD"/><circle cx="50" cy="21" r="2" fill="#5BAD6F"/></>}
        {acc?.hat==="cap"&&<><rect x="22" y="20" width="36" height="14" rx="7" fill="#534AB7"/><rect x="14" y="30" width="52" height="5" rx="2.5" fill="#3C3489"/><circle cx="40" cy="21" r="2.5" fill="#AFA9EC"/></>}
        {acc?.hat==="top"&&<><rect x="28" y="10" width="24" height="20" rx="2" fill="#2C2C2A"/><rect x="22" y="28" width="36" height="4" rx="2" fill="#2C2C2A"/></>}
        {acc?.hat==="star"&&<text x="32" y="22" fontSize="18" textAnchor="middle">⭐</text>}
        {mood>=8&&frame%20<10&&<><circle cx={30+Math.sin(frame)*5} cy={20-frame%10*2} r="2" fill="#EF9F27" opacity={1-frame%10*0.1}/><circle cx={50+Math.cos(frame)*5} cy={18-frame%8*2} r="1.5" fill="#7F77DD" opacity={1-frame%8*0.12}/></>}
        {mood<=1&&frame%40<20&&<text x={55+frame%20*0.3} y={30-frame%20*0.5} fontSize="10" fill="#7F77DD" opacity={1-frame%20*0.05} fontWeight="500">z</text>}
        <ellipse cx="20" cy="68" rx="7" ry="5" fill={s.body} transform={`rotate(${mood>=8?-20+Math.sin(frame/5)*15:-10},20,68)`}/>
        <ellipse cx="60" cy="68" rx="7" ry="5" fill={s.body} transform={`rotate(${mood>=8?20-Math.sin(frame/5)*15:10},60,68)`}/>
      </g>
    </svg>
  );
}

function MiniAvatar({char,score,size=32}){
  const m=getMood(score);
  return <div style={{background:m.bg,border:`2px solid ${m.border}`,borderRadius:"50%",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}><CharSVG skin={char.skin} acc={char} mood={score} size={size*0.95} animate={true}/></div>;
}

function CharBuilder({char,onChange}){
  const [layer,setLayer]=useState("skin");
  const tabs=[{id:"skin",label:"Charakter"},{id:"hat",label:"Hut"},{id:"glasses",label:"Brille"},{id:"extra",label:"Extra"}];
  const ts=t=>({padding:"6px 10px",border:"none",background:layer===t?"#533AB7":"#f0f0f0",color:layer===t?"#fff":"#555",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:500,whiteSpace:"nowrap"});
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"center",gap:12,padding:"8px 0"}}>
        {[8,5,2,0].map(sc=>{const mo=getMood(sc);return(<div key={sc} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{background:mo.bg,borderRadius:"50%",padding:4,border:`2px solid ${mo.border}`}}><CharSVG skin={char.skin} acc={char} mood={sc} size={40} animate={true}/></div><span style={{fontSize:10,color:"#888"}}>{mo.label}</span></div>);})}
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>{tabs.map(t=><button key={t.id} style={ts(t.id)} onClick={()=>setLayer(t.id)}>{t.label}</button>)}</div>
      {layer==="skin"&&<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{CHAR_SKINS.map(sk=><button key={sk.id} onClick={()=>onChange({...char,skin:sk.id})} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px",background:char.skin===sk.id?"#EEEDFE":"#f5f5f5",border:`1.5px solid ${char.skin===sk.id?"#533AB7":"#ddd"}`,borderRadius:10,cursor:"pointer"}}><CharSVG skin={sk.id} acc={{hat:"none",glasses:"none",extra:"none"}} mood={7} size={32} animate={false}/><span style={{fontSize:11,color:"#888"}}>{sk.label}</span></button>)}</div>}
      {layer!=="skin"&&<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{ACCESSORIES[layer].map(opt=><button key={opt.id} onClick={()=>onChange({...char,[layer]:opt.id})} style={{padding:"6px 12px",background:char[layer]===opt.id?"#EEEDFE":"#f5f5f5",border:`1.5px solid ${char[layer]===opt.id?"#533AB7":"#ddd"}`,borderRadius:8,cursor:"pointer",fontSize:13,color:char[layer]===opt.id?"#26215C":"#333",fontWeight:char[layer]===opt.id?500:400}}>{opt.label}</button>)}</div>}
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────
function Badge({label,color="#E6F1FB",textColor="#0C447C"}){return <span style={{background:color,color:textColor,fontSize:11,padding:"2px 8px",borderRadius:6,fontWeight:500}}>{label}</span>;}
// eslint-disable-next-line no-unused-vars
function XPBar({xp}){const level=Math.floor(xp/100)+1,progress=xp%100;return(<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:"#888",minWidth:52}}>Lvl {level}</span><div style={{flex:1,height:6,background:"#eee",borderRadius:3}}><div style={{width:`${progress}%`,height:"100%",background:"#533AB7",borderRadius:3,transition:"width 0.4s"}}/></div><span style={{fontSize:12,color:"#888",minWidth:40}}>{xp} XP</span></div>);}
function formatTime(d){if(!d)return"";const date=d.toDate?d.toDate():d;return date.toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit"});}
function formatDate(d){if(!d)return"";const date=d.toDate?d.toDate():d;const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),msgDay=new Date(date.getFullYear(),date.getMonth(),date.getDate()),diff=Math.round((today-msgDay)/86400000);if(diff===0)return"Heute";if(diff===1)return"Gestern";return date.toLocaleDateString("de-CH");}

const EMOJI_REACTIONS=["👍","❤️","😂","🤯","💡","🔥"];
// ── Auth Screen ────────────────────────────────────────────────────────────
function AuthScreen({onDone}){
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [char,setChar]=useState(DEFAULT_CHAR);
  const [step,setStep]=useState(1);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function handleSubmit(){
    setError("");setLoading(true);
    try{
      if(mode==="login"){
        await signInWithEmailAndPassword(auth,email,password);
      } else {
        if(step===1){setLoading(false);setStep(2);return;}
        const cred=await createUserWithEmailAndPassword(auth,email,password);
        await setDoc(doc(db,"users",cred.user.uid),{name,char,xp:0,createdAt:serverTimestamp()});
      }
    }catch(e){
      setError(e.code==="auth/user-not-found"?"Kein Account gefunden":e.code==="auth/wrong-password"?"Falsches Passwort":e.code==="auth/email-already-in-use"?"E-Mail bereits registriert":e.code==="auth/weak-password"?"Passwort zu kurz (min. 6 Zeichen)":"Fehler: "+e.message);
    }
    setLoading(false);
  }

  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"20px",fontFamily:"system-ui,sans-serif",background:"#f8f8f8"}}>
      <div style={{width:"100%",maxWidth:420,background:"#fff",borderRadius:16,padding:"24px",boxShadow:"0 2px 20px rgba(0,0,0,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:8}}>🧠</div>
          <h1 style={{margin:0,fontSize:22,fontWeight:600}}>DailyFact</h1>
          <p style={{margin:"4px 0 0",fontSize:14,color:"#888"}}>Täglich schlauer werden</p>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:20}}>
        
      {["login","register"].map(m=><button key={m} onClick={()=>{setMode(m);setStep(1);setError("");}} 
      </div>  
     {mode==="register"&&step===2?(
          <div>
            <p style={{fontWeight:500,marginBottom:12}}>Wähle deinen Charakter</p>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:13,color:"#888",display:"block",marginBottom:4}}>Dein Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="z.B. Jan Robin" style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #ddd",fontSize:14,boxSizing:"border-box"}}/>
            </div>
            <CharBuilder char={char} onChange={setChar}/>
            <button onClick={handleSubmit} disabled={!name.trim()||loading} style={{width:"100%",marginTop:16,padding:"12px",background:name.trim()?"#533AB7":"#ccc",color:"#fff",border:"none",borderRadius:10,cursor:name.trim()?"pointer":"default",fontWeight:500,fontSize:15}}>
              {loading?"Wird erstellt...":"Account erstellen"}
            </button>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={{fontSize:13,color:"#888",display:"block",marginBottom:4}}>E-Mail</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="deine@email.com" style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #ddd",fontSize:14,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:13,color:"#888",display:"block",marginBottom:4}}>Passwort</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #ddd",fontSize:14,boxSizing:"border-box"}}/>
            </div>
            {error&&<p style={{color:"#E24B4A",fontSize:13,margin:0}}>{error}</p>}
            <button onClick={handleSubmit} disabled={!email||!password||loading} style={{padding:"12px",background:"#533AB7",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:500,fontSize:15}}>
              {loading?"...":(mode==="login"?"Einloggen":"Weiter →")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Setup Screen (Profil bearbeiten) ───────────────────────────────────────
function ProfileScreen({user,profile,onSave,onBack}){
  const [name,setName]=useState(profile?.name||"");
  const [char,setChar]=useState(profile?.char||DEFAULT_CHAR);
  const [loading,setLoading]=useState(false);

  async function save(){
    setLoading(true);
    await setDoc(doc(db,"users",user.uid),{...profile,name,char},{merge:true});
    onSave({...profile,name,char});
    setLoading(false);
    onBack();
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14,padding:"20px 16px",overflowY:"auto",flex:1,fontFamily:"system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#533AB7"}}>←</button>
        <h2 style={{margin:0,fontWeight:500,fontSize:18}}>Profil bearbeiten</h2>
      </div>
      <div style={{background:"#f5f5f5",borderRadius:12,padding:"12px 16px"}}>
        <p style={{margin:"0 0 8px",fontSize:13,color:"#888"}}>Name</p>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Dein Name" maxLength={20} style={{width:"100%",borderRadius:10,border:"1px solid #ddd",padding:"10px 14px",fontSize:15,boxSizing:"border-box"}}/>
      </div>
      <div style={{background:"#f5f5f5",borderRadius:12,padding:"12px 16px"}}>
        <p style={{margin:"0 0 10px",fontSize:13,color:"#888"}}>Charakter</p>
        <CharBuilder char={char} onChange={setChar}/>
      </div>
      <button onClick={save} disabled={!name.trim()||loading} style={{background:"#533AB7",color:"#fff",border:"none",borderRadius:10,padding:"12px",cursor:"pointer",fontWeight:500,fontSize:15}}>
        {loading?"Speichern...":"Speichern"}
      </button>
    </div>
  );
}

// ── Chat Screen ────────────────────────────────────────────────────────────
function ChatScreen({user,profile,chatId,chatName,members,membersProfiles,onBack}){
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [category,setCategory]=useState(CATEGORIES[0]);
  const [filter,setFilter]=useState("Alle");
  const [darkMode,setDarkMode]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [editText,setEditText]=useState("");
  const [showReactions,setShowReactions]=useState(null);
  const bottomRef=useRef();
  const moodScore=6;

  useEffect(()=>{
    const q=query(collection(db,"chats",chatId,"messages"),orderBy("timestamp","asc"));
    const unsub=onSnapshot(q,snap=>{
      setMessages(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  },[chatId]);

  useEffect(()=>{if(bottomRef.current)bottomRef.current.scrollIntoView({behavior:"smooth"});},[messages]);

  async function sendFact(){
    if(!input.trim())return;
    const text=input.trim();
    setInput("");
    await addDoc(collection(db,"chats",chatId,"messages"),{
      text,category,authorId:user.uid,authorName:profile.name,
      authorChar:profile.char,timestamp:serverTimestamp(),reactions:{},type:"fact"
    });
    // Auto-response with related fact
    setTimeout(async()=>{
      const autoFact=getRandomFact(category,text);
      await addDoc(collection(db,"chats",chatId,"messages"),{
        text:autoFact,category,authorId:"bot",authorName:"DailyFact Bot",
        authorChar:{skin:"frog",hat:"none",glasses:"none",extra:"halo"},
        timestamp:serverTimestamp(),reactions:{},type:"bot"
      });
    },1500);
  }

  async function deleteMessage(id){
    await deleteDoc(doc(db,"chats",chatId,"messages",id));
  }

  async function saveEdit(id){
    await updateDoc(doc(db,"chats",chatId,"messages",id),{text:editText});
    setEditingId(null);
  }

  async function addReaction(msgId,emoji){
    const msgRef=doc(db,"chats",chatId,"messages",msgId);
    const msgDoc=await getDoc(msgRef);
    const reactions=msgDoc.data().reactions||{};
    const users=reactions[emoji]||[];
    const newUsers=users.includes(user.uid)?users.filter(u=>u!==user.uid):[...users,user.uid];
    await updateDoc(msgRef,{[`reactions.${emoji}`]:newUsers});
    setShowReactions(null);
  }

  const filtered=filter==="Alle"?messages:messages.filter(m=>m.category===filter);
  const grouped=[];let lastDay=null;
  filtered.forEach(m=>{const l=formatDate(m.timestamp);if(l!==lastDay){grouped.push({type:"divider",label:l});lastDay=l;}grouped.push({type:"msg",...m});});

  const bg=darkMode?"#1a1a2e":"#f8f8f8";
  const cardBg=darkMode?"#16213e":"#fff";
  const textColor=darkMode?"#eee":"#222";
  const mutedColor=darkMode?"#aaa":"#888";

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:bg,fontFamily:"system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${darkMode?"#333":"#eee"}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:cardBg}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#533AB7"}}>←</button>
          <div>
            <p style={{margin:0,fontWeight:500,fontSize:15,color:textColor}}>{chatName}</p>
            <p style={{margin:0,fontSize:11,color:mutedColor}}>{members.length} Mitglieder</p>
          </div>
        </div>
        <button onClick={()=>setDarkMode(d=>!d)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20}}>{darkMode?"☀️":"🌙"}</button>
      </div>

      {/* Filter */}
      <div style={{display:"flex",gap:6,padding:"8px 14px",overflowX:"auto",background:cardBg,borderBottom:`1px solid ${darkMode?"#333":"#eee"}`}}>
        {["Alle",...CATEGORIES].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",border:"none",background:filter===f?"#533AB7":"#f0f0f0",color:filter===f?"#fff":"#555",borderRadius:20,cursor:"pointer",fontSize:12,whiteSpace:"nowrap",fontWeight:filter===f?500:400}}>{f}</button>)}
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:4}}>
        {grouped.map((item,i)=>{
          if(item.type==="divider")return(<div key={i} style={{textAlign:"center",fontSize:12,color:mutedColor,margin:"8px 0",display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:"1px",background:darkMode?"#333":"#eee"}}/>{item.label}<div style={{flex:1,height:"1px",background:darkMode?"#333":"#eee"}}/></div>);
          const isMe=item.authorId===user.uid;
          const isBot=item.authorId==="bot";
          const char=item.authorChar||DEFAULT_CHAR;
          return(
            <div key={item.id} style={{display:"flex",flexDirection:isMe?"row-reverse":"row",gap:8,alignItems:"flex-end",marginBottom:4}}>
              <MiniAvatar char={char} score={isMe?moodScore:isBot?9:6} size={28}/>
              <div style={{maxWidth:"78%"}}>
                <div style={{fontSize:11,color:mutedColor,marginBottom:2,textAlign:isMe?"right":"left"}}>{item.authorName} · {formatTime(item.timestamp)}</div>
                <div style={{background:isMe?"#EEEDFE":isBot?"#EAF3DE":cardBg,borderRadius:12,borderBottomRightRadius:isMe?3:12,borderBottomLeftRadius:isMe?12:3,padding:"10px 13px",border:`1px solid ${isMe?"#CECBF6":isBot?"#C0DD97":darkMode?"#333":"#eee"}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                    <Badge label={item.category} color={isMe?"#CECBF6":isBot?"#C0DD97":"#e0e0e0"} textColor={isMe?"#3C3489":isBot?"#27500A":"#444"}/>
                    {isBot&&<Badge label="🤖 Auto-Fact" color="#EAF3DE" textColor="#27500A"/>}
                  </div>
                  {editingId===item.id?(
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2} style={{resize:"none",borderRadius:8,border:"1px solid #ddd",padding:"6px 10px",fontSize:14,fontFamily:"system-ui,sans-serif"}}/>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>saveEdit(item.id)} style={{flex:1,padding:"6px",background:"#533AB7",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:12}}>Speichern</button>
                        <button onClick={()=>setEditingId(null)} style={{flex:1,padding:"6px",background:"#eee",border:"none",borderRadius:6,cursor:"pointer",fontSize:12}}>Abbrechen</button>
                      </div>
                    </div>
                  ):(
                    <p style={{margin:"0 0 8px",fontSize:14,lineHeight:1.5,color:isMe?"#26215C":textColor}} dangerouslySetInnerHTML={{__html:item.text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}}></p>
                  )}
                  {/* Reactions */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                    {EMOJI_REACTIONS.map(emoji=>{
                      const users=item.reactions?.[emoji]||[];
                      if(users.length===0)return null;
                      return(<button key={emoji} onClick={()=>addReaction(item.id,emoji)} style={{background:users.includes(user.uid)?"#EEEDFE":"#f5f5f5",border:`1px solid ${users.includes(user.uid)?"#533AB7":"#ddd"}`,borderRadius:12,padding:"2px 8px",cursor:"pointer",fontSize:12}}>{emoji} {users.length}</button>);
                    })}
                    <button onClick={()=>setShowReactions(showReactions===item.id?null:item.id)} style={{background:"#f5f5f5",border:"1px solid #ddd",borderRadius:12,padding:"2px 8px",cursor:"pointer",fontSize:12,color:"#888"}}>+😊</button>
                  </div>
                  {showReactions===item.id&&(
                    <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                      {EMOJI_REACTIONS.map(emoji=><button key={emoji} onClick={()=>addReaction(item.id,emoji)} style={{background:"#f5f5f5",border:"1px solid #ddd",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:16}}>{emoji}</button>)}
                    </div>
                  )}
                  {/* Edit/Delete */}
                  {isMe&&!isBot&&(
                    <div style={{display:"flex",gap:6,marginTop:6}}>
                      <button onClick={()=>{setEditingId(item.id);setEditText(item.text);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:mutedColor}}>✏️ Bearbeiten</button>
                      <button onClick={()=>deleteMessage(item.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#E24B4A"}}>🗑️ Löschen</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"10px 14px",borderTop:`1px solid ${darkMode?"#333":"#eee"}`,background:cardBg,display:"flex",flexDirection:"column",gap:8}}>
        <select value={category} onChange={e=>setCategory(e.target.value)} style={{fontSize:12,padding:"4px 8px",borderRadius:8,border:"1px solid #ddd",cursor:"pointer",background:cardBg,color:textColor}}>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
        <div style={{display:"flex",gap:8}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Dein heutiger Fact… (**fett** für Fragen)" rows={2} style={{flex:1,resize:"none",borderRadius:10,border:"1px solid #ddd",padding:"8px 12px",fontSize:14,fontFamily:"system-ui,sans-serif",background:cardBg,color:textColor}}/>
          <button onClick={sendFact} disabled={!input.trim()} style={{background:input.trim()?"#533AB7":"#ccc",color:"#fff",border:"none",borderRadius:10,padding:"0 16px",cursor:input.trim()?"pointer":"default",fontWeight:500,fontSize:14}}>Senden</button>
        </div>
      </div>
    </div>
  );
}
// ── Home Screen (Chat-Liste) ───────────────────────────────────────────────
function HomeScreen({user,profile,onOpenChat,onEditProfile,onLogout}){
  const [chats,setChats]=useState([]);
  const [showCreate,setShowCreate]=useState(false);
  const [newChatName,setNewChatName]=useState("");
  const [inviteEmail,setInviteEmail]=useState("");
  const [loading,setLoading]=useState(false);
  const [showInvite,setShowInvite]=useState(null);
  const moodScore=6;

  useEffect(()=>{
    const q=query(collection(db,"chats"));
    const unsub=onSnapshot(q,snap=>{
      const all=snap.docs.map(d=>({id:d.id,...d.data()}));
      setChats(all.filter(c=>c.members&&c.members.includes(user.uid)));
    });
    return unsub;
  },[user.uid]);

  async function createChat(){
    if(!newChatName.trim())return;
    setLoading(true);
    await addDoc(collection(db,"chats"),{
      name:newChatName.trim(),members:[user.uid],
      createdBy:user.uid,createdAt:serverTimestamp()
    });
    setNewChatName("");setShowCreate(false);setLoading(false);
  }

  async function inviteUser(){
    if(!inviteEmail.trim()||!showInvite)return;
    setLoading(true);
    // Find user by email
    const usersSnap=await getDoc(doc(db,"usersByEmail",inviteEmail.toLowerCase()));
    if(usersSnap.exists()){
      const uid=usersSnap.data().uid;
      const chatRef=doc(db,"chats",showInvite);
      const chatDoc=await getDoc(chatRef);
      const members=chatDoc.data().members||[];
      if(!members.includes(uid)){
        await updateDoc(chatRef,{members:[...members,uid]});
      }
      setInviteEmail("");setShowInvite(null);
      alert("Einladung gesendet!");
    } else {
      alert("Kein Nutzer mit dieser E-Mail gefunden.");
    }
    setLoading(false);
  }

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#f8f8f8",fontFamily:"system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{padding:"12px 16px",borderBottom:"1px solid #eee",background:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <MiniAvatar char={profile?.char||DEFAULT_CHAR} score={moodScore} size={40}/>
          <div>
            <p style={{margin:0,fontWeight:500,fontSize:15}}>{profile?.name||"..."}</p>
            <p style={{margin:0,fontSize:11,color:"#888"}}>{profile?.xp||0} XP</p>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onEditProfile} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,color:"#888"}}>✏️ Profil</button>
          <button onClick={onLogout} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,color:"#E24B4A"}}>Logout</button>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{margin:0,fontSize:16,fontWeight:500}}>Deine Chats</h2>
          <button onClick={()=>setShowCreate(true)} style={{background:"#533AB7",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:500}}>+ Neuer Chat</button>
        </div>

        {showCreate&&(
          <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:12,border:"1px solid #eee"}}>
            <p style={{fontWeight:500,margin:"0 0 10px",fontSize:14}}>Neuen Chat erstellen</p>
            <input value={newChatName} onChange={e=>setNewChatName(e.target.value)} placeholder="Chat-Name (z.B. Familie, Freunde...)" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #ddd",fontSize:14,boxSizing:"border-box",marginBottom:8}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={createChat} disabled={!newChatName.trim()||loading} style={{flex:1,padding:"8px",background:"#533AB7",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:500}}>{loading?"...":"Erstellen"}</button>
              <button onClick={()=>setShowCreate(false)} style={{flex:1,padding:"8px",background:"#f0f0f0",border:"none",borderRadius:8,cursor:"pointer"}}>Abbrechen</button>
            </div>
          </div>
        )}

        {showInvite&&(
          <div style={{background:"#EEEDFE",borderRadius:12,padding:"14px",marginBottom:12,border:"1px solid #AFA9EC"}}>
            <p style={{fontWeight:500,margin:"0 0 10px",fontSize:14,color:"#26215C"}}>Person einladen</p>
            <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="E-Mail der Person" type="email" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #AFA9EC",fontSize:14,boxSizing:"border-box",marginBottom:8}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={inviteUser} disabled={!inviteEmail.trim()||loading} style={{flex:1,padding:"8px",background:"#533AB7",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:500}}>{loading?"...":"Einladen"}</button>
              <button onClick={()=>setShowInvite(null)} style={{flex:1,padding:"8px",background:"#f0f0f0",border:"none",borderRadius:8,cursor:"pointer"}}>Abbrechen</button>
            </div>
          </div>
        )}

        {chats.length===0&&!showCreate&&(
          <div style={{textAlign:"center",padding:"40px 20px",color:"#888"}}>
            <div style={{fontSize:40,marginBottom:12}}>💬</div>
            <p style={{fontWeight:500,marginBottom:4}}>Noch keine Chats</p>
            <p style={{fontSize:14}}>Erstelle einen neuen Chat und lade deine Freunde ein!</p>
          </div>
        )}

        {chats.map(chat=>(
          <div key={chat.id} style={{background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:10,border:"1px solid #eee",cursor:"pointer"}} onClick={()=>onOpenChat(chat)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <p style={{margin:"0 0 2px",fontWeight:500,fontSize:15}}>💬 {chat.name}</p>
                <p style={{margin:0,fontSize:12,color:"#888"}}>{chat.members?.length||1} Mitglieder</p>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button onClick={e=>{e.stopPropagation();setShowInvite(chat.id);}} style={{background:"#EEEDFE",border:"none",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,color:"#533AB7",fontWeight:500}}>+ Einladen</button>
                <span style={{color:"#ccc",fontSize:18}}>›</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [screen,setScreen]=useState("auth"); // auth | home | chat | profile
  const [activeChat,setActiveChat]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async u=>{
      if(u){
        setUser(u);
        const profileDoc=await getDoc(doc(db,"users",u.uid));
        if(profileDoc.exists()){
          setProfile(profileDoc.data());
          // Save email lookup
          await setDoc(doc(db,"usersByEmail",u.email.toLowerCase()),{uid:u.uid},{merge:true});
        }
        setScreen("home");
      } else {
        setUser(null);setProfile(null);setScreen("auth");
      }
      setLoading(false);
    });
    return unsub;
  },[]);

  async function handleLogout(){
    await signOut(auth);
    setScreen("auth");
  }

  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"system-ui,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>🧠</div>
        <p style={{color:"#888"}}>Laden...</p>
      </div>
    </div>
  );

  if(screen==="auth")return <AuthScreen onDone={()=>setScreen("home")}/>;

  if(screen==="profile")return(
    <ProfileScreen user={user} profile={profile} onSave={setProfile} onBack={()=>setScreen("home")}/>
  );

  if(screen==="chat"&&activeChat)return(
    <ChatScreen
      user={user} profile={profile}
      chatId={activeChat.id} chatName={activeChat.name}
      members={activeChat.members||[]}
      membersProfiles={{}}
      onBack={()=>setScreen("home")}
    />
  );

  return(
    <HomeScreen
      user={user} profile={profile}
      onOpenChat={chat=>{setActiveChat(chat);setScreen("chat");}}
      onEditProfile={()=>setScreen("profile")}
      onLogout={handleLogout}
    />
  );
}