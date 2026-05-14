// Pattern Analyser PWA — Complete Logic
// ═══════════════════════════════════════════════════════════════════════════════

const fileData = { az: null, el: null };
const bwCache = { az: {}, el: {} };

// ═══════════════════════════════════════════════════════════════════════════════
// SATELLITE DATABASE (built-in)
// ═══════════════════════════════════════════════════════════════════════════════
const SATELLITES = [
    ['INTELSAT 18 (IS-18)', 180.0],
    ['YAMAL 300K', 183.0],
    ['NSS-9', 183.1],
    ['GALAXY 13 (HORIZONS-1)', 210.0],
    ['INMARSAT 3-F3', 212.3],
    ['SES-22', 221.0],
    ['INTELSAT 905 (IS-905)', 222.8],
    ['AMC-6', 225.0],
    ['GALAXY 33 (G-33)', 227.0],
    ['SES-21', 229.1],
    ['SES-15', 230.9],
    ['GALAXY 31', 239.0],
    ['ECHOSTAR 9 (GALAXY 23)', 241.0],
    ['ANIK F3', 249.7],
    ['ANIK F1R', 252.0],
    ['ANIK G1', 255.0],
    ['GALAXY 15', 257.0],
    ['GALAXY 16', 259.0],
    ['DIRECTV 10', 261.0],
    ['GALAXY 19', 264.9],
    ['GALAXY 17', 267.0],
    ['GALAXY 3C', 270.0],
    ['NIMIQ 6', 271.5],
    ['GALAXY 28', 275.0],
    ['INTELSAT 21 (IS-21)', 277.0],
    ['INTELSAT 11 (IS-11)', 280.5],
    ['INTELSAT 14 (IS-14)', 282.0],
    ['INTELSAT 16 (IS-16)', 285.0],
    ['INTELSAT 34 (IS-34)', 286.0],
    ['INTELSAT 30 (IS-30)', 287.5],
    ['INTELSAT 1 (IS-1)', 325.0],
    ['INTELSAT 907 (IS-907)', 332.5],
    ['INTELSAT 901 (IS-901)', 342.0],
    ['EUTELSAT 5 WEST B', 355.0],
    ['EUTELSAT 7B', 7.0],
    ['EUTELSAT 10A', 10.0],
    ['EUTELSAT 16A', 16.0],
    ['EUTELSAT 21B', 21.5],
    ['ARABSAT 6A', 26.0],
    ['BADR 4 / ARABSAT 5B', 26.0],
    ['EUTELSAT 36B', 36.0],
    ['PAKSAT 1R', 38.0],
    ['INTELSAT 904 (IS-904)', 60.0],
    ['INTELSAT 902 (IS-902)', 62.0],
    ['INTELSAT 906 (IS-906)', 64.2],
    ['INTELSAT 17 (IS-17)', 66.0],
    ['INTELSAT 20 (IS-20)', 68.5],
    ['EUTELSAT 70B', 70.5],
    ['GSAT 18', 74.0],
    ['INSAT 4A / GSAT 10 / GSAT 12', 83.0],
    ['MEASAT 3 / 3A / 3B', 91.5],
    ['INSAT 4CR / GSAT 15 / GSAT 17', 93.5],
    ['ASIASAT 7', 105.5],
    ['BSAT 4A / N-SAT 110', 110.0],
    ['CHINASAT 10 / ZX 10', 110.5],
    ['PALAPA D', 113.0],
    ['CHINASAT 6B / ZX 6B', 115.5],
    ['KOREASAT 6', 116.0],
    ['TELKOM 3S', 118.0],
    ['THAICOM 4 / IPSTAR', 119.5],
    ['ASIASAT 6 / THAICOM 7', 120.0],
    ['ASIASAT 9', 122.2],
    ['CHINASAT 11 / ZX 11', 125.0],
    ['CHINASAT 14 / ZX 14', 128.0],
    ['JCSAT 3A', 128.0],
    ['APSTAR 6C', 134.0],
    ['TELSTAR 18V / APSTAR 5C', 138.0],
    ['EXPRESS AT2', 139.8],
    ['SKY MUSTER / EXPRESS AM5', 140.0],
    ['HIMAWARI 8', 140.6],
    ['HIMAWARI 9', 140.7],
    ['APSTAR 9', 142.0],
    ['INMARSAT 3-F1', 143.5],
    ['SUPERBIRD C2', 144.0],
    ['SKYMUSTER 2', 144.8],
    ['MTSAT-2', 145.0],
    ['NUSANTARA SATU', 146.0],
    ['JCSAT-18 / KACIFIC 1', 150.0],
    ['BRISAT', 150.5],
    ['OPTUS D2', 152.0],
    ['JCSAT 2B', 154.0],
    ['TJS 1', 155.0],
    ['OPTUS 10 / OPTUS C1 / D3', 156.0],
    ['TELCOM 2', 157.0],
    ['INMARSAT 5-F3', 179.6],
];

