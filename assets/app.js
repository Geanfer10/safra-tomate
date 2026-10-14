const ico={
 foto:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/></svg>',
 clip:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 11l-8.5 8.5a5 5 0 01-7-7L14 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L15 7"/></svg>',
 doc:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/></svg>'
};
const DEPTS={"Mecânica":"--mec","Elétrica":"--ele","Automação":"--aut","Civil":"--civ"};
const STATUS_COR={"Não iniciado":"--gray","Em andamento":"--warn","Aguardando material":"--aut","Atrasado":"--bad","Concluído":"--ok","Cancelado":"--gray"};
// Dados de EXEMPLO: usados só quando não existe data/dados.enc.json (pré-visualização local).
// Os dados reais nunca ficam no repositório em texto aberto: chegam criptografados pela automação.
const EXEMPLO_BASE=[
 {id:1,nome:"Revisão geral das bombas de polpa",dept:"Mecânica",safra:"2027",status:"Não iniciado",prioridade:"Crítica",tipo:"Serviço interno",area:"Linha de extração",ini:"2027-02-01",fim:"2027-03-15",prev:18000,real:null,compra:"Sem compra"},
 {id:2,nome:"Troca de rolamentos e selos do triturador",dept:"Mecânica",safra:"2027",status:"Não iniciado",prioridade:"Alta",tipo:"Aquisição",area:"Recepção / triturador",ini:"2027-01-15",fim:"2027-02-28",prev:32000,real:null,compra:"Em cotação"},,
 {id:4,nome:"Revisão dos painéis e CCMs da linha de extração",dept:"Elétrica",safra:"2027",status:"Não iniciado",prioridade:"Crítica",tipo:"Serviço interno",area:"Linha de extração",ini:"2027-02-01",fim:"2027-03-01",prev:12000,real:null,compra:"Sem compra"},
 {id:5,nome:"Aquisição de motores reserva (estoque de safra)",dept:"Elétrica",safra:"2027",status:"Em andamento",prioridade:"Alta",tipo:"Aquisição",area:"Almoxarifado",ini:"2026-11-01",fim:"2027-01-31",prev:60000,real:null,compra:"RC aberta"},,
 {id:7,nome:"Calibração de instrumentos (temperatura/pressão/Brix)",dept:"Automação",safra:"2027",status:"Não iniciado",prioridade:"Crítica",tipo:"Serviço terceirizado",area:"Evaporadores / esterilizador",ini:"2027-03-01",fim:"2027-03-31",prev:15000,real:null,compra:"Em cotação"},
 {id:8,nome:"Backup e atualização dos programas de CLP/IHM",dept:"Automação",safra:"2027",status:"Não iniciado",prioridade:"Alta",tipo:"Serviço interno",area:"Linha de extração",ini:"2027-01-10",fim:"2027-02-10",prev:0,real:null,compra:"Sem compra"},
 {id:9,nome:"Recuperação de piso da área de recepção",dept:"Civil",safra:"2027",status:"Não iniciado",prioridade:"Alta",tipo:"Serviço terceirizado",area:"Pátio de recepção",ini:"2026-12-01",fim:"2027-02-15",prev:85000,real:null,compra:"Em cotação"},
];
// Foto ilustrativa (no painel real vem da coluna "Foto do local" do Monday)
const fotoEx=(txt,cor)=>"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd9d3"/><stop offset="1" stop-color="#8fa398"/></linearGradient></defs><rect width="640" height="400" fill="url(#g)"/><rect y="250" width="640" height="150" fill="#6d7f74"/><rect x="70" y="140" width="220" height="130" rx="6" fill="${cor}" opacity=".85"/><rect x="330" y="170" width="240" height="100" rx="6" fill="#55665c"/><circle cx="180" cy="205" r="34" fill="#e9efe9" opacity=".7"/><text x="320" y="370" text-anchor="middle" font-family="Arial" font-size="22" fill="#fff">${txt}</text></svg>`);
const EXTRAS={
 1:{os:"OS-2027-0004",fotos:[{nome:"Bomba de polpa – estado atual",url:fotoEx("Foto de exemplo · bomba de polpa","#1E9350")}]},
 2:{orcamentos:[{nome:"Orçamento Fornecedor A.pdf",url:"#"},{nome:"Orçamento Fornecedor B.pdf",url:"#"}]},
 5:{os:"OS-2026-0311",orcamentos:[{nome:"Cotação motores WEG.pdf",url:"#"},{nome:"Cotação motores distribuidor.pdf",url:"#"},{nome:"Mapa comparativo.xlsx",url:"#"}]},
 7:{orcamentos:[{nome:"Proposta laboratório de calibração.pdf",url:"#"}]},
 9:{fotos:[{nome:"Piso da recepção",url:fotoEx("Foto de exemplo · piso da recepção","#8A6A4F")}],orcamentos:[{nome:"Orçamento recuperação de piso.pdf",url:"#"}]},
};
const EXEMPLO=EXEMPLO_BASE.map(d=>Object.assign({},d,EXTRAS[d.id]||{}));
let DADOS=[];
const HOJE=new Date(); HOJE.setHours(0,0,0,0);
const st={safra:null,kpi:"todas",dept:null,foco:null};
const brl=v=>v==null?"—":v.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
const mil=v=>v>=1e6?"R$ "+(v/1e6).toLocaleString("pt-BR",{maximumFractionDigits:1})+" mi":v>=1000?"R$ "+(v/1000).toLocaleString("pt-BR",{maximumFractionDigits:0})+" mil":brl(v);
const dt=s=>s?s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(2,4):"—";
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const efetivo=d=>(d.status!=="Concluído"&&d.status!=="Cancelado"&&d.fim&&new Date(d.fim+"T00:00")<HOJE)?"Atrasado":d.status;
const ehPrio=d=>d.prioridade==="Crítica"||d.prioridade==="Alta";
const aberta=d=>d.status!=="Concluído"&&d.status!=="Cancelado";
const sum=(a,f)=>a.reduce((s,x)=>s+(f(x)||0),0);
const diasAte=s=>Math.round((new Date(s+"T00:00")-HOJE)/864e5);
const safras=()=>[...new Set(DADOS.map(d=>d.safra))].sort();

// Indicadores clicáveis: cada um filtra a lista de atividades
const KPIS=[
 {id:"todas",l:"Atividades",k:"--brand",f:()=>true},
 {id:"concluidas",l:"Concluídas",k:"--ok",f:d=>d.status==="Concluído"},
 {id:"andamento",l:"Em andamento",k:"--warn",f:d=>d.status==="Em andamento"||d.status==="Aguardando material"},
 {id:"atrasadas",l:"Atrasadas",k:"--bad",f:d=>efetivo(d)==="Atrasado"},
 {id:"prioridade",l:"Prioridade alta",k:"--tomato",f:d=>ehPrio(d)&&aberta(d)},
 {id:"aquisicoes",l:"Aquisições",k:"--ele",f:d=>d.tipo==="Aquisição"},
 {id:"orcamento",l:"Orçamento",k:"--gold",f:d=>(d.prev||0)>0}
];

function render(){
  const L=DADOS.filter(d=>d.safra===st.safra);
  document.getElementById("hoje").textContent=HOJE.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});
  const S=safras(), sel=document.getElementById("safras");
  // Com uma safra só não há o que escolher: mostra só o rótulo; o seletor volta quando entrar a próxima safra
  sel.innerHTML=S.length>1?S.map(s=>`<button type="button" data-s="${s}" aria-pressed="${s===st.safra}">Safra ${s}</button>`).join(""):`<button type="button" aria-pressed="true" tabindex="-1" style="cursor:default">Safra ${st.safra}</button>`;
  document.querySelector(".lbl-mini").hidden=S.length<2;
  faixa(L); kpis(L); depts(L); historico(); tabela(L);
}

function faixa(L){
  const itens=L.filter(d=>ehPrio(d)&&aberta(d)).sort((a,b)=>(a.prioridade==="Crítica"?0:1)-(b.prioridade==="Crítica"?0:1)||(a.fim||"").localeCompare(b.fim||""));
  const fita=document.getElementById("fita");
  if(!itens.length){fita.innerHTML=`<span class="item">Nenhuma atividade crítica ou alta em aberto na safra ${st.safra}.</span>`;fita.style.animation="none";return}
  const html=itens.map(d=>{const e=efetivo(d),n=diasAte(d.fim);
    const prazo=!d.fim?"sem prazo definido":e==="Atrasado"?`atrasada ${-n}d`:n<=30?`vence em ${n}d`:`até ${dt(d.fim)}`;
    return `<button type="button" class="item" data-foco="${d.id}"><span class="pri ${d.prioridade==="Alta"?"alta":""}">${esc(d.prioridade)}</span><b>${esc(d.nome)}</b><span class="dep">· ${esc(d.dept)} · ${esc(d.area)}</span><span class="prz">${prazo}</span></button>`}).join("");
  fita.innerHTML=html+html.replace(/<button /g,'<button tabindex="-1" aria-hidden="true" ');
  fita.style.animation="";
  fita.style.setProperty("--dur",Math.max(25,itens.length*9)+"s");
}

function kpis(L){
  const prev=sum(L,d=>d.prev), real=sum(L,d=>d.real), fech=L.filter(d=>d.real!=null), prevF=sum(fech,d=>d.prev);
  const conc=L.filter(KPIS[1].f).length, tot=L.length||1;
  const info={
    todas:[L.length,`${Object.keys(DEPTS).filter(n=>L.some(d=>d.dept===n)).length} departamentos envolvidos`,null],
    concluidas:[conc,`${Math.round(conc/tot*100)}% da safra`,conc/tot],
    andamento:[L.filter(KPIS[2].f).length,"inclui aguardando material",null],
    atrasadas:[L.filter(KPIS[3].f).length,"prazo vencido sem conclusão",null],
    prioridade:[L.filter(KPIS[4].f).length,`${L.filter(d=>d.prioridade==="Crítica"&&aberta(d)).length} críticas em aberto`,null],
    aquisicoes:[L.filter(KPIS[5].f).length,mil(sum(L.filter(KPIS[5].f),d=>d.prev))+" previstos",null],
    orcamento:[mil(prev),fech.length?`realizado ${mil(real)} · ${prevF?((real/prevF)*100).toFixed(0):0}% do previsto fechado`:"nenhum item fechado ainda",prev?Math.min(1,real/prev):0]
  };
  document.getElementById("kpis").innerHTML=KPIS.map(k=>{const [v,d,bar]=info[k.id];
    return `<button type="button" class="kpi" style="--k:var(${k.k})" data-kpi="${k.id}" aria-pressed="${st.kpi===k.id}">
      <span class="l">${k.l}</span><span class="v">${v}</span><span class="d">${d}</span>
      ${bar!=null?`<span class="mini"><span style="width:${(bar*100).toFixed(0)}%"></span></span>`:""}
      <span class="ver">Ver atividades →</span></button>`}).join("");
}

const gid=n=>"g-"+Object.keys(DEPTS).indexOf(n);
function depts(L){
  const tot=sum(L,d=>d.prev)||1;
  document.getElementById("dsub").textContent="Safra "+st.safra+" · "+mil(sum(L,d=>d.prev))+" previstos no total";
  document.getElementById("dcards").innerHTML=Object.entries(DEPTS).map(([n,c])=>{
    const D=L.filter(d=>d.dept===n), p=sum(D,d=>d.prev), r=sum(D,d=>d.real), cc=D.filter(d=>d.status==="Concluído").length;
    const pr=D.filter(d=>ehPrio(d)&&aberta(d)).length, at=D.filter(d=>efetivo(d)==="Atrasado").length;
    const pct=D.length?cc/D.length*100:0;
    const al=(pr?`<span class="al crit">${pr} prioritária${pr>1?"s":""}</span>`:"")+(at?`<span class="al atr">${at} atrasada${at>1?"s":""}</span>`:"")+(!pr&&!at&&D.length?`<span class="al ok">Sem pendências críticas</span>`:"");
    return `<button type="button" class="dcard" style="--c:var(${c})" data-d="${n}">
      <h3>${n}<small>${(p/tot*100).toFixed(0)}% do orçamento</small></h3>
      <div class="linha"><span>Atividades concluídas</span><b>${cc}/${D.length}</b></div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <div class="linha"><span>Previsto</span><b>${brl(p)}</b></div>
      <div class="linha"><span>Realizado</span><b>${brl(r)}</b></div>
      ${al?`<div class="alertas">${al}</div>`:""}
      <span class="ir">Ver atividades de ${n} →</span></button>`}).join("");
}

const resumo=(l,s)=>({s,l,p:sum(l,d=>d.prev),r:sum(l,d=>d.real),n:l.length,c:l.filter(d=>d.status==="Concluído").length});
function historico(){
  const S=safras();
  document.getElementById("hist").innerHTML=linhasHist(S.map(s=>resumo(DADOS.filter(d=>d.safra===s),s)),false);
  // Matriz departamento × safra
  const cab=`<thead><tr><th rowspan="2">Departamento</th>${S.map(s=>`<th class="sf" colspan="3">Safra ${s}</th>`).join("")}${S.length>1?`<th class="r" rowspan="2">Variação ${S[S.length-2]}→${S[S.length-1]}</th>`:""}</tr>
    <tr>${S.map(()=>`<th class="r" style="border-left:1px solid var(--line)">Previsto</th><th class="r">Realizado</th><th class="r">Exec.</th>`).join("")}</tr></thead>`;
  const lin=(nome,cor,filtro,cls)=>{const vs=S.map(s=>resumo(DADOS.filter(d=>d.safra===s&&filtro(d)),s));
    const a=vs[vs.length-2],b=vs[vs.length-1],vr=a&&a.p?((b.p-a.p)/a.p*100):null;
    return `<tr class="${cls||""}"><td class="dep" style="--c:var(${cor})">${cor?"<i></i>":""}${nome}</td>${vs.map(v=>`<td class="r num b">${v.p?mil(v.p):"—"}</td><td class="r num">${v.r?mil(v.r):"—"}</td><td class="r num exe">${v.p&&v.r?(v.r/v.p*100).toFixed(0)+"%":"—"}</td>`).join("")}${S.length>1?`<td class="r">${vr==null?'<span class="badge neu">novo</span>':`<span class="badge ${vr>0?"up":"down"}">${vr>0?"+":""}${vr.toFixed(0)}%</span>`}</td>`:""}</tr>`};
  document.getElementById("matriz").innerHTML=cab+"<tbody>"+Object.entries(DEPTS).map(([n,c])=>lin(n,c,d=>d.dept===n)).join("")+lin("Total","",()=>true,"total")+"</tbody>";
  // Blocos por departamento
  document.getElementById("hdepts").innerHTML=Object.entries(DEPTS).map(([n,c])=>
    `<div class="hdep" style="--c:var(${c})"><h3>${n}</h3>${linhasHist(S.map(s=>resumo(DADOS.filter(d=>d.safra===s&&d.dept===n),s)),true)}</div>`).join("");
}
function linhasHist(V,comLista){
  const S=V.map(v=>v.s), mx=Math.max(1,...V.map(v=>Math.max(v.p,v.r)));
  return V.slice().reverse().map(v=>{
    const i=S.indexOf(v.s), ant=i>0?V[i-1]:null;
    const exec=v.p?v.r/v.p*100:0, varPrev=ant&&ant.p?((v.p-ant.p)/ant.p*100):null, desvio=v.r&&v.p?((v.r-v.p)/v.p*100):null;
    if(!v.n) return `<div class="hrow"><div class="ano">${v.s}<small>Sem atividades</small></div><div class="hnums" style="margin:0;align-self:center">Nenhuma atividade registrada nesta safra.</div></div>`;
    const fase=v.c===v.n?"Encerrada":v.r?"Em execução":"Em preparação";
    const ordem={"Concluído":0,"Em andamento":1,"Aguardando material":2,"Não iniciado":3,"Cancelado":4};
    const lista=comLista?`<details class="lst"><summary>Ver ${v.n} atividade${v.n>1?"s":""} da safra ${v.s}</summary><ul>${v.l.slice().sort((a,b)=>(ordem[a.status]??9)-(ordem[b.status]??9)).map(d=>{const e=efetivo(d);
      return `<li><span><b>${esc(d.nome)}</b> · <span class="muted">${esc(d.area)}</span></span><span class="pill" style="--p:var(${STATUS_COR[e]||"--gray"})">${e}</span>
      <span class="o num">${d.os?esc(d.os)+" · ":""}${d.nfe?esc(d.nfe)+" · ":""}Previsto ${d.prev?brl(d.prev):"—"} · Realizado ${brl(d.real)}${d.obs?` · ${esc(d.obs)}`:""}</span></li>`}).join("")}</ul></details>`:"";
    const bVar=varPrev==null?`<span class="badge neu">1ª safra registrada</span>`:`<span class="badge ${varPrev>0?"up":"down"}">${varPrev>0?"+":""}${varPrev.toFixed(0)}% vs ${ant.s}</span>`;
    const bDes=desvio==null?"":`<span class="badge ${desvio>0?"up":"down"}">${desvio>0?"+":""}${desvio.toFixed(1)}% desvio</span>`;
    return `<div class="hrow ${v.s===st.safra?"sel":""}">
      <div class="ano">${v.s}<small>${fase}</small></div>
      <div>
        <div class="bullet" role="img" aria-label="Safra ${v.s}: previsto ${brl(v.p)}, realizado ${brl(v.r)}">
          <span class="prev" style="width:${v.p/mx*100}%"></span>
          ${v.r?`<span class="real ${v.r>v.p?"acima":""}" style="width:${v.r/mx*100}%"></span>`:""}
        </div>
        <div class="hnums"><span>Previsto <b>${mil(v.p)}</b></span><span>Realizado <b>${v.r?mil(v.r):"—"}</b></span><span>Execução <b>${exec.toFixed(0)}%</b></span><span>Atividades <b>${v.c}/${v.n}</b></span>${bVar}${bDes}</div>
        ${lista}
      </div></div>`}).join("");
}

function tabela(L){
  const K=KPIS.find(k=>k.id===st.kpi);
  const todas=L.filter(K.f);
  const ordP={"Crítica":0,"Alta":1,"Média":2,"Baixa":3};
  const ord=(a,b)=>(aberta(a)?0:1)-(aberta(b)?0:1)||(ordP[a.prioridade]??9)-(ordP[b.prioridade]??9)||(a.fim||"").localeCompare(b.fim||"");
  document.getElementById("ttab").textContent=(st.kpi==="todas"?"Atividades":K.l)+` · ${todas.length}`;
  document.getElementById("filtros").innerHTML=
    `<span class="chip on">${K.l}${st.kpi!=="todas"?` <span data-limpa="kpi" role="button" tabindex="0" aria-label="Remover filtro ${K.l}">✕</span>`:""}</span>`+
    `<span class="sub">Safra ${st.safra}</span>`;
  const linha=d=>{const e=efetivo(d);const pc=d.prioridade==="Crítica"?"crit":d.prioridade==="Alta"?"alta":"";
    const docs=[d.os?`<span class="doc">OS ${esc(d.os.replace(/^OS-?/,""))}</span>`:"",d.nfe?`<span class="doc nf">${esc(d.nfe)}</span>`:"",
      (d.fotos||[]).length?`<span class="doc ft" title="Fotos do local">${ico.foto}${d.fotos.length}</span>`:"",
      (d.orcamentos||[]).length?`<span class="doc oc" title="Orçamentos anexados">${ico.clip}${d.orcamentos.length}</span>`:""].join("");
    return `<tr id="a${d.id}" class="${pc?"pri-"+pc:""} abre" data-abre="${d.id}" tabindex="0">
    <td><b>${esc(d.nome)}</b><div class="muted"><span class="pri-t ${pc==="crit"?"c":pc==="alta"?"a":""}">${esc(d.prioridade)}</span></div></td>
    <td>${esc(d.area)}</td><td>${esc(d.tipo)}</td>
    <td class="num">${dt(d.fim)}<div class="muted">início ${dt(d.ini)}</div></td>
    <td><span class="pill" style="--p:var(${STATUS_COR[e]||"--gray"})">${e}</span></td>
    <td>${esc(d.compra)}</td>
    <td><div class="docs">${docs||'<span class="muted">—</span>'}</div></td>
    <td class="r num">${d.prev?brl(d.prev):"—"}</td><td class="r num">${brl(d.real)}</td></tr>`};
  document.getElementById("grupos").innerHTML=Object.entries(DEPTS).map(([n,c])=>{
    const D=L.filter(d=>d.dept===n), rows=todas.filter(d=>d.dept===n).sort(ord);
    const cc=D.filter(d=>d.status==="Concluído").length;
    return `<div class="grupo ${rows.length?"":"vazio-g"}" id="${gid(n)}" style="--c:var(${c})">
      <div class="grupo-h"><h3>${n}<small>${rows.length} de ${D.length} atividades</small></h3>
        <div class="tot"><span>Concluídas <b>${cc}/${D.length}</b></span><span>Previsto <b>${brl(sum(D,d=>d.prev))}</b></span><span>Realizado <b>${brl(sum(D,d=>d.real))}</b></span></div></div>
      ${rows.length?"":`<div class="sem">Nenhuma atividade de ${n} neste filtro.</div>`}
      <div class="tbl"><table>
        <thead><tr><th>Atividade</th><th>Equipamento / Área</th><th>Tipo</th><th>Prazo</th><th>Status</th><th>Compra</th><th>OS · NF-e · Anexos</th><th class="r">Previsto</th><th class="r">Realizado</th></tr></thead>
        <tbody>${rows.map(linha).join("")}</tbody></table></div></div>`}).join("");
  if(st.foco){const tr=document.getElementById("a"+st.foco);if(tr){tr.classList.add("flash");tr.scrollIntoView({behavior:"smooth",block:"center"})}st.foco=null}
}

let ultimoFoco=null;
function abrir(id){
  const d=DADOS.find(x=>String(x.id)===String(id)); if(!d) return;
  const e=efetivo(d), g=document.getElementById("gaveta");
  g.style.setProperty("--c",`var(${DEPTS[d.dept]})`);
  document.getElementById("gv-dep").textContent=`${d.dept} · Safra ${d.safra}`;
  document.getElementById("gv-tit").textContent=d.nome;
  const campo=(l,v,mono)=>`<div class="gv-campo ${v?"":"vazio"}"><div class="l">${l}</div><div class="v ${mono?"num":""}">${v||"Não informado"}</div></div>`;
  const arq=a=>a.url&&a.url!=="#"?`<li><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${ico.doc}${esc(a.nome)}</a></li>`:`<li><span class="a">${ico.doc}${esc(a.nome)}</span></li>`;
  const fotos=d.fotos||[], orc=d.orcamentos||[];
  document.getElementById("gv-corpo").innerHTML=`
    <div class="gv-grade">
      ${campo("Status",`<span class="pill" style="--p:var(${STATUS_COR[e]||"--gray"})">${e}</span>`)}
      ${campo("Prioridade",esc(d.prioridade))}
      ${campo("Nº Ordem de Serviço",esc(d.os),1)}
      ${campo("Nº NF-e",esc(d.nfe),1)}
      ${campo("Equipamento / Área",esc(d.area))}
      ${campo("Tipo",esc(d.tipo))}
      ${campo("Prazo",d.ini?`${dt(d.ini)} → ${dt(d.fim)}`:"",1)}
      ${campo("Status da compra",esc(d.compra))}
      ${campo("Previsto",d.prev?brl(d.prev):"",1)}
      ${campo("Realizado",d.real!=null?brl(d.real):"",1)}
    </div>
    <div class="gv-sec"><h3>${ico.foto} Fotos do local</h3>${fotos.length?`<div class="fotos">${fotos.map(f=>`<figure><img src="${esc(f.url)}" alt="${esc(f.nome)}" loading="lazy"><figcaption>${esc(f.nome)}</figcaption></figure>`).join("")}</div>`:`<div class="sem-arq">Nenhuma foto anexada no Monday.</div>`}</div>
    <div class="gv-sec"><h3>${ico.clip} Orçamentos</h3>${orc.length?`<ul class="arqs">${orc.map(arq).join("")}</ul>`:`<div class="sem-arq">Nenhum orçamento anexado.</div>`}</div>
    <div class="gv-sec"><h3>${ico.doc} NF-e</h3>${d.nfeArq?`<ul class="arqs">${arq(d.nfeArq)}</ul>`:`<div class="sem-arq">${d.nfe?"Número informado, arquivo não anexado.":"Sem nota fiscal vinculada."}</div>`}</div>
    ${d.obs?`<div class="gv-sec"><h3>Observações / lições aprendidas</h3><p style="margin:0">${esc(d.obs)}</p></div>`:""}
    ${d.url?`<a class="lock-btn" style="text-align:center;text-decoration:none" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Abrir no Monday</a>`:""}`;
  ultimoFoco=document.activeElement;
  document.getElementById("fundo").hidden=false; g.hidden=false;
  document.getElementById("gv-fechar").focus();
}
function fechar(){document.getElementById("fundo").hidden=true;document.getElementById("gaveta").hidden=true;if(ultimoFoco&&ultimoFoco.focus)ultimoFoco.focus()}
document.getElementById("gv-fechar").addEventListener("click",fechar);
document.getElementById("fundo").addEventListener("click",fechar);
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!document.getElementById("gaveta").hidden)fechar();
  const tr=e.target.closest&&e.target.closest("tr[data-abre]");
  if(tr&&(e.key==="Enter"||e.key===" ")){e.preventDefault();abrir(tr.dataset.abre)}
});
document.addEventListener("click",e=>{const tr=e.target.closest("tr[data-abre]");if(tr)abrir(tr.dataset.abre)});
function aba(qual){
  ["safra","hist"].forEach(a=>{document.getElementById("aba-"+a).hidden=a!==qual;document.getElementById("tab-"+a).setAttribute("aria-current",a===qual?"page":"false")});
  document.getElementById("crumbAba").textContent=qual==="hist"?"Histórico":"Safra atual";
  document.getElementById("pgTitulo").textContent=qual==="hist"?"Histórico entre safras":"Preparação da Safra de Tomate";
  fecharMenu();
  try{history.replaceState(null,"",qual==="hist"?"#historico":"#safra")}catch(e){}
}
function fecharMenu(){document.getElementById("side").classList.remove("open");document.querySelector(".scrim")?.remove()}
document.getElementById("menuBtn").addEventListener("click",()=>{const s=document.getElementById("side");s.classList.add("open");const sc=document.createElement("div");sc.className="scrim";sc.onclick=fecharMenu;document.body.appendChild(sc)});
function irLista(){document.getElementById("atividades").scrollIntoView({behavior:"smooth",block:"start"})}
document.addEventListener("click",e=>{
  const lim=e.target.closest("[data-limpa]"); if(lim){st[lim.dataset.limpa]=lim.dataset.limpa==="kpi"?"todas":null;render();return}
  const b=e.target.closest("button"); if(!b) return;
  if(b.dataset.aba){aba(b.dataset.aba);return}
  if(b.dataset.foco||b.dataset.kpi||b.dataset.d) aba("safra");
  if(b.dataset.s){st.safra=b.dataset.s;st.dept=null;st.kpi="todas";render()}
  else if(b.dataset.kpi){st.kpi=b.dataset.kpi;render();irLista()}
  else if(b.dataset.d){fecharMenu();const g=document.getElementById(gid(b.dataset.d));if(g)g.scrollIntoView({behavior:"smooth",block:"start"})}
  else if(b.dataset.foco){st.kpi="todas";st.dept=null;st.foco=b.dataset.foco;render()}
});
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.dataset&&e.target.dataset.limpa){e.preventDefault();e.target.click()}});

function iniciar(){const s=safras(),ano=String(new Date().getFullYear()+1);st.safra=s.includes(ano)?ano:s[s.length-1];render();if(location.hash==="#historico")aba("hist")}
/* ---------- Acesso aos dados criptografados ----------
   A automação (GitHub Actions) busca o Monday, criptografa com AES-256-GCM
   (chave derivada da senha por PBKDF2-SHA256) e publica data/dados.enc.json.
   A senha nunca vai para o repositório: é digitada aqui e a decifragem acontece
   só no navegador. */
const ARQ_DADOS="data/dados.enc.json", CHAVE_SENHA="safraTomate.acesso";
let PKG=null;
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function decifrar(pkg,senha){
  const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(senha),"PBKDF2",false,["deriveKey"]);
  const chave=await crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:b64(pkg.salt),iterations:pkg.iter},base,{name:"AES-GCM",length:256},false,["decrypt"]);
  const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(pkg.iv)},chave,b64(pkg.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
const guardada=()=>{try{return sessionStorage.getItem(CHAVE_SENHA)||localStorage.getItem(CHAVE_SENHA)}catch(e){return null}};
function guardar(senha,lembrar){try{sessionStorage.setItem(CHAVE_SENHA,senha);if(lembrar)localStorage.setItem(CHAVE_SENHA,senha)}catch(e){}}
function esquecer(){try{sessionStorage.removeItem(CHAVE_SENHA);localStorage.removeItem(CHAVE_SENHA)}catch(e){}}
async function tentar(senha){
  try{
    const dados=await decifrar(PKG,senha);
    DADOS=Array.isArray(dados.itens)?dados.itens:[];
    const quando=dados.gerado?new Date(dados.gerado).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"";
    document.getElementById("fonteSub").textContent="Atualizado em "+quando;
    document.getElementById("rodapeFonte").textContent=`Fonte: quadro “Safra de Tomate – Preparação e Investimentos” (Monday) · atualizado em ${quando}.`;
    document.getElementById("btnBloquear").hidden=false;
    document.getElementById("lock").hidden=true;
    iniciar();return true;
  }catch(e){return false}
}
function mostrarAcesso(msg){
  const l=document.getElementById("lock");l.hidden=false;
  document.getElementById("lockErr").textContent=msg||"";
  setTimeout(()=>document.getElementById("senha").focus(),30);
}
document.getElementById("lockForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const s=document.getElementById("senha"),btn=document.getElementById("lockBtn");
  if(!PKG){mostrarAcesso("Os dados ainda não foram carregados. Recarregue a página.");return}
  btn.disabled=true;btn.textContent="Verificando…";
  const ok=await tentar(s.value);
  btn.disabled=false;btn.textContent="Entrar";
  if(ok){guardar(s.value,document.getElementById("lembrar").checked);s.value=""}
  else{s.select();mostrarAcesso("Senha incorreta. Confira com o PCM.")}
});
document.getElementById("btnBloquear").addEventListener("click",()=>{esquecer();location.reload()});
async function carregar(){
  let r=null;
  try{r=await fetch(ARQ_DADOS,{cache:"no-store"})}catch(e){}
  if(r&&r.status===404){
    // Sem dados publicados ainda: pré-visualização com exemplos
    DADOS=EXEMPLO;
    document.getElementById("fonteSub").textContent="Dados de exemplo (automação ainda não rodou)";
    document.getElementById("rodapeFonte").textContent="Exibindo dados de EXEMPLO. Os dados reais aparecem depois da primeira execução da automação.";
    iniciar();return;
  }
  if(!r||!r.ok){mostrarAcesso("Não foi possível carregar os dados. Verifique a conexão e recarregue.");return}
  try{PKG=await r.json()}catch(e){mostrarAcesso("Arquivo de dados inválido. Avise o PCM.");return}
  const s=guardada();
  if(s&&await tentar(s))return;
  if(s)esquecer();
  mostrarAcesso();
}
carregar();
