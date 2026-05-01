import { useState, useEffect, useRef } from "react";

const CATEGORIES = ["Wissenschaft", "Geschichte", "Natur", "Technologie", "Kultur", "Geografie"];

function getISOWeek(date) {
  const d = new Date(date); d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
}

const WEEKLY_SETS = [
  { theme:"Streak-Woche", emoji:"🔥", challenges:[{id:"w-s1",title:"3-Tage-Streak",desc:"3 Tage hintereinander posten",goal:3,key:"streak"},{id:"w-s2",title:"Früh dabei",desc:"2 Facts vor 12:00 Uhr posten",goal:2,key:"morning"}]},
  { theme:"Kategorie-Woche", emoji:"📚", challenges:[{id:"w-k1",title:"Naturkenner",desc:"3 Facts in der Kategorie Natur posten",goal:3,key:"cat_Natur"},{id:"w-k2",title:"Zeitreisender",desc:"2 Facts in der Kategorie Geschichte posten",goal:2,key:"cat_Geschichte"}]},
  { theme:"Quiz-Woche", emoji:"🧠", challenges:[{id:"w-q1",title:"Quiz-Starter",desc:"5 Quizfragen beantworten",goal:5,key:"quiz_answered"},{id:"w-q2",title:"Treffsicher",desc:"3 Quizfragen in Folge richtig",goal:3,key:"quiz_streak"}]},
  { theme:"Reaktions-Woche", emoji:"💡", challenges:[{id:"w-r1",title:"Wissensmagnet",desc:"3x 'Das wusste ich!' erhalten",goal:3,key:"knew_received"},{id:"w-r2",title:"Neugierig",desc:"Auf 4 Facts des anderen reagieren",goal:4,key:"knew_given"}]},
];
const STATIC_CHALLENGES = [
  {id:"s1",title:"7-Tage-Streak",desc:"7 Tage hintereinander posten",progress:2,goal:7,done:false,isNew:false,permanent:true},
  {id:"s2",title:"Kategorie-Meister",desc:"5 Facts zur gleichen Kategorie",progress:3,goal:5,done:false,isNew:false,permanent:true},
];

const CHAR_SKINS = [
  {id:"fox",  label:"Fuchs",   body:"#E8834A", belly:"#F5C18A", ear:"#E8834A", earInner:"#F5A07A"},
  {id:"cat",  label:"Katze",   body:"#8B7BB5", belly:"#C4B8E8", ear:"#8B7BB5", earInner:"#C4A0C0"},
  {id:"bear", label:"Bär",     body:"#8B6348", belly:"#C4956A", ear:"#8B6348", earInner:"#D4A882"},
  {id:"frog", label:"Frosch",  body:"#5BAD6F", belly:"#A8E0B0", ear:"#5BAD6F", earInner:"#5BAD6F"},
  {id:"panda",label:"Panda",   body:"#DEDEDE", belly:"#F5F5F5", ear:"#2C2C2A", earInner:"#2C2C2A"},
  {id:"bunny",label:"Hase",    body:"#F0D0D8", belly:"#FFF0F4", ear:"#F0D0D8", earInner:"#F4A0B0"},
];

const ACCESSORIES = {
  hat:   [{id:"none",label:"Kein"},{id:"crown",label:"Krone"},{id:"cap",label:"Mütze"},{id:"top",label:"Zylinder"},{id:"star",label:"Stern"}],
  glasses:[{id:"none",label:"Keine"},{id:"round",label:"Rund"},{id:"cool",label:"Cool"},{id:"heart",label:"Herz"},{id:"nerd",label:"Nerd"}],
  extra: [{id:"none",label:"Kein"},{id:"cape",label:"Umhang"},{id:"bow",label:"Schleife"},{id:"scarf",label:"Schal"},{id:"wings",label:"Flügel"},{id:"halo",label:"Heiligenschein"},{id:"lightning",label:"Blitz-Tattoo"},{id:"flowers",label:"Blumen"},{id:"mask",label:"Maske"},{id:"tail",label:"Leucht-Schwanz"}],
};

const MOODS = [
  {score:8, color:"#97C459", border:"#639922", bg:"#EAF3DE", label:"Super fleissig!", anim:"bounce"},
  {score:5, color:"#7F77DD", border:"#534AB7", bg:"#EEEDFE", label:"Auf Kurs",        anim:"sway"},
  {score:2, color:"#EF9F27", border:"#BA7517", bg:"#FAEEDA", label:"Könnte mehr",     anim:"idle"},
  {score:0, color:"#F09595", border:"#E24B4A", bg:"#FCEBEB", label:"Vermisst dich!",  anim:"sad"},
];
function getMood(score) { return MOODS.find(m=>score>=m.score)||MOODS[3]; }
function calcMoodScore(streak,hasTodayFact,quizCorrect){let s=Math.min(streak*2,6);if(hasTodayFact)s+=2;s+=Math.min(quizCorrect,2);return Math.min(s,10);}