// Populate satellite dropdown (sorted by orbital location)
(function() {
    const sel = document.getElementById('satSelect');
    const sorted = SATELLITES.slice().sort((a,b) => a[1] - b[1]);
    sorted.forEach(s => {
        const slot = s[1] <= 180 ? s[1].toFixed(1)+'\u00B0E' : (360-s[1]).toFixed(1)+'\u00B0W';
        sel.innerHTML += '<option value="'+s[1]+'" data-name="'+s[0]+'">'+slot+' - '+s[0]+'</option>';
    });
})();

function onSatSelect() {
    const sel = document.getElementById('satSelect');
    const opt = sel.options[sel.selectedIndex];
    if (!opt || !opt.value) return;
    document.getElementById('satSlot').value = opt.value;
    document.getElementById('satName').value = opt.dataset.name;
}

function calcLookAngles() {
    const lat = parseFloat(document.getElementById('siteLat').value);
    const lon = parseFloat(document.getElementById('siteLon').value);
    const satSlot = parseFloat(document.getElementById('satSlot').value);
    if (isNaN(lat)||isNaN(lon)||isNaN(satSlot)) { alert('Enter Lat, Lon, and Sat Slot.'); return; }

    const latR = lat * Math.PI / 180;
    const B = satSlot - lon;
    const BR = B * Math.PI / 180;
    const cosLat = Math.cos(latR), cosB = Math.cos(BR), sinLat = Math.sin(latR), tanB = Math.tan(BR);

    // Elevation: El = atan2(cosLat*cosB - 0.1512, sqrt(1 - (cosLat*cosB)^2))
    const num = cosLat * cosB - 0.1512;
    const denom = Math.sqrt(Math.max(1 - (cosLat*cosB)**2, 1e-12));
    const elDeg = Math.atan2(num, denom) * 180 / Math.PI;

    // Azimuth
    let azBase = Math.atan2(tanB, sinLat) * 180 / Math.PI;
    let azDeg;
    if (lat >= 0) { azDeg = B >= 0 ? 180 - azBase : 180 + Math.abs(azBase); }
    else { azDeg = B >= 0 ? azBase : 360 - Math.abs(azBase); }
    azDeg = ((azDeg % 360) + 360) % 360;

    document.getElementById('laResult').textContent =
        'El=' + elDeg.toFixed(2) + '\u00B0  Az=' + azDeg.toFixed(2) + '\u00B0' +
        (elDeg > 5 ? ' \u2713 Visible' : ' \u2717 Low');

    // Auto-fill secant elevation
    document.getElementById('secantEl').value = elDeg.toFixed(2);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE LOADING
// ═══════════════════════════════════════════════════════════════════════════════
document.getElementById('azFile').addEventListener('change', function(e){ loadFile(e,'az'); });
document.getElementById('elFile').addEventListener('change', function(e){ loadFile(e,'el'); });

function isNumeric(s) {
    if (s == null) return false;
    const v = String(s).trim();
    return v !== '' && !isNaN(parseFloat(v)) && isFinite(v);
}

function loadFile(e, cut) {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById(cut+'Fname').textContent = file.name;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
        const reader = new FileReader();
        reader.onload = function(ev) { parseCSV(ev.target.result, cut); };
        reader.readAsText(file);
    } else {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const wb = XLSX.read(ev.target.result, {type:'array'});
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
            parseExcel(data, cut);
        };
        reader.readAsArrayBuffer(file);
    }
}

function parseCSV(text, cut) {
    const lines = text.split(/\r?\n/);
    let headerLine = null;
    const dataLines = [];
    for (const line of lines) {
        const s = line.trim();
        if (!s) continue;
        if (s.startsWith('!') || s.startsWith('#')) {
            const upper = s.toUpperCase();
            if (upper.includes('! DATA') || upper.includes('!DATA')) {
                const parts = s.split(/DATA\s*/i);
                if (parts.length > 1) headerLine = parts[1].trim();
            }
            continue;
        }
        if (s.toUpperCase() === 'BEGIN' || s.toUpperCase() === 'DATA') continue;
        const sep = detectSep(s);
        const firstField = s.split(sep)[0].trim();
        if (isNumeric(firstField)) dataLines.push(s);
    }
    if (!dataLines.length) { alert('No numeric data in CSV.'); return; }
    const sep = detectSep(dataLines[0]);
    const rows = dataLines.map(l => l.split(sep).map(v => v.trim()));
    const nCols = rows[0].length;
    let headers;
    if (headerLine) {
        headers = headerLine.split(sep).map(h => h.trim());
        while (headers.length < nCols) headers.push('Col_'+(headers.length+1));
        headers = headers.slice(0, nCols);
    } else { headers = []; for(let i=0;i<nCols;i++) headers.push('Col_'+(i+1)); }
    const numRows = rows.map(r => r.map(v => parseFloat(v)));
    const keep = [];
    for (let c=0;c<nCols;c++) { if (!numRows.every(r => r[c]===0||isNaN(r[c]))) keep.push(c); }
    fileData[cut] = { columns: keep.map(c=>headers[c]), rows: numRows.map(r=>keep.map(c=>r[c])) };
    populateYSelect(cut, fileData[cut].columns);
    document.getElementById(cut+'Status').textContent = fileData[cut].rows.length+' pts | '+fileData[cut].columns.join(', ');
}

function parseExcel(data, cut) {
    let headerIdx=-1, dataStart=-1;
    for (let i=0;i<data.length;i++) {
        const row=data[i]; if(!row||!row.length) continue;
        if (isNumeric(row[0])) { dataStart=i; break; }
        if (row.some(v=>v!=null&&String(v).trim()!=='')) headerIdx=i;
    }
    if (dataStart<0) { alert('No numeric data in Excel.'); return; }
    const nCols=data[dataStart].length;
    let headers;
    if (headerIdx>=0) { headers=data[headerIdx].map((h,i)=>(h!=null&&String(h).trim())?String(h).trim():'Col_'+(i+1)); }
    else { headers=[]; for(let i=0;i<nCols;i++) headers.push('Col_'+(i+1)); }
    headers=headers.slice(0,nCols); while(headers.length<nCols) headers.push('Col_'+(headers.length+1));
    const numRows=[];
    for (let i=dataStart;i<data.length;i++) { const row=data[i]; if(row&&isNumeric(row[0])) numRows.push(row.map(v=>parseFloat(v))); }
    const keep=[];
    for (let c=0;c<nCols;c++) { if(!numRows.every(r=>r[c]===0||isNaN(r[c]))) keep.push(c); }
    fileData[cut]={columns:keep.map(c=>headers[c]),rows:numRows.map(r=>keep.map(c=>r[c]))};
    populateYSelect(cut,fileData[cut].columns);
    document.getElementById(cut+'Status').textContent=fileData[cut].rows.length+' pts | '+fileData[cut].columns.join(', ');
}

function detectSep(line) {
    const c=(line.match(/,/g)||[]).length, t=(line.match(/\t/g)||[]).length, s=(line.match(/;/g)||[]).length;
    if(t>c&&t>s) return '\t'; if(s>c) return ';'; return ',';
}
function populateYSelect(cut, headers) {
    const sel=document.getElementById(cut+'YCol'); sel.innerHTML='';
    headers.forEach((h,i)=>{sel.innerHTML+='<option value="'+i+'">'+h+'</option>';});
    if(headers.length>1) sel.selectedIndex=1;
}


// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function generateX(sw, n) { const x=[]; for(let i=0;i<n;i++) x.push(-sw/2+i*sw/(n-1)); return x; }

function findCrossing(xS, yS, t) {
    for(let i=0;i<yS.length-1;i++) { if(yS[i]>=t&&yS[i+1]<t) { const dy=yS[i+1]-yS[i]; if(!dy) continue; return xS[i]+(t-yS[i])/dy*(xS[i+1]-xS[i]); } }
    return null;
}

function findFirstDipAndPeak(xS, yS, sa) {
    let si=1; for(let k=0;k<xS.length;k++){if(Math.abs(xS[k])>=sa){si=Math.max(k,1);break;}}
    let di=null,dy=null,pi=null,py=null;
    let rmi=si,rmv=yS[si];
    for(let k=si+1;k<yS.length;k++){if(yS[k]<rmv){rmv=yS[k];rmi=k;}else if(yS[k]-rmv>1){di=rmi;dy=rmv;break;}}
    if(di===null) return{dipIdx:null,dipY:null,peakIdx:null,peakY:null};
    let rxi=Math.min(di+1,yS.length-1),rxv=yS[rxi];
    for(let m=di+1;m<yS.length;m++){if(yS[m]>rxv){rxv=yS[m];rxi=m;}else if(rxv-yS[m]>1){pi=rxi;py=rxv;break;}}
    return{dipIdx:di,dipY:dy,peakIdx:pi,peakY:py};
}

function patternIntegrationGain(theta, dbN) {
    const n=theta.length; if(n<3) return null;
    const M=dbN.map(d=>Math.pow(10,Math.max(Math.min(d,0),-200)/10));
    let Os=0;
    for(let i=1;i<n;i++){const dt=(theta[i]-theta[i-1])*Math.PI/180;Os+=(M[i-1]+M[i])/2*dt*Math.abs(Math.sin(theta[i]*Math.PI/180));}
    return Os>0?10*Math.log10(4/Os):null;
}