function CharSVG({ skin, acc, mood, size=60, animate=true }) {
  const s = CHAR_SKINS.find(c=>c.id===skin)||CHAR_SKINS[0];
  const m = getMood(mood);
  const [frame, setFrame] = useState(0);
  const [blink, setBlink] = useState(false);
  const [bounce, setBounce] = useState(0);

  useEffect(()=>{
    if(!animate) return;
    const t = setInterval(()=>setFrame(f=>(f+1)%60), 80);
    const b = setInterval(()=>{ setBlink(true); setTimeout(()=>setBlink(false),150); }, 3000+Math.random()*2000);
    return ()=>{ clearInterval(t); clearInterval(b); };
  },[animate]);

  useEffect(()=>{
    if(!animate) return;
    const interval = setInterval(()=>{
      if(m.anim==="bounce") setBounce(Math.sin(Date.now()/300)*3);
      else if(m.anim==="sway") setBounce(Math.sin(Date.now()/600)*1.5);
      else if(m.anim==="sad") setBounce(Math.sin(Date.now()/1200)*0.8);
      else setBounce(Math.sin(Date.now()/800)*1);
    },30);
    return ()=>clearInterval(interval);
  },[animate, m.anim]);

  const ty = bounce;
  const mouth = mood>=8 ? `M28 52 Q40 62 52 52` : mood>=5 ? `M32 52 Q40 58 48 52` : mood>=2 ? `M32 53 Q40 53 48 53` : `M30 56 Q40 50 50 56`;
  const eyeH = blink ? 1 : (mood>=5 ? 5 : 4);
  const eyeY = mood>=8 ? 41 : 43;

  return (
    <svg width={size} height={size+10} viewBox="0 0 80 90" style={{overflow:"visible", display:"block"}}>
      <g transform={`translate(0,${ty})`}>
        <ellipse cx="40" cy="85" rx="18" ry="4" fill="rgba(0,0,0,0.08)" />
        {skin==="bunny" ? <>
          <ellipse cx="26" cy="18" rx="7" ry="14" fill={s.ear}/>
          <ellipse cx="54" cy="18" rx="7" ry="14" fill={s.ear}/>
          <ellipse cx="26" cy="18" rx="4" ry="11" fill={s.earInner}/>
          <ellipse cx="54" cy="18" rx="4" ry="11" fill={s.earInner}/>
        </> : <>
          <path d="M22 28 L18 12 L32 22 Z" fill={s.ear}/>
          <path d="M58 28 L62 12 L48 22 Z" fill={s.ear}/>
          <path d="M23 26 L20 15 L30 23 Z" fill={s.earInner}/>
          <path d="M57 26 L60 15 L50 23 Z" fill={s.earInner}/>
        </>}
        <ellipse cx="40" cy="72" rx="16" ry="12" fill={s.body}/>
        <ellipse cx="40" cy="73" rx="10" ry="8" fill={s.belly}/>
        <circle cx="40" cy="40" r="22" fill={s.body}/>
        <ellipse cx="40" cy="46" rx="14" ry="10" fill={s.belly}/>
        {skin==="panda" && <><ellipse cx="29" cy="40" rx="7" ry="6" fill="#2C2C2A"/><ellipse cx="51" cy="40" rx="7" ry="6" fill="#2C2C2A"/></>}
        {mood>=8 ? <>
          <path d={`M27 ${eyeY-2} Q30 ${eyeY-6} 33 ${eyeY-2}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d={`M47 ${eyeY-2} Q50 ${eyeY-6} 53 ${eyeY-2}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </> : <>
          <ellipse cx="30" cy={eyeY} rx="4" ry={eyeH} fill={skin==="panda"?"#fff":"#2C2C2A"}/>
          <ellipse cx="50" cy={eyeY} rx="4" ry={eyeH} fill={skin==="panda"?"#fff":"#2C2C2A"}/>
          {!blink && <><circle cx="31.5" cy={eyeY-1} r="1.5" fill="white"/><circle cx="51.5" cy={eyeY-1} r="1.5" fill="white"/></>}
          {mood<=2 && <>
            <path d={`M26 ${eyeY-6} L28 ${eyeY-4}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="1.5" strokeLinecap="round"/>
            <path d={`M34 ${eyeY-6} L32 ${eyeY-4}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="1.5" strokeLinecap="round"/>
            <path d={`M46 ${eyeY-6} L48 ${eyeY-4}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="1.5" strokeLinecap="round"/>
            <path d={`M54 ${eyeY-6} L52 ${eyeY-4}`} stroke={skin==="panda"?"#fff":"#2C2C2A"} strokeWidth="1.5" strokeLinecap="round"/>
          </>}
        </>}
        <ellipse cx="40" cy="48" rx="3" ry="2" fill={skin==="frog"?"#3B7A4A":"#5C4033"}/>
        <path d={mouth} stroke="#5C4033" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {acc?.extra==="cape" && <><path d="M24 68 Q20 82 28 84 Q40 88 52 84 Q60 82 56 68" fill="#E24B4A" opacity="0.9"/><path d="M24 68 Q32 76 40 72 Q48 76 56 68" fill="#A32D2D"/></>}
        {acc?.extra==="bow" && <><path d="M32 25 Q28 20 24 24 Q28 28 32 25Z" fill="#D4537E"/><path d="M32 25 Q36 20 40 24 Q36 28 32 25Z" fill="#D4537E"/><circle cx="32" cy="25" r="3" fill="#F4C0D1"/></>}
        {acc?.extra==="scarf" && <><path d="M18 60 Q40 56 62 60 Q60 66 54 65 Q40 62 26 65 Q20 66 18 60Z" fill="#EF9F27"/><rect x="52" y="62" width="10" height="14" rx="3" fill="#EF9F27"/></>}
        {acc?.extra==="wings" && <><path d="M18 55 Q4 44 8 58 Q12 68 22 64Z" fill="#B5D4F4" opacity="0.85"/><path d="M62 55 Q76 44 72 58 Q68 68 58 64Z" fill="#B5D4F4" opacity="0.85"/></>}
        {acc?.extra==="halo" && <ellipse cx="40" cy="14" rx="14" ry="4" fill="none" stroke="#EF9F27" strokeWidth="2.5" opacity="0.9"/>}
        {acc?.extra==="lightning" && <path d="M14 36 L18 44 L15 44 L19 54" stroke="#EF9F27" strokeWidth="2" fill="none" strokeLinecap="round"/>}
        {acc?.extra==="flowers" && [{ cx:16,cy:36},{cx:64,cy:36},{cx:12,cy:52}].map((p,i)=>(
          <g key={i}>{[0,60,120,180,240,300].map(a=>(<ellipse key={a} cx={p.cx+Math.cos(a*Math.PI/180)*4} cy={p.cy+Math.sin(a*Math.PI/180)*4} rx="2.5" ry="2" fill={["#F4C0D1","#97C459","#FAC775"][i]}/>))}<circle cx={p.cx} cy={p.cy} r="2.5" fill="#EF9F27"/></g>
        ))}
        {acc?.extra==="mask" && <><path d="M22 36 Q40 32 58 36 Q60 44 52 48 Q40 52 28 48 Q20 44 22 36Z" fill="#534AB7" opacity="0.85"/>{[28,40,52].map(x=><circle key={x} cx={x} cy="44" r="2" fill="#CECBF6" opacity="0.7"/>)}</>}
        {acc?.extra==="tail" && <path d={`M56 74 Q72 ${68+Math.sin(frame/8)*6} 74 ${80+Math.sin(frame/6)*4} Q70 ${90+Math.cos(frame/7)*4} 60 82`} fill="none" stroke={s.body} strokeWidth="7" strokeLinecap="round"/>}
        {acc?.glasses==="round" && <><circle cx="30" cy="43" r="7" fill="none" stroke="#3C3489" strokeWidth="1.5"/><circle cx="50" cy="43" r="7" fill="none" stroke="#3C3489" strokeWidth="1.5"/><line x1="37" y1="43" x2="43" y2="43" stroke="#3C3489" strokeWidth="1.5"/><line x1="23" y1="43" x2="18" y2="41" stroke="#3C3489" strokeWidth="1.5"/><line x1="57" y1="43" x2="62" y2="41" stroke="#3C3489" strokeWidth="1.5"/></>}
        {acc?.glasses==="cool" && <><rect x="21" y="39" width="16" height="8" rx="3" fill="rgba(30,20,80,0.7)"/><rect x="43" y="39" width="16" height="8" rx="3" fill="rgba(30,20,80,0.7)"/><line x1="37" y1="43" x2="43" y2="43" stroke="#2C2C2A" strokeWidth="1.5"/></>}
        {acc?.glasses==="heart" && <><path d="M23 43 Q26 38 30 43 Q34 38 37 43" fill="rgba(212,83,126,0.3)" stroke="#D4537E" strokeWidth="1.5"/><path d="M43 43 Q46 38 50 43 Q54 38 57 43" fill="rgba(212,83,126,0.3)" stroke="#D4537E" strokeWidth="1.5"/><line x1="37" y1="43" x2="43" y2="43" stroke="#D4537E" strokeWidth="1.5"/></>}
        {acc?.glasses==="nerd" && <><rect x="22" y="38" width="15" height="10" rx="2" fill="none" stroke="#633806" strokeWidth="2"/><rect x="43" y="38" width="15" height="10" rx="2" fill="none" stroke="#633806" strokeWidth="2"/><line x1="37" y1="43" x2="43" y2="43" stroke="#633806" strokeWidth="2"/><line x1="22" y1="43" x2="17" y2="41" stroke="#633806" strokeWidth="2"/><line x1="58" y1="43" x2="63" y2="41" stroke="#633806" strokeWidth="2"/></>}
        {acc?.hat==="crown" && <><path d="M20 28 L24 18 L30 24 L40 16 L50 24 L56 18 L60 28 Z" fill="#EF9F27" stroke="#BA7517" strokeWidth="1"/><rect x="19" y="27" width="42" height="5" rx="2" fill="#EF9F27" stroke="#BA7517" strokeWidth="1"/><circle cx="30" cy="21" r="2" fill="#E24B4A"/><circle cx="40" cy="17" r="2" fill="#7F77DD"/><circle cx="50" cy="21" r="2" fill="#5BAD6F"/></>}
        {acc?.hat==="cap" && <><rect x="22" y="20" width="36" height="14" rx="7" fill="#534AB7"/><rect x="14" y="30" width="52" height="5" rx="2.5" fill="#3C3489"/><circle cx="40" cy="21" r="2.5" fill="#AFA9EC"/></>}
        {acc?.hat==="top" && <><rect x="28" y="10" width="24" height="20" rx="2" fill="#2C2C2A"/><rect x="22" y="28" width="36" height="4" rx="2" fill="#2C2C2A"/></>}
        {acc?.hat==="star" && <text x="32" y="22" fontSize="18" textAnchor="middle">⭐</text>}
        {mood>=8 && frame%20<10 && <><circle cx={30+Math.sin(frame)*5} cy={20-frame%10*2} r="2" fill="#EF9F27" opacity={1-frame%10*0.1}/><circle cx={50+Math.cos(frame)*5} cy={18-frame%8*2} r="1.5" fill="#7F77DD" opacity={1-frame%8*0.12}/></>}
        {mood<=1 && frame%40<20 && <text x={55+frame%20*0.3} y={30-frame%20*0.5} fontSize="10" fill="#7F77DD" opacity={1-frame%20*0.05} fontWeight="500">z</text>}
        <ellipse cx="20" cy="68" rx="7" ry="5" fill={s.body} transform={`rotate(${mood>=8?-20+Math.sin(frame/5)*15:-10},20,68)`}/>
        <ellipse cx="60" cy="68" rx="7" ry="5" fill={s.body} transform={`rotate(${mood>=8?20-Math.sin(frame/5)*15:10},60,68)`}/>
      </g>
    </svg>
  );
}

const DEFAULT_CHAR = { skin:"fox", hat:"none", glasses:"none", extra:"none" };
const OTHER_CHAR   = { skin:"cat", hat:"cap",  glasses:"round", extra:"bow" };

function CharBuilder({ char, onChange }) {
  const [layer, setLayer] = useState("skin");
  const tabs = [{id:"skin",label:"Charakter"},{id:"hat",label:"Hut"},{id:"glasses",label:"Brille"},{id:"extra",label:"Extra"}];
  const tabStyle = t => ({ padding:"6px 10px", border:"none", background:layer===t?"#533AB7":"#f0f0f0", color:layer===t?"#fff":"#555", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:500, whiteSpace:"nowrap" });
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"center",gap:16,padding:"8px 0"}}>
        {[8,5,2,0].map(sc=>{const mo=getMood(sc);return(<div key={sc} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{background:mo.bg,borderRadius:"50%",padding:4,border:`2px solid ${mo.border}`}}><CharSVG skin={char.skin} acc={char} mood={sc} size={44} animate={true}/></div><span style={{fontSize:10,color:"#888"}}>{mo.label}</span></div>);})}
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>{tabs.map(t=><button key={t.id} style={tabStyle(t.id)} onClick={()=>setLayer(t.id)}>{t.label}</button>)}</div>
      {layer==="skin" && <div style={{display:"flex",flexWrap:"wrap",gap:10}}>{CHAR_SKINS.map(sk=>(<button key={sk.id} onClick={()=>onChange({...char,skin:sk.id})} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px 10px",background:char.skin===sk.id?"#EEEDFE":"#f5f5f5",border:`1.5px solid ${char.skin===sk.id?"#533AB7":"#ddd"}`,borderRadius:10,cursor:"pointer"}}><CharSVG skin={sk.id} acc={{hat:"none",glasses:"none",extra:"none"}} mood={7} size={36} animate={false}/><span style={{fontSize:11,color:"#888"}}>{sk.label}</span></button>))}</div>}
      {layer!=="skin" && <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{ACCESSORIES[layer].map(opt=>(<button key={opt.id} onClick={()=>onChange({...char,[layer]:opt.id})} style={{padding:"6px 14px",background:char[layer]===opt.id?"#EEEDFE":"#f5f5f5",border:`1.5px solid ${char[layer]===opt.id?"#533AB7":"#ddd"}`,borderRadius:8,cursor:"pointer",fontSize:13,color:char[layer]===opt.id?"#26215C":"#333",fontWeight:char[layer]===opt.id?500:400}}>{opt.label}</button>))}</div>}
    </div>
  );
}

function MiniAvatar({ char, score, size=32 }) {
  const m = getMood(score);
  return (<div style={{background:m.bg,border:`2px solid ${m.border}`,borderRadius:"50%",width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}><CharSVG skin={char.skin} acc={char} mood={score} size={size*0.95} animate={true}/></div>);
}

function SetupScreen({ onDone, initial }) {
  const [name, setName] = useState(initial?.name||"");
  const [char, setChar] = useState(initial?.char||DEFAULT_CHAR);
  const valid = name.trim().length>=2;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,padding:"20px 16px",overflowY:"auto",flex:1}}>
      <h2 style={{margin:0,fontWeight:500,fontSize:18,textAlign:"center"}}>Dein Charakter</h2>
      <p style={{margin:0,fontSize:13,color:"#888",textAlign:"center"}}>Erstelle deinen eigenen animierten Charakter!</p>
      <div style={{background:"#f5f5f5",borderRadius:12,padding:"12px 16px"}}>
        <p style={{margin:"0 0 8px",fontSize:13,color:"#888"}}>Benutzername</p>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="z.B. Alex" maxLength={20} style={{width:"100%",borderRadius:10,border:"1px solid #ddd",padding:"10px 14px",fontSize:15,boxSizing:"border-box"}}/>
      </div>
      <div style={{background:"#f5f5f5",borderRadius:12,padding:"12px 16px"}}>
        <p style={{margin:"0 0 10px",fontSize:13,color:"#888"}}>Charakter gestalten</p>
        <CharBuilder char={char} onChange={setChar}/>
      </div>
      <button onClick={()=>valid&&onDone(name.trim(),char)} disabled={!valid} style={{background:valid?"#533AB7":"#ccc",color:"#fff",border:"none",borderRadius:10,padding:"12px 32px",cursor:valid?"pointer":"default",fontWeight:500,fontSize:15}}>
        {initial?"Speichern":"Los geht's!"}
      </button>
    </div>
  );
}

function formatTime(d){return d.toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit"});}
function getDayLabel(date){const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),msgDay=new Date(date.getFullYear(),date.getMonth(),date.getDate()),diff=Math.round((today-msgDay)/86400000);if(diff===0)return"Heute";if(diff===1)return"Gestern";return date.toLocaleDateString("de-CH");}
function Badge({label,color="#E6F1FB",textColor="#0C447C"}){return <span style={{background:color,color:textColor,fontSize:11,padding:"2px 8px",borderRadius:6,fontWeight:500}}>{label}</span>;}
function XPBar({xp}){const level=Math.floor(xp/100)+1,progress=xp%100;return(<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:"#888",minWidth:52}}>Lvl {level}</span><div style={{flex:1,height:6,background:"#eee",borderRadius:3}}><div style={{width:`${progress}%`,height:"100%",background:"#533AB7",borderRadius:3,transition:"width 0.4s"}}/></div><span style={{fontSize:12,color:"#888",minWidth:40}}>{xp} XP</span></div>);}

const initialFacts = [
  {id:1,author:"other",text:"Honig wird nie schlecht — in ägyptischen Grabstätten wurde 3000 Jahre alter Honig gefunden.",category:"Natur",timestamp:new Date(Date.now()-86400000*2),reactions:{knew:[]}},
  {id:2,author:"me",text:"Das menschliche Auge kann etwa 10 Millionen verschiedene Farben unterscheiden.",category:"Wissenschaft",timestamp:new Date(Date.now()-86400000*2),reactions:{knew:[]}},
];export default function DailyFactApp() {
  const [screen,setScreen]=useState("setup");
  const [myName,setMyName]=useState("");
  const [myChar,setMyChar]=useState(DEFAULT_CHAR);
  const [facts,setFacts]=useState(initialFacts);
  const [input,setInput]=useState("");
  const [category,setCategory]=useState(CATEGORIES[0]);
  const [tab,setTab]=useState("chat");
  const [xpMe,setXpMe]=useState(120);
  const [showXPAnim,setShowXPAnim]=useState("");
  const [showReminder,setShowReminder]=useState(false);
  const [staticChallenges,setStaticChallenges]=useState(STATIC_CHALLENGES);
  const [acceptedWeekNr,setAcceptedWeekNr]=useState({});
  const [weeklyProgress]=useState({});
  const [quizState,setQuizState]=useState({current:null,answered:null,score:0,total:0,correct:0,usedIds:[]});
  const bottomRef=useRef();

  const currentWeek=getISOWeek(new Date()),weekSetIdx=(currentWeek-1)%WEEKLY_SETS.length;
  const currentSet=WEEKLY_SETS[weekSetIdx],nextSet=WEEKLY_SETS[(weekSetIdx+1)%WEEKLY_SETS.length];
  const weekChallenges=currentSet.challenges.map(c=>({...c,progress:weeklyProgress[c.id]||0,done:(weeklyProgress[c.id]||0)>=c.goal,isNew:!acceptedWeekNr[c.id]}));
  const allNew=[...weekChallenges.filter(c=>c.isNew),...staticChallenges.filter(c=>c.isNew)];
  const streak=2;
  const myTodayFact=facts.find(f=>f.author==="me"&&getDayLabel(f.timestamp)==="Heute");
  const moodScore=calcMoodScore(streak,!!myTodayFact,quizState.correct);
  const mood=getMood(moodScore);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{const now=new Date();if(now.getHours()>=18&&!myTodayFact)setShowReminder(true);else setShowReminder(false);},[facts]);
  useEffect(()=>{if(bottomRef.current)bottomRef.current.scrollIntoView({behavior:"smooth"});},[facts,tab]);

  function gainXP(n){setXpMe(x=>x+n);setShowXPAnim(`+${n} XP`);setTimeout(()=>setShowXPAnim(""),1400);}

  function sendFact(){
    if(!input.trim())return;
    setFacts(prev=>[...prev,{id:Date.now(),author:"me",text:input.trim(),category,timestamp:new Date(),reactions:{knew:[]}}]);
    setInput("");setShowReminder(false);
    if(!myTodayFact)gainXP(20);
    setTimeout(()=>{
      const r=[{text:"Schmetterlinge schmecken mit ihren Füssen.",cat:"Natur"},{text:"Die Berliner Mauer stand nur 28 Jahre.",cat:"Geschichte"},{text:"Ein Oktopus hat drei Herzen und blaues Blut.",cat:"Natur"}];
      const rx=r[Math.floor(Math.random()*r.length)];
      setFacts(prev=>[...prev,{id:Date.now()+1,author:"other",text:rx.text,category:rx.cat,timestamp:new Date(),reactions:{knew:[]}}]);
    },2500);
  }

  function toggleKnew(factId){setFacts(prev=>prev.map(f=>{if(f.id!==factId)return f;const already=f.reactions.knew.includes("me");if(!already)gainXP(5);return{...f,reactions:{...f.reactions,knew:already?f.reactions.knew.filter(u=>u!=="me"):[...f.reactions.knew,"me"]}};}));}

  function genQ(fl,ui){const av=fl.filter(f=>!ui.includes(f.id));if(!av.length)return null;const fact=av[Math.floor(Math.random()*av.length)];const words=fact.text.split(" ");const bi=Math.floor(words.length*0.5+Math.random()*(words.length*0.3));const ans=words[bi].replace(/[.,!?]/g,"");if(ans.length<3)return genQ(fl,[...ui,fact.id]);const dist=["Honig","Oktopus","Milliarden","Farben","Schmetterlinge"].filter(w=>w.toLowerCase()!==ans.toLowerCase()).slice(0,3);const bl=[...words];bl[bi]="___";return{factId:fact.id,question:bl.join(" "),answer:ans,options:[...dist,ans].sort(()=>Math.random()-0.5),category:fact.category,author:fact.author};}
  function answerQuiz(opt){const correct=opt===quizState.current.answer;setQuizState(s=>({...s,answered:opt,score:correct?s.score+1:s.score,total:s.total+1,correct:correct?s.correct+1:s.correct,usedIds:[...s.usedIds,s.current.factId]}));if(correct)gainXP(10);}
  function acceptChallenge(id,isWeekly){if(isWeekly)setAcceptedWeekNr(prev=>({...prev,[id]:currentWeek}));else setStaticChallenges(prev=>prev.map(c=>c.id===id?{...c,isNew:false}:c));}

  const grouped=[];let lastDay=null;
  facts.forEach(f=>{const l=getDayLabel(f.timestamp);if(l!==lastDay){grouped.push({type:"divider",label:l});lastDay=l;}grouped.push({type:"fact",...f});});
  const tabStyle=t=>({flex:1,padding:"10px 0",border:"none",background:"none",cursor:"pointer",fontWeight:tab===t?500:400,fontSize:13,color:tab===t?"#222":"#888",borderBottom:tab===t?"2px solid #533AB7":"2px solid transparent",position:"relative"});
  const daysLeft=()=>{const d=new Date(),day=d.getDay();return day===1?7:(8-day)%7;};

  if(screen==="setup") return (
    <div style={{fontFamily:"system-ui,sans-serif",maxWidth:480,margin:"0 auto",height:"100vh",display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <SetupScreen onDone={(name,char)=>{setMyName(name);setMyChar(char);setScreen("app");}} initial={myName?{name:myName,char:myChar}:null}/>
    </div>
  );

  return (
    <div style={{fontFamily:"system-ui,sans-serif",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",height:"100vh"}}>
      <div style={{padding:"8px 14px",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <MiniAvatar char={myChar} score={moodScore} size={40}/>
          <div><p style={{margin:0,fontWeight:500,fontSize:15}}>{myName}</p><p style={{margin:0,fontSize:11,color:"#888"}}>{mood.label} · {xpMe} XP</p></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {showXPAnim&&<span style={{fontSize:12,color:"#533AB7",fontWeight:500}}>{showXPAnim}</span>}
          {streak>0&&<div style={{display:"flex",alignItems:"center",gap:4,background:"#FAEEDA",borderRadius:8,padding:"4px 8px"}}><span>🔥</span><span style={{fontWeight:500,color:"#633806",fontSize:13}}>{streak}</span></div>}
          <button onClick={()=>setScreen("setup")} style={{background:"none",border:"1px solid #ddd",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,color:"#888"}}>✏️ Profil</button>
        </div>
      </div>

      <div style={{display:"flex",borderBottom:"1px solid #eee"}}>
        <button style={tabStyle("chat")} onClick={()=>setTab("chat")}>Facts</button>
        <button style={tabStyle("stats")} onClick={()=>setTab("stats")}>Stats</button>
        <button style={tabStyle("challenges")} onClick={()=>setTab("challenges")}>Challenges{allNew.length>0&&<span style={{position:"absolute",top:6,right:"calc(50% - 34px)",width:7,height:7,borderRadius:"50%",background:"#E24B4A"}}/>}</button>
        <button style={tabStyle("quiz")} onClick={()=>setTab("quiz")}>Quiz</button>
      </div>

      {showReminder&&<div style={{background:"#FAEEDA",borderBottom:"1px solid #EF9F27",padding:"8px 16px",fontSize:13,color:"#633806",display:"flex",justifyContent:"space-between"}}><span>⏰ Du hast heute noch keinen Fact geteilt!</span><button onClick={()=>setShowReminder(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#633806"}}>✕</button></div>}

      {tab==="chat"&&<>
        <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:4}}>
          {grouped.map((item,i)=>{
            if(item.type==="divider")return(<div key={i} style={{textAlign:"center",fontSize:12,color:"#aaa",margin:"8px 0",display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:"1px",background:"#eee"}}/>{item.label}<div style={{flex:1,height:"1px",background:"#eee"}}/></div>);
            const isMe=item.author==="me",knew=item.reactions.knew.includes("me");
            return(<div key={item.id} style={{display:"flex",flexDirection:isMe?"row-reverse":"row",gap:8,alignItems:"flex-end",marginBottom:4}}>
              <MiniAvatar char={isMe?myChar:OTHER_CHAR} score={isMe?moodScore:7} size={28}/>
              <div style={{maxWidth:"75%"}}>
                <div style={{fontSize:11,color:"#aaa",marginBottom:2,textAlign:isMe?"right":"left"}}>{isMe?myName:"Freundin"} · {formatTime(item.timestamp)}</div>
                <div style={{background:isMe?"#EEEDFE":"#f5f5f5",borderRadius:12,borderBottomRightRadius:isMe?3:12,borderBottomLeftRadius:isMe?12:3,padding:"10px 13px",fontSize:14,lineHeight:1.5,color:isMe?"#26215C":"#222",border:"1px solid #eee"}}>
                  <Badge label={item.category} color={isMe?"#CECBF6":"#e0e0e0"} textColor={isMe?"#3C3489":"#444"}/>
                  <p style={{margin:"6px 0 8px"}}>{item.text}</p>
                  <button onClick={()=>toggleKnew(item.id)} style={{background:knew?"#C0DD97":"transparent",border:`1px solid ${knew?"#97C459":"#ddd"}`,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:12,color:knew?"#27500A":"#888"}}>
                    {knew?"✓ ":""}Das wusste ich! {item.reactions.knew.length>0&&`(${item.reactions.knew.length})`}
                  </button>
                </div>
              </div>
            </div>);
          })}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"10px 16px",borderTop:"1px solid #eee",display:"flex",flexDirection:"column",gap:8}}>
          {myTodayFact&&<div style={{fontSize:12,color:"#aaa",textAlign:"center"}}>Du hast heute schon einen Fact geteilt ✓</div>}
          <select value={category} onChange={e=>setCategory(e.target.value)} style={{fontSize:12,padding:"4px 8px",borderRadius:8,border:"1px solid #ddd",cursor:"pointer"}}>
            {CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </select>
          <div style={{display:"flex",gap:8}}>
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendFact();}}} placeholder="Dein heutiger Fact…" rows={2} style={{flex:1,resize:"none",borderRadius:10,border:"1px solid #ddd",padding:"8px 12px",fontSize:14,fontFamily:"system-ui,sans-serif"}}/>
            <button onClick={sendFact} style={{background:"#533AB7",color:"#fff",border:"none",borderRadius:10,padding:"0 16px",cursor:"pointer",fontWeight:500,fontSize:14}}>Senden</button>
          </div>
        </div>
      </>}

      {tab==="stats"&&<div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center",background:"#f5f5f5",borderRadius:12,padding:"14px 16px"}}>
          <div style={{background:mood.bg,border:`2px solid ${mood.border}`,borderRadius:"50%",padding:4}}><CharSVG skin={myChar.skin} acc={myChar} mood={moodScore} size={52} animate={true}/></div>
          <div style={{flex:1}}><p style={{margin:"0 0 4px",fontWeight:500}}>{myName} · <span style={{fontSize:13,color:"#888"}}>{mood.label}</span></p><XPBar xp={xpMe}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{label:"Streak",value:`${streak} Tage`,color:"#FAEEDA",tc:"#633806"},{label:"Facts gesamt",value:facts.filter(f=>f.author==="me").length,color:"#EEEDFE",tc:"#3C3489"},{label:"Das wusste ich!",value:facts.reduce((a,f)=>a+(f.author!=="me"&&f.reactions.knew.includes("me")?1:0),0),color:"#EAF3DE",tc:"#27500A"},{label:"Heute gepostet",value:myTodayFact?"Ja ✓":"Nein",color:myTodayFact?"#EAF3DE":"#FCEBEB",tc:myTodayFact?"#27500A":"#791F1F"}].map(card=>(<div key={card.label} style={{background:card.color,borderRadius:10,padding:"12px 14px"}}><div style={{fontSize:12,color:card.tc,opacity:0.7,marginBottom:4}}>{card.label}</div><div style={{fontSize:22,fontWeight:500,color:card.tc}}>{card.value}</div></div>))}
        </div>
      </div>}

      {tab==="challenges"&&<div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
        {allNew.length>0&&<div style={{background:"#FAEEDA",border:"1px solid #EF9F27",borderRadius:12,padding:"14px 16px"}}><p style={{fontWeight:500,fontSize:14,color:"#633806",margin:"0 0 10px"}}>🆕 Neue Challenges!</p><div style={{display:"flex",flexDirection:"column",gap:8}}>{allNew.map(c=>{const isW=!c.permanent;return(<div key={c.id} style={{background:"#fff8ee",border:"1px solid #EF9F27",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><div><p style={{fontWeight:500,fontSize:14,color:"#633806",margin:"0 0 2px"}}>{c.title}</p><p style={{fontSize:12,color:"#854F0B",margin:0}}>{c.desc}</p></div><button onClick={()=>acceptChallenge(c.id,isW)} style={{background:"#EF9F27",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:500}}>Annehmen</button></div>);})}</div></div>}
        <div style={{background:"#EEEDFE",border:"1px solid #AFA9EC",borderRadius:12,padding:"12px 16px",display:"flex",justifyContent:"space-between"}}><div><p style={{fontWeight:500,fontSize:14,color:"#26215C",margin:"0 0 2px"}}>{currentSet.emoji} {currentSet.theme}</p><p style={{fontSize:12,color:"#534AB7",margin:0}}>KW {currentWeek} · noch {daysLeft()} Tage</p></div><div style={{textAlign:"right"}}><p style={{fontSize:11,color:"#888",margin:"0 0 2px"}}>Nächste Woche</p><p style={{fontSize:12,color:"#534AB7",margin:0}}>{nextSet.emoji} {nextSet.theme}</p></div></div>
        {[...weekChallenges.filter(c=>!c.isNew),...staticChallenges.filter(c=>!c.isNew)].map(c=>(<div key={c.id} style={{background:"#fff",border:"1px solid #eee",borderRadius:12,padding:"14px 16px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontWeight:500}}>{c.title}</span>{c.done?<Badge label="Erledigt ✓" color="#EAF3DE" textColor="#27500A"/>:<Badge label={c.permanent?"Dauerhaft":"Wöchentlich"} color={c.permanent?"#e0e0e0":"#EEEDFE"} textColor={c.permanent?"#444":"#3C3489"}/>}</div><p style={{fontSize:13,color:"#888",margin:"0 0 10px"}}>{c.desc}</p><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:8,background:"#eee",borderRadius:4}}><div style={{width:`${Math.min((c.progress/c.goal)*100,100)}%`,height:"100%",background:c.done?"#639922":"#533AB7",borderRadius:4}}/></div><span style={{fontSize:13,color:"#888"}}>{c.progress}/{c.goal}</span></div></div>))}
      </div>}

      {tab==="quiz"&&<div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontWeight:500}}>Fact-Quiz</span><div style={{background:"#EEEDFE",borderRadius:8,padding:"4px 12px",fontSize:13,color:"#3C3489",fontWeight:500}}>{quizState.score}/{quizState.total} richtig</div></div>
        {!quizState.current&&<div style={{textAlign:"center",padding:"32px 16px"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><div style={{background:mood.bg,border:`2px solid ${mood.border}`,borderRadius:"50%",padding:6}}><CharSVG skin={myChar.skin} acc={myChar} mood={moodScore} size={60} animate={true}/></div></div>
          <p style={{fontSize:13,color:"#888",marginBottom:16}}>{facts.filter(f=>!quizState.usedIds.includes(f.id)).length} Facts verfügbar</p>
          <button onClick={()=>setQuizState(s=>({...s,current:genQ(facts,s.usedIds),answered:null}))} style={{background:"#533AB7",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",cursor:"pointer",fontWeight:500}}>Quiz starten</button>
        </div>}
        {quizState.current&&<>
          <div style={{background:"#f5f5f5",borderRadius:12,padding:"16px",border:"1px solid #eee"}}><Badge label={quizState.current.category} color="#EEEDFE" textColor="#3C3489"/><p style={{fontSize:15,lineHeight:1.6,margin:"8px 0 0"}}>{quizState.current.question}</p></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {quizState.current.options.map(opt=>{const ic=opt===quizState.current.answer,ch=opt===quizState.answered;let bg="#fff",border="#ddd",color="#222";if(quizState.answered){if(ic){bg="#EAF3DE";border="#97C459";color="#27500A";}else if(ch){bg="#FCEBEB";border="#F09595";color="#791F1F";}}return<button key={opt} onClick={()=>!quizState.answered&&answerQuiz(opt)} style={{background:bg,border:`1px solid ${border}`,borderRadius:10,padding:"12px",cursor:quizState.answered?"default":"pointer",fontSize:14,color,textAlign:"left"}}>{opt}</button>;})}
          </div>
          {quizState.answered&&<div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"center"}}><p style={{fontSize:14,color:quizState.answered===quizState.current.answer?"#27500A":"#791F1F",fontWeight:500,margin:0}}>{quizState.answered===quizState.current.answer?"Richtig! +10 XP":`Falsch – Antwort: ${quizState.current.answer}`}</p><button onClick={()=>{const rem=facts.filter(f=>!quizState.usedIds.includes(f.id));setQuizState(s=>({...s,current:rem.length?genQ(facts,s.usedIds):null,answered:null}));}} style={{background:"#533AB7",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",cursor:"pointer",fontWeight:500}}>Nächste Frage →</button></div>}
        </>}
      </div>}
    </div>
  );
}