function ituEnvelope(phi, G0, D, f, formula) {
    const K=formula==='S.580'?32:29, lam=0.3/f, pMin=Math.max(1,20*lam/D);
    const env=phi.map(p=>{if(p<pMin)return NaN;let G=p<=48?K-25*Math.log10(p):-10;return G-G0;});
    return{env,phiMin:pMin};
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLOT
// ═══════════════════════════════════════════════════════════════════════════════
function plotCut(cut) {
    const data=fileData[cut];
    if(!data){alert('Load '+cut.toUpperCase()+' file first.');return;}
    const yCI=parseInt(document.getElementById(cut+'YCol').value);
    const useGX=document.getElementById('useGenX').checked;
    const sw=cut==='az'?parseFloat(document.getElementById('azSweep').value)||9:parseFloat(document.getElementById('elSweep').value)||9;

    const yRaw=data.rows.map(r=>r[yCI]).filter(v=>!isNaN(v));
    const nP=yRaw.length; if(nP<10){alert('Not enough data.');return;}
    const yMax=Math.max(...yRaw), yN=yRaw.map(v=>v-yMax);

    let xA=useGX?generateX(sw,nP):data.rows.map(r=>r[0]).filter(v=>!isNaN(v));
    if(!useGX&&xA.length!==nP){alert('X/Y mismatch.');return;}

    // Secant (AZ only)
    const doSec=document.getElementById('showSecant').checked&&cut==='az';
    let secNote='';
    if(doSec){const el=parseFloat(document.getElementById('secantEl').value)||0;const c=Math.cos(el*Math.PI/180);xA=xA.map(v=>v*c);secNote=' [sec El='+el+'deg x'+c.toFixed(4)+']';}
    else if(cut==='el') secNote=' [no secant]';

    const pI=yN.indexOf(0),xO=xA[pI],xAl=xA.map(v=>v-xO);

    // Split sides
    const rX=[],rY=[],lP=[];
    for(let i=0;i<xAl.length;i++){if(xAl[i]>=0){rX.push(xAl[i]);rY.push(yN[i]);}if(xAl[i]<=0)lP.push({x:-xAl[i],y:yN[i]});}
    lP.sort((a,b)=>a.x-b.x); const lXs=lP.map(p=>p.x),lYs=lP.map(p=>p.y);

    const x3r=findCrossing(rX,rY,-3),x3l=findCrossing(lXs,lYs,-3);
    const x10r=findCrossing(rX,rY,-10),x10l=findCrossing(lXs,lYs,-10);
    let bw3=null,bw10=null;
    if(x3r!==null&&x3l!==null)bw3=x3r+x3l;else if(x3r!==null)bw3=2*x3r;else if(x3l!==null)bw3=2*x3l;
    if(x10r!==null&&x10l!==null)bw10=x10r+x10l;else if(x10r!==null)bw10=2*x10r;else if(x10l!==null)bw10=2*x10l;
    const g3=bw3?10*Math.log10(31000/(bw3*bw3)):null;
    const g10=bw10?10*Math.log10(91000/(bw10*bw10)):null;
    const gInt=patternIntegrationGain(xAl,yN);
    const hBW=bw3?bw3/2:0.5;
    const rR=findFirstDipAndPeak(rX,rY,hBW),lR=findFirstDipAndPeak(lXs,lYs,hBW);
    const rDX=rR.dipIdx!==null?rX[rR.dipIdx]:null,rDY=rR.dipY;
    const rPX=rR.peakIdx!==null?rX[rR.peakIdx]:null,rPY=rR.peakY;
    const lDX=lR.dipIdx!==null?-lXs[lR.dipIdx]:null,lDY=lR.dipY;
    const lPX=lR.peakIdx!==null?-lXs[lR.peakIdx]:null,lPY=lR.peakY;

    bwCache[cut]={bw3,bw10,gInt,slR:rPY,slL:lPY};

    // Plotly
    const tr=[],sh=[],an=[];
    tr.push({x:xAl,y:yN,mode:'lines',name:'Pattern',line:{color:'#1565C0',width:1.5}});
    const yMin=Math.min(...yN);
    const s3=document.getElementById('show3db').checked;
    const s10=document.getElementById('show10db').checked;
    const sD=document.getElementById('showDip').checked;
    const sS=document.getElementById('showSL').checked;
    const sI=document.getElementById('showITU').checked;

    if(s3&&bw3){sh.push({type:'line',y0:-3,y1:-3,x0:xAl[0],x1:xAl[nP-1],line:{color:'green',width:1,dash:'dot'}});
        if(x3r!==null){sh.push({type:'line',x0:x3r,x1:x3r,y0:yMin,y1:0,line:{color:'green',width:1,dash:'dot'}});an.push({x:x3r,y:-3,text:'-3dB R:+'+x3r.toFixed(4)+'\u00B0',showarrow:true,arrowcolor:'green',font:{size:9,color:'green'},ax:20,ay:-20});}
        if(x3l!==null){sh.push({type:'line',x0:-x3l,x1:-x3l,y0:yMin,y1:0,line:{color:'green',width:1,dash:'dot'}});an.push({x:-x3l,y:-3,text:'-3dB L:'+(-x3l).toFixed(4)+'\u00B0',showarrow:true,arrowcolor:'green',font:{size:9,color:'green'},ax:-20,ay:-20});}}
    if(s10&&bw10){sh.push({type:'line',y0:-10,y1:-10,x0:xAl[0],x1:xAl[nP-1],line:{color:'purple',width:1,dash:'dot'}});
        if(x10r!==null){sh.push({type:'line',x0:x10r,x1:x10r,y0:yMin,y1:0,line:{color:'purple',width:1,dash:'dot'}});an.push({x:x10r,y:-10,text:'-10dB R:+'+x10r.toFixed(4)+'\u00B0',showarrow:true,arrowcolor:'purple',font:{size:9,color:'purple'},ax:20,ay:-20});}
        if(x10l!==null){sh.push({type:'line',x0:-x10l,x1:-x10l,y0:yMin,y1:0,line:{color:'purple',width:1,dash:'dot'}});an.push({x:-x10l,y:-10,text:'-10dB L:'+(-x10l).toFixed(4)+'\u00B0',showarrow:true,arrowcolor:'purple',font:{size:9,color:'purple'},ax:-20,ay:-20});}}
    if(sD){
        if(rDX!==null){tr.push({x:[rDX],y:[rDY],mode:'markers',marker:{color:'#E65100',size:9,symbol:'triangle-down'},showlegend:false});an.push({x:rDX,y:rDY,text:'Dip R '+rDX.toFixed(3)+'\u00B0 '+rDY.toFixed(2)+'dB',showarrow:true,arrowcolor:'#E65100',font:{size:9,color:'#E65100'},ax:35,ay:20});}
        if(lDX!==null){tr.push({x:[lDX],y:[lDY],mode:'markers',marker:{color:'#E65100',size:9,symbol:'triangle-down'},showlegend:false});an.push({x:lDX,y:lDY,text:'Dip L '+lDX.toFixed(3)+'\u00B0 '+lDY.toFixed(2)+'dB',showarrow:true,arrowcolor:'#E65100',font:{size:9,color:'#E65100'},ax:-35,ay:20});}}
    if(sS){
        if(rPX!==null){tr.push({x:[rPX],y:[rPY],mode:'markers',marker:{color:'#1A237E',size:9,symbol:'triangle-up'},showlegend:false});an.push({x:rPX,y:rPY,text:'SL R '+rPX.toFixed(3)+'\u00B0 '+rPY.toFixed(2)+'dB',showarrow:true,arrowcolor:'#1A237E',font:{size:9,color:'#1A237E'},ax:35,ay:-20});}
        if(lPX!==null){tr.push({x:[lPX],y:[lPY],mode:'markers',marker:{color:'#1A237E',size:9,symbol:'triangle-up'},showlegend:false});an.push({x:lPX,y:lPY,text:'SL L '+lPX.toFixed(3)+'\u00B0 '+lPY.toFixed(2)+'dB',showarrow:true,arrowcolor:'#1A237E',font:{size:9,color:'#1A237E'},ax:-35,ay:-20});}}

    // ITU + percentage cut
    let totalRip=0,cutRip=0,pctCut=0;
    if(sI){
        const Dm=parseFloat(document.getElementById('ituD').value)||7.6;
        const fG=parseFloat(document.getElementById('ituF').value)||12;
        let G0=parseFloat(document.getElementById('ituG0').value);const fm=document.getElementById('ituFormula').value;
        const rv=parseFloat(document.getElementById('ituRange').value);
        if(!G0||G0===0) G0=g3||45;
        const xMA=rv>0?rv:Math.max(Math.abs(xAl[0]),Math.abs(xAl[nP-1]));
        const phi=[];for(let i=0;i<2000;i++)phi.push(0.01+i*xMA/2000);
        const{env,phiMin}=ituEnvelope(phi,G0,Dm,fG,fm);
        const clr=fm==='S.580'?'red':'darkorange';
        tr.push({x:phi,y:env,mode:'lines',name:'ITU '+fm,line:{color:clr,width:1.5,dash:'dash'}});
        tr.push({x:phi.map(v=>-v),y:env,mode:'lines',showlegend:false,line:{color:clr,width:1.5,dash:'dash'}});
        // % cut
        const K=fm==='S.580'?32:29;
        for(let i=1;i<yN.length-1;i++){const xi=Math.abs(xAl[i]);if(xi<=hBW||xi>xMA)continue;
            if(yN[i]>yN[i-1]&&yN[i]>yN[i+1]){totalRip++;if(xi>=phiMin){const ev=xi<=48?(K-25*Math.log10(xi))-G0:-10-G0;if(yN[i]>ev)cutRip++;}}}
        pctCut=totalRip>0?(100*cutRip/totalRip).toFixed(1):0;
    }
    bwCache[cut].ripples=totalRip;bwCache[cut].cutRip=cutRip;bwCache[cut].pctCut=pctCut;

    // Grid
    const xGS=parseFloat(document.getElementById('xGrid').value)||1;
    const yGS=parseFloat(document.getElementById('yGrid').value)||5;
    const xLo=Math.min(...xAl),xHi=Math.max(...xAl);
    const xT=[];for(let v=0;v>=xLo;v-=xGS)xT.push(v);for(let v=xGS;v<=xHi;v+=xGS)xT.push(v);
    const yT=[];for(let v=0;v>=yMin*1.05;v-=yGS)yT.push(v);

    const cL=cut==='az'?'Azimuth':'Elevation';
    Plotly.newPlot(cut+'Plot',tr,{
        title:{text:cL+' Pattern'+secNote,font:{size:13}},
        xaxis:{title:'Angle (\u00B0)',zeroline:true,gridcolor:'#ddd',tickvals:xT,griddash:'dot'},
        yaxis:{title:'dB',range:[yMin*1.05,1],gridcolor:'#ddd',tickvals:yT,griddash:'dot'},
        shapes:sh,annotations:an,margin:{t:40,b:45,l:55,r:20},
        hovermode:'x unified',showlegend:true,legend:{x:1,y:1,xanchor:'right',font:{size:10}}
    },{responsive:true});

    // Results
    let r=cL+' | '+nP+' pts | Peak:'+yMax.toFixed(2)+' dBm\n'+'-'.repeat(45)+'\n';
    r+='3dB BW: '+(bw3?bw3.toFixed(4)+'\u00B0':'N/A')+(x3r!==null?' (R:+'+x3r.toFixed(4):'')+(x3l!==null?' L:-'+x3l.toFixed(4)+'\u00B0)':'')+'\n';
    r+='10dB BW: '+(bw10?bw10.toFixed(4)+'\u00B0':'N/A')+(x10r!==null?' (R:+'+x10r.toFixed(4):'')+(x10l!==null?' L:-'+x10l.toFixed(4)+'\u00B0)':'')+'\n';
    r+='Gain(3dB): '+(g3?g3.toFixed(2)+' dBi':'N/A')+' | Gain(10dB): '+(g10?g10.toFixed(2)+' dBi':'N/A')+'\n';
    r+='Pattern Integration: '+(gInt!==null?gInt.toFixed(2)+' dBi':'N/A')+'\n';
    r+='-'.repeat(45)+'\n';
    r+='Dip R: '+(rDX!==null?rDX.toFixed(3)+'\u00B0/'+rDY.toFixed(2)+'dB':'N/A')+' | SL R: '+(rPX!==null?rPX.toFixed(3)+'\u00B0/'+rPY.toFixed(2)+'dB':'N/A')+'\n';
    r+='Dip L: '+(lDX!==null?lDX.toFixed(3)+'\u00B0/'+lDY.toFixed(2)+'dB':'N/A')+' | SL L: '+(lPX!==null?lPX.toFixed(3)+'\u00B0/'+lPY.toFixed(2)+'dB':'N/A')+'\n';
    if(sI) r+='-'.repeat(45)+'\nRipples:'+totalRip+' | ITU Cut:'+cutRip+' | %Cut:'+pctCut+'%\n';
    document.getElementById(cut+'Results').textContent=r;
    updateCombinedGain();
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMBINED GAIN
// ═══════════════════════════════════════════════════════════════════════════════
function updateCombinedGain() {
    const k3=31000,k10=91000;
    const az3=bwCache.az.bw3,az10=bwCache.az.bw10,el3=bwCache.el.bw3,el10=bwCache.el.bw10;
    const azGi=bwCache.az.gInt,elGi=bwCache.el.gInt;
    let r='='.repeat(50)+'\n  GAIN FROM BEAMWIDTH\n'+'-'.repeat(50)+'\n';
    let gBW=null;
    if(az3&&az10&&el3&&el10){const t3=k3/(az3*el3),t10=k10/(az10*el10);gBW=10*Math.log10((t3+t10)/2);
        r+='  Combined: G=10*log((31000/(BW3az*BW3el)+91000/(BW10az*BW10el))/2)\n';
        r+='  BW3az='+az3.toFixed(4)+' BW10az='+az10.toFixed(4)+' BW3el='+el3.toFixed(4)+' BW10el='+el10.toFixed(4)+'\n';
        r+='  -> G = '+gBW.toFixed(2)+' dBi\n';}
    else{if(az3&&az10){const g=10*Math.log10((k3/(az3*az3)+k10/(az10*az10))/2);gBW=g;r+='  AZ only: '+g.toFixed(2)+' dBi\n';}
        if(el3&&el10){const g=10*Math.log10((k3/(el3*el3)+k10/(el10*el10))/2);if(!gBW)gBW=g;r+='  EL only: '+g.toFixed(2)+' dBi\n';}}
    r+='-'.repeat(50)+'\n  PATTERN INTEGRATION\n';
    r+='  AZ: '+(azGi!==null?azGi.toFixed(2)+' dBi':'N/A')+' | EL: '+(elGi!==null?elGi.toFixed(2)+' dBi':'N/A')+'\n';
    // Theoretical
    const Dm=parseFloat(document.getElementById('ituD').value)||0,fG=parseFloat(document.getElementById('ituF').value)||0;
    if(Dm>0&&fG>0){const lam=0.2998/fG,gT=20*Math.log10(Math.PI*Dm/lam);
        r+='-'.repeat(50)+'\n  THEORETICAL GAIN\n  G_theo=20*log(pi*D/lambda) = '+gT.toFixed(2)+' dBi  (D='+Dm+'m lambda='+(lam*1000).toFixed(2)+'mm)\n';
        if(gBW){const eff=Math.pow(10,(gBW-gT)/10)*100;r+='  Efficiency: '+eff.toFixed(2)+'%  (G_meas='+gBW.toFixed(2)+' dBi)\n';}}
    // % cut summary
    r+='-'.repeat(50)+'\n  SIDELOBE % CUT\n';
    r+='  AZ: '+(bwCache.az.ripples!==undefined?'Ripples='+bwCache.az.ripples+' Cut='+bwCache.az.cutRip+' ('+bwCache.az.pctCut+'%)':'N/A')+'\n';
    r+='  EL: '+(bwCache.el.ripples!==undefined?'Ripples='+bwCache.el.ripples+' Cut='+bwCache.el.cutRip+' ('+bwCache.el.pctCut+'%)':'N/A')+'\n';
    r+='='.repeat(50)+'\n';
    document.getElementById('combinedResults').textContent=r;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBREFLECTOR
// ═══════════════════════════════════════════════════════════════════════════════
const SR_GAUGE={'Ka':1.20,'Ku':0.90,'C':0.35,'Ex C':0.20};

function autofillSR() {
    if(bwCache.az.slL!=null) document.getElementById('srAzL').value=Math.abs(bwCache.az.slL).toFixed(2);
    if(bwCache.az.slR!=null) document.getElementById('srAzR').value=Math.abs(bwCache.az.slR).toFixed(2);
    if(bwCache.el.slL!=null) document.getElementById('srElL').value=Math.abs(bwCache.el.slL).toFixed(2);
    if(bwCache.el.slR!=null) document.getElementById('srElR').value=Math.abs(bwCache.el.slR).toFixed(2);
}

function calcSubreflector() {
    const azL=parseFloat(document.getElementById('srAzL').value);
    const azR=parseFloat(document.getElementById('srAzR').value);
    const elL=parseFloat(document.getElementById('srElL').value);
    const elR=parseFloat(document.getElementById('srElR').value);
    if(isNaN(azL)||isNaN(azR)||isNaN(elL)||isNaN(elR)){alert('Enter all 4 values.');return;}
    const band=document.getElementById('srBand').value;
    const stype=document.getElementById('srType').value;
    const gauge=SR_GAUGE[band]; if(!gauge){alert('Unknown band.');return;}
    const isConvex=stype==='Convex';
    const azDiff=azL-azR, elDiff=elL-elR;
    const rawAz=Math.abs(azDiff)/8, rawEl=Math.abs(elDiff)/2;
    const large=rawEl-rawAz, small=rawAz;
    const sameSign=(azDiff>=0)===(elDiff>=0);
    const raw8=sameSign?small:large, raw4=sameSign?large:small;
    const val12=Math.abs(elDiff/2/gauge), val8=Math.abs(raw8/gauge), val4=Math.abs(raw4/gauge);
    let dir12,dir8,dir4;
    if(isConvex){dir12=elDiff<0?'FLATS DOWN':'FLATS UP';dir8=elDiff<0?'FLATS UP':'FLATS DOWN';dir4=elDiff<0?'FLATS UP':'FLATS DOWN';}
    else{dir12=elDiff<0?'FLATS UP':'FLATS DOWN';dir8=elDiff<0?'FLATS DOWN':'FLATS UP';dir4=elDiff<0?'FLATS DOWN':'FLATS UP';}

    // Render cards
    const cards=document.getElementById('srCards');
    cards.innerHTML='';
    [["12 O'CLOCK",val12,dir12],["8 O'CLOCK",val8,dir8],["4 O'CLOCK",val4,dir4]].forEach(([pos,val,dir])=>{
        const dc=dir.includes('UP')?'dir-up':'dir-down';
        cards.innerHTML+='<div class="sr-card"><div class="pos">'+pos+'</div><div class="val">'+val.toFixed(4)+'</div><div>turns</div><div class="dir '+dc+'">'+dir+'</div></div>';
    });

    // Detail (hidden until Show Formulae)
    let d='Band='+band+' | Type='+stype+' | Gauge='+gauge+'\n';
    d+='AZ diff(L-R)='+azL+'-'+azR+'='+azDiff.toFixed(4)+'\n';
    d+='EL diff(L-R)='+elL+'-'+elR+'='+elDiff.toFixed(4)+'\n';
    d+='-'.repeat(40)+'\n';
    d+='raw_12 = EL_diff/2 = '+(elDiff/2).toFixed(4)+'\n';
    d+='raw_az = |AZ_diff|/8 = '+rawAz.toFixed(4)+'\n';
    d+='raw_el = |EL_diff|/2 = '+rawEl.toFixed(4)+'\n';
    d+='Same sign: '+(sameSign?'Yes':'No')+' -> 8='+(sameSign?'small':'large')+', 4='+(sameSign?'large':'small')+'\n';
    d+='val = |raw| / gauge('+gauge+')\n';
    d+='12='+val12.toFixed(6)+' 8='+val8.toFixed(6)+' 4='+val4.toFixed(6)+'\n';
    document.getElementById('srDetail').textContent=d;
}

function toggleFormulae() {
    const el=document.getElementById('srFormulae');
    el.classList.toggle('hidden');
}


// ═══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pw = 210, ph = 297, margin = 12;
    const cw = pw - 2*margin;
    let y = margin;

    // Helper: add text block
    function addText(text, size, bold, color) {
        pdf.setFontSize(size || 10);
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        if (color) pdf.setTextColor(...color); else pdf.setTextColor(0,0,0);
        const lines = pdf.splitTextToSize(text, cw);
        if (y + lines.length * (size*0.4) > ph - margin) { pdf.addPage(); y = margin; }
        pdf.text(lines, margin, y);
        y += lines.length * (size * 0.45) + 2;
    }

    function addLine() {
        pdf.setDrawColor(180); pdf.line(margin, y, pw-margin, y); y += 3;
    }

    // Title
    addText('PATTERN ANALYSER REPORT', 16, true, [21,101,192]);
    addText('Date: ' + new Date().toLocaleDateString() + '  ' + new Date().toLocaleTimeString(), 9, false, [100,100,100]);
    addLine();

    // Project info
    addText('PROJECT INFORMATION', 11, true, [21,101,192]);
    addText('Engineer: ' + (document.getElementById('engineer').value || 'N/A'), 10);
    addText('Customer: ' + (document.getElementById('customer').value || 'N/A'), 10);
    addText('Site: ' + (document.getElementById('siteAddr').value || 'N/A'), 10);
    addText('Satellite: ' + (document.getElementById('satName').value || 'N/A'), 10);
    addLine();

    // Settings
    addText('SETTINGS', 11, true, [21,101,192]);
    const azSw = document.getElementById('azSweep').value;
    const elSw = document.getElementById('elSweep').value;
    const Dm = document.getElementById('ituD').value;
    const fG = document.getElementById('ituF').value;
    addText('AZ Sweep: '+azSw+' deg  |  EL Sweep: '+elSw+' deg  |  D: '+Dm+'m  |  Freq: '+fG+' GHz', 9);
    addLine();

    // AZ Plot
    const azPlotEl = document.getElementById('azPlot');
    if (azPlotEl && azPlotEl.querySelector('.plot-container')) {
        addText('AZIMUTH PATTERN', 11, true, [21,101,192]);
        try {
            const azImg = await Plotly.toImage(azPlotEl, {format:'png', width:900, height:400});
            if (y + 70 > ph - margin) { pdf.addPage(); y = margin; }
            pdf.addImage(azImg, 'PNG', margin, y, cw, cw*400/900);
            y += cw*400/900 + 4;
        } catch(e) {}
    }

    // AZ Results
    const azRes = document.getElementById('azResults').textContent;
    if (azRes && !azRes.startsWith('Load')) {
        pdf.setFontSize(8); pdf.setFont('courier','normal'); pdf.setTextColor(0,0,0);
        const azLines = pdf.splitTextToSize(azRes, cw);
        if (y + azLines.length*3 > ph-margin) { pdf.addPage(); y=margin; }
        pdf.text(azLines, margin, y); y += azLines.length*3 + 4;
    }
    addLine();

    // EL Plot
    const elPlotEl = document.getElementById('elPlot');
    if (elPlotEl && elPlotEl.querySelector('.plot-container')) {
        if (y + 80 > ph - margin) { pdf.addPage(); y = margin; }
        addText('ELEVATION PATTERN', 11, true, [21,101,192]);
        try {
            const elImg = await Plotly.toImage(elPlotEl, {format:'png', width:900, height:400});
            if (y + 70 > ph - margin) { pdf.addPage(); y = margin; }
            pdf.addImage(elImg, 'PNG', margin, y, cw, cw*400/900);
            y += cw*400/900 + 4;
        } catch(e) {}
    }

    // EL Results
    const elRes = document.getElementById('elResults').textContent;
    if (elRes && !elRes.startsWith('Load')) {
        pdf.setFontSize(8); pdf.setFont('courier','normal'); pdf.setTextColor(0,0,0);
        const elLines = pdf.splitTextToSize(elRes, cw);
        if (y + elLines.length*3 > ph-margin) { pdf.addPage(); y=margin; }
        pdf.text(elLines, margin, y); y += elLines.length*3 + 4;
    }
    addLine();

    // Combined Gain
    if (y + 40 > ph - margin) { pdf.addPage(); y = margin; }
    addText('GAIN CALCULATIONS', 11, true, [21,101,192]);
    const gainRes = document.getElementById('combinedResults').textContent;
    if (gainRes && !gainRes.startsWith('Plot')) {
        pdf.setFontSize(8); pdf.setFont('courier','normal'); pdf.setTextColor(0,0,0);
        const gLines = pdf.splitTextToSize(gainRes, cw);
        if (y + gLines.length*3 > ph-margin) { pdf.addPage(); y=margin; }
        pdf.text(gLines, margin, y); y += gLines.length*3 + 4;
    }
    addLine();

    // Subreflector
    const srCards = document.getElementById('srCards').innerHTML;
    if (srCards) {
        if (y + 30 > ph - margin) { pdf.addPage(); y = margin; }
        addText('SUBREFLECTOR ADJUSTMENT', 11, true, [21,101,192]);
        const srDetail = document.getElementById('srDetail').textContent;
        if (srDetail) {
            pdf.setFontSize(8); pdf.setFont('courier','normal'); pdf.setTextColor(0,0,0);
            const sLines = pdf.splitTextToSize(srDetail, cw);
            if (y + sLines.length*3 > ph-margin) { pdf.addPage(); y=margin; }
            pdf.text(sLines, margin, y); y += sLines.length*3 + 4;
        }
    }

    // Save
    const fname = (document.getElementById('customer').value || 'Pattern') + '_Report_' +
                  new Date().toISOString().slice(0,10) + '.pdf';
    pdf.save(fname);
}
